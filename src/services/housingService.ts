// Serviço de Housing/Base Pessoal
import { Housing, IHousing, HiredNpc, GardenPlot, StoredDecoration, CraftingStation } from '../database/models';

// Definições de níveis de base
interface BaseLevelDefinition {
  level: number;
  name: string;
  storageSlots: number;
  maxNpcs: number;
  maxGardenPlots: number;
  hasPortal: boolean;
  upgradeCost: number;
}

// Definições de NPCs disponíveis
interface NpcDefinition {
  npcId: string;
  name: string;
  effect: string;
  requiredBaseLevel: number;
  costPerWeek: number;
}

// Definições de plantas
interface SeedDefinition {
  seedId: string;
  name: string;
  growTimeHours: number;
  baseYield: number;
  harvestValue: number;
}

const BASE_LEVELS: BaseLevelDefinition[] = [
  { level: 1, name: 'Tenda', storageSlots: 10, maxNpcs: 0, maxGardenPlots: 0, hasPortal: false, upgradeCost: 0 },
  { level: 2, name: 'Cabana', storageSlots: 20, maxNpcs: 1, maxGardenPlots: 2, hasPortal: false, upgradeCost: 5000 },
  { level: 3, name: 'Casa', storageSlots: 35, maxNpcs: 2, maxGardenPlots: 4, hasPortal: false, upgradeCost: 15000 },
  { level: 4, name: 'Mansão', storageSlots: 50, maxNpcs: 3, maxGardenPlots: 6, hasPortal: true, upgradeCost: 50000 },
  { level: 5, name: 'Fortaleza', storageSlots: 75, maxNpcs: 4, maxGardenPlots: 8, hasPortal: true, upgradeCost: 150000 },
  { level: 6, name: 'Castelo', storageSlots: 100, maxNpcs: 5, maxGardenPlots: 10, hasPortal: true, upgradeCost: 500000 },
];

const AVAILABLE_NPCS: NpcDefinition[] = [
  { npcId: 'blacksmith', name: 'Ferreiro', effect: '+10% durabilidade em equipamentos', requiredBaseLevel: 2, costPerWeek: 500 },
  { npcId: 'cook', name: 'Cozinheiro', effect: '+20% eficácia de comidas', requiredBaseLevel: 2, costPerWeek: 400 },
  { npcId: 'gardener', name: 'Jardineiro', effect: '-25% tempo de crescimento', requiredBaseLevel: 3, costPerWeek: 600 },
  { npcId: 'banker', name: 'Banqueiro', effect: '+0.5% juros diários', requiredBaseLevel: 3, costPerWeek: 800 },
  { npcId: 'trainer', name: 'Treinador', effect: '+15% XP de treino', requiredBaseLevel: 4, costPerWeek: 1000 },
  { npcId: 'enchanter', name: 'Encantador', effect: '+10% chance de encantamento', requiredBaseLevel: 4, costPerWeek: 1200 },
  { npcId: 'merchant', name: 'Mercador', effect: '-10% preço nas lojas', requiredBaseLevel: 5, costPerWeek: 1500 },
  { npcId: 'healer', name: 'Curandeiro', effect: 'Cura gratuita 1x/dia', requiredBaseLevel: 5, costPerWeek: 1000 },
];

const SEED_TYPES: SeedDefinition[] = [
  { seedId: 'wheat', name: 'Trigo', growTimeHours: 4, baseYield: 5, harvestValue: 10 },
  { seedId: 'carrot', name: 'Cenoura', growTimeHours: 6, baseYield: 4, harvestValue: 15 },
  { seedId: 'potato', name: 'Batata', growTimeHours: 8, baseYield: 3, harvestValue: 20 },
  { seedId: 'tomato', name: 'Tomate', growTimeHours: 10, baseYield: 4, harvestValue: 25 },
  { seedId: 'herb', name: 'Erva Medicinal', growTimeHours: 12, baseYield: 2, harvestValue: 50 },
  { seedId: 'mana_flower', name: 'Flor de Mana', growTimeHours: 24, baseYield: 1, harvestValue: 100 },
];

