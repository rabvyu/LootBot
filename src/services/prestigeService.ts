// Serviço de Prestige/Rebirth
import { Prestige, IPrestige, PrestigeUpgrade, RebirthHistory } from '../database/models';

// Configurações de prestige
const PRESTIGE_CONFIG = {
  minLevelForRebirth: 50,
  basePointsPerLevel: 10,
  achievementBonusPercent: 0.1, // 10% extra por cada 10 achievements
  raidBonusPercent: 0.05, // 5% extra por cada 5 raids completas
  maxHeritageSlots: 5,
  heritageSlotCost: 500, // Custo em prestige points
};

// Definições de upgrades de prestígio
interface PrestigeUpgradeDef {
  upgradeId: string;
  name: string;
  description: string;
  maxLevel: number;
  effectPerLevel: number;
  baseCost: number;
  costMultiplier: number;
  effectType: 'xp' | 'loot' | 'gold' | 'stats' | 'special';
}

// Definições de níveis de prestígio
interface PrestigeTier {
  tier: string;
  name: string;
  requiredRebirths: number;
  color: string;
  bonusMultiplier: number;
}

const PRESTIGE_UPGRADES: PrestigeUpgradeDef[] = [
  {
    upgradeId: 'xp_boost',
    name: 'Sabedoria Ancestral',
    description: 'Aumenta ganho de XP',
    maxLevel: 20,
    effectPerLevel: 0.05, // 5% por nível
    baseCost: 50,
    costMultiplier: 1.5,
    effectType: 'xp',
  },
  {
    upgradeId: 'gold_boost',
    name: 'Toque de Midas',
    description: 'Aumenta ganho de moedas',
    maxLevel: 20,
    effectPerLevel: 0.05,
    baseCost: 50,
    costMultiplier: 1.5,
    effectType: 'gold',
  },
  {
    upgradeId: 'loot_boost',
    name: 'Sorte do Veterano',
    description: 'Aumenta chance de loot raro',
    maxLevel: 15,
    effectPerLevel: 0.03,
    baseCost: 75,
    costMultiplier: 1.6,
    effectType: 'loot',
  },
  {
    upgradeId: 'stats_boost',
    name: 'Força Interior',
    description: 'Aumenta atributos base',
    maxLevel: 15,
    effectPerLevel: 0.04,
    baseCost: 100,
    costMultiplier: 1.7,
    effectType: 'stats',
  },
  {
    upgradeId: 'starting_level',
    name: 'Memória do Passado',
    description: 'Começa em nível mais alto após rebirth',
    maxLevel: 10,
    effectPerLevel: 1, // 1 nível por upgrade
    baseCost: 150,
    costMultiplier: 2.0,
    effectType: 'special',
  },
  {
    upgradeId: 'heritage_slots',
    name: 'Herança Expandida',
    description: 'Mais slots para itens herdados',
    maxLevel: 5,
    effectPerLevel: 1, // 1 slot por nível
    baseCost: 200,
    costMultiplier: 2.5,
    effectType: 'special',
  },
];

const PRESTIGE_TIERS: PrestigeTier[] = [
  { tier: 'None', name: 'Sem Prestígio', requiredRebirths: 0, color: '#808080', bonusMultiplier: 1.0 },
  { tier: 'Bronze', name: 'Bronze', requiredRebirths: 1, color: '#CD7F32', bonusMultiplier: 1.1 },
  { tier: 'Silver', name: 'Prata', requiredRebirths: 3, color: '#C0C0C0', bonusMultiplier: 1.2 },
  { tier: 'Gold', name: 'Ouro', requiredRebirths: 5, color: '#FFD700', bonusMultiplier: 1.3 },
  { tier: 'Platinum', name: 'Platina', requiredRebirths: 8, color: '#E5E4E2', bonusMultiplier: 1.4 },
  { tier: 'Diamond', name: 'Diamante', requiredRebirths: 12, color: '#B9F2FF', bonusMultiplier: 1.5 },
  { tier: 'Master', name: 'Mestre', requiredRebirths: 17, color: '#9400D3', bonusMultiplier: 1.7 },
  { tier: 'Grandmaster', name: 'Grão-Mestre', requiredRebirths: 25, color: '#FF4500', bonusMultiplier: 2.0 },
  { tier: 'Legend', name: 'Lenda', requiredRebirths: 35, color: '#FFD700', bonusMultiplier: 2.5 },
  { tier: 'Mythic', name: 'Mítico', requiredRebirths: 50, color: '#FF1493', bonusMultiplier: 3.0 },
];

