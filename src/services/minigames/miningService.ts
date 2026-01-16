// Serviço de Mineração
import { MiningProfile, IMiningProfile, MinedOre } from '../../database/models/Minigames';

// Definições de minérios
interface OreDefinition {
  oreId: string;
  name: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  baseValue: number;
  energyCost: number;
  mines: string[];
  minLevel?: number;
}

// Definições de minas
interface MineDefinition {
  mineId: string;
  name: string;
  requiredLevel: number;
  oreMultiplier: number;
}

// Definições de picaretas
interface PickaxeDefinition {
  pickaxeId: string;
  name: string;
  rarityBonus: number;
  energyReduction: number;
  cost: number;
}

const ORE_DATABASE: OreDefinition[] = [
  // Common
  { oreId: 'stone', name: 'Pedra', rarity: 'common', baseValue: 2, energyCost: 5, mines: ['starter', 'cave', 'mountain'] },
  { oreId: 'copper', name: 'Cobre', rarity: 'common', baseValue: 8, energyCost: 8, mines: ['starter', 'cave', 'mountain'] },
  { oreId: 'iron', name: 'Ferro', rarity: 'common', baseValue: 15, energyCost: 10, mines: ['starter', 'cave', 'mountain', 'deep'] },
  // Uncommon
  { oreId: 'silver', name: 'Prata', rarity: 'uncommon', baseValue: 30, energyCost: 15, mines: ['cave', 'mountain', 'deep'], minLevel: 5 },
  { oreId: 'gold', name: 'Ouro', rarity: 'uncommon', baseValue: 50, energyCost: 20, mines: ['cave', 'mountain', 'deep'], minLevel: 10 },
  // Rare
  { oreId: 'ruby', name: 'Rubi', rarity: 'rare', baseValue: 150, energyCost: 30, mines: ['mountain', 'deep', 'volcano'], minLevel: 15 },
  { oreId: 'sapphire', name: 'Safira', rarity: 'rare', baseValue: 180, energyCost: 35, mines: ['mountain', 'deep'], minLevel: 18 },
  // Epic
  { oreId: 'diamond', name: 'Diamante', rarity: 'epic', baseValue: 500, energyCost: 50, mines: ['deep', 'volcano'], minLevel: 25 },
  { oreId: 'mithril', name: 'Mithril', rarity: 'epic', baseValue: 700, energyCost: 60, mines: ['deep'], minLevel: 30 },
  // Legendary
  { oreId: 'adamantite', name: 'Adamantita', rarity: 'legendary', baseValue: 2000, energyCost: 80, mines: ['volcano'], minLevel: 40 },
  { oreId: 'void_crystal', name: 'Cristal do Vazio', rarity: 'legendary', baseValue: 3000, energyCost: 100, mines: ['deep'], minLevel: 45 },
];

const MINES: MineDefinition[] = [
  { mineId: 'starter', name: 'Mina Iniciante', requiredLevel: 1, oreMultiplier: 1.0 },
  { mineId: 'cave', name: 'Caverna Escura', requiredLevel: 5, oreMultiplier: 1.3 },
  { mineId: 'mountain', name: 'Mina da Montanha', requiredLevel: 12, oreMultiplier: 1.6 },
  { mineId: 'deep', name: 'Abismo Profundo', requiredLevel: 25, oreMultiplier: 2.0 },
  { mineId: 'volcano', name: 'Mina Vulcânica', requiredLevel: 35, oreMultiplier: 2.5 },
];

const PICKAXES: PickaxeDefinition[] = [
  { pickaxeId: 'wooden_pickaxe', name: 'Picareta de Madeira', rarityBonus: 0, energyReduction: 0, cost: 0 },
  { pickaxeId: 'stone_pickaxe', name: 'Picareta de Pedra', rarityBonus: 0.03, energyReduction: 0.05, cost: 300 },
  { pickaxeId: 'iron_pickaxe', name: 'Picareta de Ferro', rarityBonus: 0.08, energyReduction: 0.1, cost: 1500 },
  { pickaxeId: 'gold_pickaxe', name: 'Picareta de Ouro', rarityBonus: 0.15, energyReduction: 0.15, cost: 8000 },
  { pickaxeId: 'diamond_pickaxe', name: 'Picareta de Diamante', rarityBonus: 0.25, energyReduction: 0.25, cost: 40000 },
];