// Obter ou criar housing
export async function getOrCreateHousing(odiscordId: string): Promise<IHousing> {
  let housing = await Housing.findOne({ odiscordId });

  if (!housing) {
    const baseLevel = BASE_LEVELS[0];
    housing = new Housing({
      odiscordId,
      baseLevel: 1,
      baseName: baseLevel.name,
      storageSlots: baseLevel.storageSlots,
      storedItems: [],
      hiredNpcs: [],
      maxNpcs: baseLevel.maxNpcs,
      garden: [],
      maxGardenPlots: baseLevel.maxGardenPlots,
      decorations: [],
      craftingStations: [],
      hasPortal: baseLevel.hasPortal,
      portalCooldownReduction: 0,
      totalUpgradeCost: 0,
    });
    await housing.save();
  }

  return housing.toObject();
}

// Fazer upgrade da base
export async function upgradeBase(odiscordId: string): Promise<{
  success: boolean;
  cost?: number;
  newLevel?: BaseLevelDefinition;
  message: string;
}> {
  const housing = await Housing.findOne({ odiscordId });
  if (!housing) {
    return { success: false, message: 'Housing não encontrado.' };
  }

  if (housing.baseLevel >= BASE_LEVELS.length) {
    return { success: false, message: 'Sua base já está no nível máximo!' };
  }

  const nextLevel = BASE_LEVELS[housing.baseLevel];

  housing.baseLevel = nextLevel.level;
  housing.baseName = nextLevel.name;
  housing.storageSlots = nextLevel.storageSlots;
  housing.maxNpcs = nextLevel.maxNpcs;
  housing.maxGardenPlots = nextLevel.maxGardenPlots;
  housing.hasPortal = nextLevel.hasPortal;
  housing.totalUpgradeCost += nextLevel.upgradeCost;

  await housing.save();

  return {
    success: true,
    cost: nextLevel.upgradeCost,
    newLevel: nextLevel,
    message: `Base melhorada para ${nextLevel.name}!`,
  };
}

// Contratar NPC
export async function hireNpc(
  odiscordId: string,
  npcId: string
): Promise<{ success: boolean; npc?: NpcDefinition; message: string }> {
  const housing = await Housing.findOne({ odiscordId });
  if (!housing) {
    return { success: false, message: 'Housing não encontrado.' };
  }

  const npcDef = AVAILABLE_NPCS.find(n => n.npcId === npcId);
  if (!npcDef) {
    return { success: false, message: 'NPC não encontrado.' };
  }

  if (housing.baseLevel < npcDef.requiredBaseLevel) {
    return { success: false, message: `Sua base precisa ser nível ${npcDef.requiredBaseLevel} para contratar este NPC.` };
  }

  if (housing.hiredNpcs.length >= housing.maxNpcs) {
    return { success: false, message: 'Você atingiu o limite de NPCs contratados.' };
  }

  const alreadyHired = housing.hiredNpcs.find(n => n.npcId === npcId);
  if (alreadyHired) {
    return { success: false, message: 'Este NPC já está contratado.' };
  }

  const hiredNpc: HiredNpc = {
    npcId: npcDef.npcId,
    npcName: npcDef.name,
    effect: npcDef.effect,
    costPerWeek: npcDef.costPerWeek,
    hiredAt: new Date(),
    lastPaidAt: new Date(),
  };

  housing.hiredNpcs.push(hiredNpc);
  await housing.save();

  return {
    success: true,
    npc: npcDef,
    message: `${npcDef.name} contratado! Custo: ${npcDef.costPerWeek}/semana.`,
  };
}