// Obter ou criar perfil de prestígio
export async function getOrCreatePrestige(odiscordId: string): Promise<IPrestige> {
  let prestige = await Prestige.findOne({ odiscordId });

  if (!prestige) {
    prestige = new Prestige({
      odiscordId,
      prestigeLevel: 'None',
      totalRebirths: 0,
      totalPrestigePoints: 0,
      availablePoints: 0,
      upgrades: PRESTIGE_UPGRADES.map(u => ({
        upgradeId: u.upgradeId,
        name: u.name,
        level: 0,
        maxLevel: u.maxLevel,
        effectPerLevel: u.effectPerLevel,
        costPerLevel: u.baseCost,
      })),
      heritageSlotsUsed: 0,
      heritageItems: [],
      rebirthHistory: [],
      highestLevelReached: 0,
      xpMultiplier: 1,
      lootMultiplier: 1,
      goldMultiplier: 1,
      statsMultiplier: 1,
    });
    await prestige.save();
  }

  return prestige.toObject();
}

// Calcular pontos de rebirth
export function calculateRebirthPoints(
  currentLevel: number,
  achievements: number = 0,
  raidsCompleted: number = 0
): { basePoints: number; achievementBonus: number; raidBonus: number; total: number } {
  const basePoints = Math.floor((currentLevel - PRESTIGE_CONFIG.minLevelForRebirth + 1) * PRESTIGE_CONFIG.basePointsPerLevel);
  const achievementBonus = Math.floor(basePoints * (Math.floor(achievements / 10) * PRESTIGE_CONFIG.achievementBonusPercent));
  const raidBonus = Math.floor(basePoints * (Math.floor(raidsCompleted / 5) * PRESTIGE_CONFIG.raidBonusPercent));

  return {
    basePoints,
    achievementBonus,
    raidBonus,
    total: basePoints + achievementBonus + raidBonus,
  };
}

// Realizar rebirth
export async function performRebirth(
  odiscordId: string,
  currentLevel: number,
  achievements: number = 0,
  raidsCompleted: number = 0,
  coinsToRetain: number = 0,
  itemsToRetain: string[] = []
): Promise<{
  success: boolean;
  pointsEarned?: number;
  newTier?: PrestigeTier;
  message: string;
}> {
  if (currentLevel < PRESTIGE_CONFIG.minLevelForRebirth) {
    return {
      success: false,
      message: `Você precisa ser nível ${PRESTIGE_CONFIG.minLevelForRebirth} para fazer rebirth.`,
    };
  }

  let prestige = await Prestige.findOne({ odiscordId });
  if (!prestige) {
    await getOrCreatePrestige(odiscordId);
    prestige = await Prestige.findOne({ odiscordId });
    if (!prestige) {
      return { success: false, message: 'Erro ao acessar prestige.' };
    }
  }

  // Verificar slots de herança
  const heritageUpgrade = prestige.upgrades.find(u => u.upgradeId === 'heritage_slots');
  const maxHeritageSlots = (heritageUpgrade?.level || 0) + 1;

  if (itemsToRetain.length > maxHeritageSlots) {
    return {
      success: false,
      message: `Você só pode manter ${maxHeritageSlots} itens. Desbloqueie mais slots com upgrades.`,
    };
  }

  // Calcular pontos
  const points = calculateRebirthPoints(currentLevel, achievements, raidsCompleted);

  // Registrar histórico
  const historyEntry: RebirthHistory = {
    rebirthNumber: prestige.totalRebirths + 1,
    levelAtRebirth: currentLevel,
    pointsEarned: points.basePoints,
    achievementBonus: points.achievementBonus,
    raidBonus: points.raidBonus,
    otherBonus: 0,
    coinsRetained: coinsToRetain,
    itemsRetained: itemsToRetain,
    rebirthedAt: new Date(),
  };

  prestige.rebirthHistory.push(historyEntry);
  if (prestige.rebirthHistory.length > 50) {
    prestige.rebirthHistory = prestige.rebirthHistory.slice(-50);
  }

  // Atualizar stats
  prestige.totalRebirths++;
  prestige.totalPrestigePoints += points.total;
  prestige.availablePoints += points.total;
  prestige.highestLevelReached = Math.max(prestige.highestLevelReached, currentLevel);
  prestige.heritageItems = itemsToRetain;
  prestige.heritageSlotsUsed = itemsToRetain.length;

  // Atualizar tier
  const newTier = PRESTIGE_TIERS.slice().reverse().find(t => prestige!.totalRebirths >= t.requiredRebirths) || PRESTIGE_TIERS[0];
  prestige.prestigeLevel = newTier.tier;
  prestige.titleColor = newTier.color;

  await prestige.save();

  return {
    success: true,
    pointsEarned: points.total,
    newTier,
    message: `Rebirth #${prestige.totalRebirths} completo! Ganhou ${points.total} pontos de prestígio.`,
  };
}