const RARITY_CHANCES: Record<string, number> = {
  common: 0.55,
  uncommon: 0.28,
  rare: 0.12,
  epic: 0.04,
  legendary: 0.01,
};

// Obter ou criar perfil de mineração
export async function getOrCreateMiningProfile(odiscordId: string): Promise<IMiningProfile> {
  let profile = await MiningProfile.findOne({ odiscordId });

  if (!profile) {
    profile = new MiningProfile({
      odiscordId,
      currentMine: 'starter',
      miningLevel: 1,
      miningXp: 0,
      totalOresMined: 0,
      oreCollection: [],
      equippedPickaxe: 'wooden_pickaxe',
      energy: 100,
      maxEnergy: 100,
      energyRegenAt: new Date(),
    });
    await profile.save();
  }

  return profile.toObject();
}

// Calcular XP necessário para o próximo nível
function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

// Regenerar energia
async function regenerateEnergy(profile: any): Promise<void> {
  const now = new Date();
  const lastRegen = profile.energyRegenAt || now;
  const minutesPassed = Math.floor((now.getTime() - lastRegen.getTime()) / (60 * 1000));

  if (minutesPassed > 0 && profile.energy < profile.maxEnergy) {
    const energyPerMinute = 1;
    const regenAmount = Math.min(minutesPassed * energyPerMinute, profile.maxEnergy - profile.energy);
    profile.energy = Math.min(profile.energy + regenAmount, profile.maxEnergy);
    profile.energyRegenAt = now;
    await profile.save();
  }
}

// Minerar
export async function mine(odiscordId: string): Promise<{
  success: boolean;
  ores?: MinedOre[];
  xpGained?: number;
  levelUp?: boolean;
  message: string;
}> {
  let profile = await MiningProfile.findOne({ odiscordId });
  if (!profile) {
    await getOrCreateMiningProfile(odiscordId);
    profile = await MiningProfile.findOne({ odiscordId });
    if (!profile) {
      return { success: false, message: 'Erro ao criar perfil.' };
    }
  }

  // Regenerar energia
  await regenerateEnergy(profile);

  // Obter mina atual
  const mine = MINES.find(m => m.mineId === profile!.currentMine) || MINES[0];

  // Obter picareta equipada
  const pickaxe = PICKAXES.find(p => p.pickaxeId === profile!.equippedPickaxe) || PICKAXES[0];

  // Verificar energia
  const baseEnergyCost = 10;
  const actualEnergyCost = Math.floor(baseEnergyCost * (1 - pickaxe.energyReduction));

  if (profile.energy < actualEnergyCost) {
    const timeToRegen = Math.ceil((actualEnergyCost - profile.energy) / 1);
    return { success: false, message: `Energia insuficiente! Aguarde ${timeToRegen} minutos.` };
  }

  // Determinar quantos minérios encontrar (1-3)
  const oreCount = Math.floor(Math.random() * 3) + 1;
  const minedOres: MinedOre[] = [];
  let totalXp = 0;

  for (let i = 0; i < oreCount; i++) {
    // Determinar raridade
    let roll = Math.random();
    roll += pickaxe.rarityBonus;

    let selectedRarity = 'common';
    let cumulative = 0;
    for (const [rarity, chance] of Object.entries(RARITY_CHANCES)) {
      cumulative += chance;
      if (roll <= cumulative) {
        selectedRarity = rarity;
        break;
      }
    }

    // Filtrar minérios disponíveis
    let availableOres = ORE_DATABASE.filter(o =>
      o.rarity === selectedRarity &&
      o.mines.includes(mine.mineId) &&
      (!o.minLevel || profile!.miningLevel >= o.minLevel)
    );

    if (availableOres.length === 0) {
      availableOres = ORE_DATABASE.filter(o =>
        o.rarity === 'common' && o.mines.includes(mine.mineId)
      );
    }

    if (availableOres.length === 0) continue;

    // Selecionar minério aleatório
    const oreDef = availableOres[Math.floor(Math.random() * availableOres.length)];

    // Calcular quantidade
    const quantity = Math.floor((Math.random() * 3 + 1) * mine.oreMultiplier);

    // Criar registro do minério
    const minedOre: MinedOre = {
      oreId: oreDef.oreId,
      name: oreDef.name,
      rarity: oreDef.rarity,
      quantity,
      minedAt: new Date(),
      mine: mine.mineId,
    };

    minedOres.push(minedOre);

    // Atualizar coleção
    const collectionEntry = profile.oreCollection.find(c => c.oreId === oreDef.oreId);
    if (collectionEntry) {
      collectionEntry.totalMined += quantity;
    } else {
      profile.oreCollection.push({
        oreId: oreDef.oreId,
        totalMined: quantity,
      });
    }

    // Calcular XP
    const rarityXp: Record<string, number> = {
      common: 5,
      uncommon: 15,
      rare: 35,
      epic: 75,
      legendary: 200,
    };
    totalXp += (rarityXp[oreDef.rarity] || 5) * quantity;
  }

  if (minedOres.length === 0) {
    return { success: false, message: 'Não encontrou nada desta vez.' };
  }

  // Aplicar XP e verificar level up
  profile.miningXp += Math.floor(totalXp * mine.oreMultiplier);
  profile.totalOresMined += minedOres.reduce((sum, o) => sum + o.quantity, 0);
  profile.energy -= actualEnergyCost;
  profile.lastMinedAt = new Date();

  let levelUp = false;
  const xpRequired = xpForLevel(profile.miningLevel);
  if (profile.miningXp >= xpRequired) {
    profile.miningXp -= xpRequired;
    profile.miningLevel++;
    profile.maxEnergy += 5;
    levelUp = true;
  }

  await profile.save();

  const oreList = minedOres.map(o => `${o.name} x${o.quantity}`).join(', ');

  return {
    success: true,
    ores: minedOres,
    xpGained: totalXp,
    levelUp,
    message: `Você minerou: ${oreList}!${levelUp ? ` Subiu para nível ${profile.miningLevel}!` : ''}`,
  };
}

