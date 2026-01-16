// Serviço de Pesca
import { FishingProfile, IFishingProfile, CaughtFish } from '../../database/models/Minigames';

// Definições de peixes
interface FishDefinition {
  fishId: string;
  name: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  baseWeight: number;
  weightVariance: number;
  baseValue: number;
  zones: string[];
  minLevel?: number;
}

// Definições de zonas
interface ZoneDefinition {
  zoneId: string;
  name: string;
  requiredLevel: number;
  fishMultiplier: number;
}

// Definições de varas
interface RodDefinition {
  rodId: string;
  name: string;
  rarityBonus: number;
  weightBonus: number;
  cost: number;
}

const FISH_DATABASE: FishDefinition[] = [
  // Common
  { fishId: 'sardine', name: 'Sardinha', rarity: 'common', baseWeight: 0.2, weightVariance: 0.1, baseValue: 5, zones: ['lake', 'river', 'sea'] },
  { fishId: 'trout', name: 'Truta', rarity: 'common', baseWeight: 1.5, weightVariance: 0.5, baseValue: 10, zones: ['lake', 'river'] },
  { fishId: 'carp', name: 'Carpa', rarity: 'common', baseWeight: 2, weightVariance: 1, baseValue: 15, zones: ['lake', 'river'] },
  // Uncommon
  { fishId: 'salmon', name: 'Salmão', rarity: 'uncommon', baseWeight: 4, weightVariance: 1.5, baseValue: 30, zones: ['river', 'sea'], minLevel: 5 },
  { fishId: 'bass', name: 'Robalo', rarity: 'uncommon', baseWeight: 3, weightVariance: 1, baseValue: 25, zones: ['sea'], minLevel: 5 },
  // Rare
  { fishId: 'tuna', name: 'Atum', rarity: 'rare', baseWeight: 20, weightVariance: 10, baseValue: 100, zones: ['sea', 'deep_sea'], minLevel: 15 },
  { fishId: 'catfish', name: 'Bagre Gigante', rarity: 'rare', baseWeight: 15, weightVariance: 5, baseValue: 80, zones: ['river'], minLevel: 10 },
  // Epic
  { fishId: 'swordfish', name: 'Peixe-espada', rarity: 'epic', baseWeight: 50, weightVariance: 20, baseValue: 300, zones: ['deep_sea'], minLevel: 25 },
  { fishId: 'golden_carp', name: 'Carpa Dourada', rarity: 'epic', baseWeight: 5, weightVariance: 2, baseValue: 500, zones: ['lake'], minLevel: 20 },
  // Legendary
  { fishId: 'leviathan', name: 'Leviatã', rarity: 'legendary', baseWeight: 200, weightVariance: 50, baseValue: 2000, zones: ['deep_sea'], minLevel: 40 },
  { fishId: 'ghost_fish', name: 'Peixe Fantasma', rarity: 'legendary', baseWeight: 0.5, weightVariance: 0.2, baseValue: 1500, zones: ['lake'], minLevel: 35 },
];

const ZONES: ZoneDefinition[] = [
  { zoneId: 'lake', name: 'Lago', requiredLevel: 1, fishMultiplier: 1.0 },
  { zoneId: 'river', name: 'Rio', requiredLevel: 5, fishMultiplier: 1.2 },
  { zoneId: 'sea', name: 'Mar', requiredLevel: 10, fishMultiplier: 1.5 },
  { zoneId: 'deep_sea', name: 'Mar Profundo', requiredLevel: 20, fishMultiplier: 2.0 },
];

const RODS: RodDefinition[] = [
  { rodId: 'basic_rod', name: 'Vara Básica', rarityBonus: 0, weightBonus: 0, cost: 0 },
  { rodId: 'wooden_rod', name: 'Vara de Madeira', rarityBonus: 0.05, weightBonus: 0.1, cost: 500 },
  { rodId: 'steel_rod', name: 'Vara de Aço', rarityBonus: 0.1, weightBonus: 0.2, cost: 2000 },
  { rodId: 'golden_rod', name: 'Vara Dourada', rarityBonus: 0.2, weightBonus: 0.3, cost: 10000 },
  { rodId: 'legendary_rod', name: 'Vara Lendária', rarityBonus: 0.3, weightBonus: 0.5, cost: 50000 },
];