// Comprar upgrade
export async function purchaseUpgrade(
  odiscordId: string,
  upgradeId: string
): Promise<{ success: boolean; newLevel?: number; cost?: number; message: string }> {
  const prestige = await Prestige.findOne({ odiscordId });
  if (!prestige) {
    return { success: false, message: 'Prestige não encontrado.' };
  }

  const upgrade = prestige.upgrades.find(u => u.upgradeId === upgradeId);
  if (!upgrade) {
    return { success: false, message: 'Upgrade não encontrado.' };
  }

  const upgradeDef = PRESTIGE_UPGRADES.find(u => u.upgradeId === upgradeId);
  if (!upgradeDef) {
    return { success: false, message: 'Definição do upgrade não encontrada.' };
  }

  if (upgrade.level >= upgrade.maxLevel) {
    return { success: false, message: 'Este upgrade já está no nível máximo.' };
  }

  // Calcular custo
  const cost = Math.floor(upgradeDef.baseCost * Math.pow(upgradeDef.costMultiplier, upgrade.level));

  if (prestige.availablePoints < cost) {
    return { success: false, message: `Pontos insuficientes. Necessário: ${cost}, Disponível: ${prestige.availablePoints}.` };
  }

  // Aplicar upgrade
  prestige.availablePoints -= cost;
  upgrade.level++;

  // Atualizar multiplicadores
  recalculateMultipliers(prestige);

  await prestige.save();

  return {
    success: true,
    newLevel: upgrade.level,
    cost,
    message: `${upgrade.name} melhorado para nível ${upgrade.level}!`,
  };
}

// Recalcular multiplicadores
function recalculateMultipliers(prestige: any): void {
  let xpMult = 1;
  let goldMult = 1;
  let lootMult = 1;
  let statsMult = 1;

  // Bônus do tier
  const tier = PRESTIGE_TIERS.slice().reverse().find(t => prestige.totalRebirths >= t.requiredRebirths) || PRESTIGE_TIERS[0];
  const tierBonus = tier.bonusMultiplier;

  for (const upgrade of prestige.upgrades) {
    const def = PRESTIGE_UPGRADES.find(u => u.upgradeId === upgrade.upgradeId);
    if (!def) continue;

    const effect = upgrade.level * upgrade.effectPerLevel;

    switch (def.effectType) {
      case 'xp':
        xpMult += effect;
        break;
      case 'gold':
        goldMult += effect;
        break;
      case 'loot':
        lootMult += effect;
        break;
      case 'stats':
        statsMult += effect;
        break;
    }
  }

  prestige.xpMultiplier = xpMult * tierBonus;
  prestige.goldMultiplier = goldMult * tierBonus;
  prestige.lootMultiplier = lootMult * tierBonus;
  prestige.statsMultiplier = statsMult * tierBonus;
}

// Obter nível inicial após rebirth
export async function getStartingLevel(odiscordId: string): Promise<number> {
  const prestige = await Prestige.findOne({ odiscordId });
  if (!prestige) return 1;

  const upgrade = prestige.upgrades.find(u => u.upgradeId === 'starting_level');
  return 1 + (upgrade?.level || 0);
}

// Obter itens herdados
export async function getHeritageItems(odiscordId: string): Promise<string[]> {
  const prestige = await Prestige.findOne({ odiscordId });
  return prestige?.heritageItems || [];
}

// Obter definições de upgrades
export function getUpgradeDefinitions(): PrestigeUpgradeDef[] {
  return PRESTIGE_UPGRADES;
}

// Obter tiers de prestígio
export function getPrestigeTiers(): PrestigeTier[] {
  return PRESTIGE_TIERS;
}

// Obter próximo tier
export function getNextTier(currentRebirths: number): PrestigeTier | null {
  return PRESTIGE_TIERS.find(t => t.requiredRebirths > currentRebirths) || null;
}

// Obter ranking de prestígio
export async function getPrestigeLeaderboard(limit: number = 10): Promise<Array<{
  odiscordId: string;
  prestigeLevel: string;
  totalRebirths: number;
  totalPrestigePoints: number;
}>> {
  const prestiges = await Prestige.find()
    .sort({ totalRebirths: -1, totalPrestigePoints: -1 })
    .limit(limit)
    .lean();

  return prestiges.map(p => ({
    odiscordId: p.odiscordId,
    prestigeLevel: p.prestigeLevel,
    totalRebirths: p.totalRebirths,
    totalPrestigePoints: p.totalPrestigePoints,
  }));
}

// Obter multiplicadores do jogador
export async function getPlayerMultipliers(odiscordId: string): Promise<{
  xp: number;
  gold: number;
  loot: number;
  stats: number;
}> {
  const prestige = await Prestige.findOne({ odiscordId });
  if (!prestige) {
    return { xp: 1, gold: 1, loot: 1, stats: 1 };
  }

  return {
    xp: prestige.xpMultiplier,
    gold: prestige.goldMultiplier,
    loot: prestige.lootMultiplier,
    stats: prestige.statsMultiplier,
  };
}