// Mudar mina
export async function changeMine(
  odiscordId: string,
  mineId: string
): Promise<{ success: boolean; message: string }> {
  const mine = MINES.find(m => m.mineId === mineId);
  if (!mine) {
    return { success: false, message: 'Mina não encontrada.' };
  }

  const profile = await MiningProfile.findOne({ odiscordId });
  if (!profile) {
    return { success: false, message: 'Perfil não encontrado.' };
  }

  if (profile.miningLevel < mine.requiredLevel) {
    return { success: false, message: `Você precisa de nível ${mine.requiredLevel} para minerar aqui.` };
  }

  profile.currentMine = mineId;
  await profile.save();

  return { success: true, message: `Você foi para ${mine.name}!` };
}

// Equipar picareta
export async function equipPickaxe(
  odiscordId: string,
  pickaxeId: string
): Promise<{ success: boolean; message: string }> {
  const pickaxe = PICKAXES.find(p => p.pickaxeId === pickaxeId);
  if (!pickaxe) {
    return { success: false, message: 'Picareta não encontrada.' };
  }

  await MiningProfile.updateOne({ odiscordId }, { equippedPickaxe: pickaxeId });

  return { success: true, message: `${pickaxe.name} equipada!` };
}

// Obter ranking de mineração
export async function getMiningLeaderboard(limit: number = 10): Promise<Array<{
  odiscordId: string;
  totalOresMined: number;
  miningLevel: number;
}>> {
  const profiles = await MiningProfile.find()
    .sort({ totalOresMined: -1 })
    .limit(limit)
    .lean();

  return profiles.map(p => ({
    odiscordId: p.odiscordId,
    totalOresMined: p.totalOresMined,
    miningLevel: p.miningLevel,
  }));
}

export function getMines(): MineDefinition[] {
  return MINES;
}

export function getPickaxes(): PickaxeDefinition[] {
  return PICKAXES;
}