const RARITY_CHANCES: Record<string, number> = {
  common: 0.60,
  uncommon: 0.25,
  rare: 0.10,
  epic: 0.04,
  legendary: 0.01,
};

// Obter ou criar perfil de pesca
export async function getOrCreateFishingProfile(odiscordId: string): Promise<IFishingProfile> {
  let profile = await FishingProfile.findOne({ odiscordId });

  if (!profile) {
    profile = new FishingProfile({
      odiscordId,
      currentZone: 'lake',
      fishingLevel: 1,
      fishingXp: 0,
      totalFishCaught: 0,
      fishCollection: [],
      recentCatches: [],
      equippedRod: 'basic_rod',
      baitCount: 0,
      dailyFishCount: 0,
      lastDailyReset: new Date(),
    });
    await profile.save();
  }

  return profile.toObject();
}

// Calcular XP necessário para o próximo nível
function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

// Pescar
export async function fish(odiscordId: string): Promise<{
  success: boolean;
  fish?: CaughtFish;
  xpGained?: number;
  levelUp?: boolean;
  message: string;
}> {
  const profile = await FishingProfile.findOne({ odiscordId });
  if (!profile) {
    await getOrCreateFishingProfile(odiscordId);
    return await fish(odiscordId);
  }

  // Verificar cooldown
  if (profile.lastFishedAt) {
    const cooldown = 30 * 1000; // 30 segundos
    const elapsed = Date.now() - profile.lastFishedAt.getTime();
    if (elapsed < cooldown) {
      const remaining = Math.ceil((cooldown - elapsed) / 1000);
      return { success: false, message: `Aguarde ${remaining}s para pescar novamente.` };
    }
  }

  // Resetar diário se necessário
  const now = new Date();
  if (profile.lastDailyReset.toDateString() !== now.toDateString()) {
    profile.dailyFishCount = 0;
    profile.lastDailyReset = now;
  }

  // Verificar limite diário
  const dailyLimit = 50 + profile.fishingLevel * 5;
  if (profile.dailyFishCount >= dailyLimit) {
    return { success: false, message: 'Você atingiu o limite diário de pescaria!' };
  }

  // Obter zona atual
  const zone = ZONES.find(z => z.zoneId === profile.currentZone) || ZONES[0];

  // Obter vara equipada
  const rod = RODS.find(r => r.rodId === profile.equippedRod) || RODS[0];

  // Determinar raridade
  let roll = Math.random();
  roll += rod.rarityBonus;
  if (profile.equippedBait && profile.baitCount > 0) {
    roll += 0.05;
    profile.baitCount--;
  }

  let selectedRarity = 'common';
  let cumulative = 0;
  for (const [rarity, chance] of Object.entries(RARITY_CHANCES)) {
    cumulative += chance;
    if (roll <= cumulative) {
      selectedRarity = rarity;
      break;
    }
  }

  // Filtrar peixes disponíveis
  const availableFish = FISH_DATABASE.filter(f =>
    f.rarity === selectedRarity &&
    f.zones.includes(zone.zoneId) &&
    (!f.minLevel || profile.fishingLevel >= f.minLevel)
  );

  if (availableFish.length === 0) {
    // Fallback para peixe comum
    const commonFish = FISH_DATABASE.filter(f =>
      f.rarity === 'common' && f.zones.includes(zone.zoneId)
    );
    if (commonFish.length === 0) {
      return { success: false, message: 'Nenhum peixe disponível nesta zona.' };
    }
    availableFish.push(...commonFish);
  }

  // Selecionar peixe aleatório
  const fishDef = availableFish[Math.floor(Math.random() * availableFish.length)];

  // Calcular peso
  const weight = Math.round(
    (fishDef.baseWeight + (Math.random() - 0.5) * fishDef.weightVariance * 2) *
    (1 + rod.weightBonus) * zone.fishMultiplier * 100
  ) / 100;

  // Criar registro do peixe
  const caughtFish: CaughtFish = {
    fishId: fishDef.fishId,
    name: fishDef.name,
    rarity: fishDef.rarity,
    weight,
    caughtAt: new Date(),
    zone: zone.zoneId,
  };

  // Atualizar coleção
  const collectionEntry = profile.fishCollection.find(c => c.fishId === fishDef.fishId);
  if (collectionEntry) {
    collectionEntry.count++;
    collectionEntry.bestWeight = Math.max(collectionEntry.bestWeight, weight);
  } else {
    profile.fishCollection.push({
      fishId: fishDef.fishId,
      count: 1,
      bestWeight: weight,
    });
  }

  // Adicionar às capturas recentes
  profile.recentCatches.push(caughtFish);
  if (profile.recentCatches.length > 10) {
    profile.recentCatches.shift();
  }

  // Calcular XP
  const rarityXp: Record<string, number> = {
    common: 10,
    uncommon: 25,
    rare: 50,
    epic: 100,
    legendary: 250,
  };
  const xpGained = Math.floor((rarityXp[fishDef.rarity] || 10) * zone.fishMultiplier);
  profile.fishingXp += xpGained;

  // Verificar level up
  let levelUp = false;
  const xpRequired = xpForLevel(profile.fishingLevel);
  if (profile.fishingXp >= xpRequired) {
    profile.fishingXp -= xpRequired;
    profile.fishingLevel++;
    levelUp = true;
  }

  profile.totalFishCaught++;
  profile.dailyFishCount++;
  profile.lastFishedAt = new Date();

  await profile.save();

  return {
    success: true,
    fish: caughtFish,
    xpGained,
    levelUp,
    message: `Você pescou um(a) ${fishDef.name} (${weight}kg)!${levelUp ? ` Subiu para nível ${profile.fishingLevel}!` : ''}`,
  };
}