// Demitir NPC
export async function fireNpc(odiscordId: string, npcId: string): Promise<{ success: boolean; message: string }> {
  const housing = await Housing.findOne({ odiscordId });
  if (!housing) {
    return { success: false, message: 'Housing não encontrado.' };
  }

  const npcIndex = housing.hiredNpcs.findIndex(n => n.npcId === npcId);
  if (npcIndex === -1) {
    return { success: false, message: 'Este NPC não está contratado.' };
  }

  const npcName = housing.hiredNpcs[npcIndex].npcName;
  housing.hiredNpcs.splice(npcIndex, 1);
  await housing.save();

  return { success: true, message: `${npcName} demitido.` };
}

// Plantar semente
export async function plantSeed(
  odiscordId: string,
  plotIndex: number,
  seedId: string
): Promise<{ success: boolean; readyAt?: Date; message: string }> {
  const housing = await Housing.findOne({ odiscordId });
  if (!housing) {
    return { success: false, message: 'Housing não encontrado.' };
  }

  const seedDef = SEED_TYPES.find(s => s.seedId === seedId);
  if (!seedDef) {
    return { success: false, message: 'Semente não encontrada.' };
  }

  if (plotIndex < 0 || plotIndex >= housing.maxGardenPlots) {
    return { success: false, message: 'Canteiro inválido.' };
  }

  // Encontrar ou criar o canteiro
  let plot = housing.garden.find(p => p.plotIndex === plotIndex);
  if (!plot) {
    plot = {
      plotIndex,
      watered: false,
      fertilized: false,
      qualityBonus: 0,
    };
    housing.garden.push(plot);
  }

  if (plot.seedId) {
    return { success: false, message: 'Este canteiro já tem uma planta.' };
  }

  // Calcular tempo de crescimento com bônus de jardineiro
  const gardener = housing.hiredNpcs.find(n => n.npcId === 'gardener');
  const growTimeMultiplier = gardener ? 0.75 : 1;
  const growTimeMs = seedDef.growTimeHours * 60 * 60 * 1000 * growTimeMultiplier;

  plot.seedId = seedId;
  plot.seedName = seedDef.name;
  plot.plantedAt = new Date();
  plot.readyAt = new Date(Date.now() + growTimeMs);
  plot.watered = false;
  plot.fertilized = false;

  await housing.save();

  return {
    success: true,
    readyAt: plot.readyAt,
    message: `${seedDef.name} plantado! Pronto em ${seedDef.growTimeHours * (gardener ? 0.75 : 1)} horas.`,
  };
}

// Regar planta
export async function waterPlant(odiscordId: string, plotIndex: number): Promise<{ success: boolean; message: string }> {
  const housing = await Housing.findOne({ odiscordId });
  if (!housing) {
    return { success: false, message: 'Housing não encontrado.' };
  }

  const plot = housing.garden.find(p => p.plotIndex === plotIndex);
  if (!plot || !plot.seedId) {
    return { success: false, message: 'Canteiro vazio.' };
  }

  if (plot.watered) {
    return { success: false, message: 'Planta já foi regada hoje.' };
  }

  plot.watered = true;
  plot.qualityBonus += 0.1;

  // Reduzir tempo de crescimento em 10%
  if (plot.readyAt) {
    const remaining = plot.readyAt.getTime() - Date.now();
    plot.readyAt = new Date(Date.now() + remaining * 0.9);
  }

  await housing.save();

  return { success: true, message: 'Planta regada! Crescimento acelerado em 10%.' };
}