// Mudar zona
export async function changeZone(
  odiscordId: string,
  zoneId: string
): Promise<{ success: boolean; message: string }> {
  const zone = ZONES.find(z => z.zoneId === zoneId);
  if (!zone) {
    return { success: false, message: 'Zona não encontrada.' };
  }

  const profile = await FishingProfile.findOne({ odiscordId });
  if (!profile) {
    return { success: false, message: 'Perfil não encontrado.' };
  }

  if (profile.fishingLevel < zone.requiredLevel) {
    return { success: false, message: `Você precisa de nível ${zone.requiredLevel} para pescar aqui.` };
  }

  profile.currentZone = zoneId;
  await profile.save();

  return { success: true, message: `Você foi para ${zone.name}!` };
}

// Equipar vara
export async function equipRod(
  odiscordId: string,
  rodId: string
): Promise<{ success: boolean; message: string }> {
  const rod = RODS.find(r => r.rodId === rodId);
  if (!rod) {
    return { success: false, message: 'Vara não encontrada.' };
  }

  await FishingProfile.updateOne({ odiscordId }, { equippedRod: rodId });

  return { success: true, message: `${rod.name} equipada!` };
}

// Obter ranking de pesca
export async function getFishingLeaderboard(limit: number = 10): Promise<Array<{
  odiscordId: string;
  totalFishCaught: number;
  fishingLevel: number;
}>> {
  const profiles = await FishingProfile.find()
    .sort({ totalFishCaught: -1 })
    .limit(limit)
    .lean();

  return profiles.map(p => ({
    odiscordId: p.odiscordId,
    totalFishCaught: p.totalFishCaught,
    fishingLevel: p.fishingLevel,
  }));
}

export function getZones(): ZoneDefinition[] {
  return ZONES;
}

export function getRods(): RodDefinition[] {
  return RODS;
}