// Colher planta
export async function harvestPlant(odiscordId: string, plotIndex: number): Promise<{
  success: boolean;
  yield?: number;
  value?: number;
  message: string;
}> {
  const housing = await Housing.findOne({ odiscordId });
  if (!housing) {
    return { success: false, message: 'Housing não encontrado.' };
  }

  const plot = housing.garden.find(p => p.plotIndex === plotIndex);
  if (!plot || !plot.seedId) {
    return { success: false, message: 'Canteiro vazio.' };
  }

  if (!plot.readyAt || new Date() < plot.readyAt) {
    return { success: false, message: 'Planta ainda não está pronta.' };
  }

  const seedDef = SEED_TYPES.find(s => s.seedId === plot.seedId);
  if (!seedDef) {
    return { success: false, message: 'Tipo de planta desconhecido.' };
  }

  // Calcular colheita com bônus
  const yieldAmount = Math.floor(seedDef.baseYield * (1 + plot.qualityBonus));
  const totalValue = yieldAmount * seedDef.harvestValue;

  // Limpar canteiro
  plot.seedId = undefined;
  plot.seedName = undefined;
  plot.plantedAt = undefined;
  plot.readyAt = undefined;
  plot.watered = false;
  plot.fertilized = false;
  plot.qualityBonus = 0;

  await housing.save();

  return {
    success: true,
    yield: yieldAmount,
    value: totalValue,
    message: `Colheu ${yieldAmount}x ${seedDef.name}! Valor: ${totalValue} moedas.`,
  };
}

// Guardar item no armazenamento
export async function storeItem(
  odiscordId: string,
  itemId: string,
  itemName: string,
  quantity: number,
  itemData?: any
): Promise<{ success: boolean; message: string }> {
  const housing = await Housing.findOne({ odiscordId });
  if (!housing) {
    return { success: false, message: 'Housing não encontrado.' };
  }

  const usedSlots = housing.storedItems.reduce((sum, i) => sum + i.quantity, 0);
  if (usedSlots + quantity > housing.storageSlots) {
    return { success: false, message: `Espaço insuficiente. Disponível: ${housing.storageSlots - usedSlots}.` };
  }

  const existingItem = housing.storedItems.find(i => i.itemId === itemId);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    housing.storedItems.push({ itemId, itemName, quantity, itemData });
  }

  await housing.save();

  return { success: true, message: `${itemName} x${quantity} armazenado.` };
}

// Retirar item do armazenamento
export async function retrieveItem(
  odiscordId: string,
  itemId: string,
  quantity: number
): Promise<{ success: boolean; itemName?: string; quantity?: number; message: string }> {
  const housing = await Housing.findOne({ odiscordId });
  if (!housing) {
    return { success: false, message: 'Housing não encontrado.' };
  }

  const itemIndex = housing.storedItems.findIndex(i => i.itemId === itemId);
  if (itemIndex === -1) {
    return { success: false, message: 'Item não encontrado.' };
  }

  const item = housing.storedItems[itemIndex];
  if (item.quantity < quantity) {
    return { success: false, message: `Quantidade insuficiente. Disponível: ${item.quantity}.` };
  }

  item.quantity -= quantity;
  if (item.quantity <= 0) {
    housing.storedItems.splice(itemIndex, 1);
  }

  await housing.save();

  return {
    success: true,
    itemName: item.itemName,
    quantity,
    message: `${item.itemName} x${quantity} retirado.`,
  };
}

// Obter NPCs disponíveis para o nível atual
export function getAvailableNpcs(baseLevel: number): NpcDefinition[] {
  return AVAILABLE_NPCS.filter(n => n.requiredBaseLevel <= baseLevel);
}

// Obter info dos níveis de base
export function getBaseLevels(): BaseLevelDefinition[] {
  return BASE_LEVELS;
}

// Obter tipos de sementes
export function getSeedTypes(): SeedDefinition[] {
  return SEED_TYPES;
}

// Processar pagamento semanal dos NPCs
export async function processNpcPayments(): Promise<{ processed: number; unpaid: string[] }> {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const housings = await Housing.find({
    'hiredNpcs.lastPaidAt': { $lte: oneWeekAgo },
  });

  const unpaid: string[] = [];

  for (const housing of housings) {
    for (const npc of housing.hiredNpcs) {
      if (new Date(npc.lastPaidAt) <= oneWeekAgo) {
        // Marcar como precisando pagamento
        unpaid.push(`${housing.odiscordId}:${npc.npcId}`);
      }
    }
  }

  return { processed: housings.length, unpaid };
}
