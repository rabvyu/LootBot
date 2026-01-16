// Serviço de Auto-Battle/Farming
import {
  AutoFarmingConfig,
  FarmingSession,
  FarmingHistory,
  IAutoFarmingConfig,
  IFarmingSession,
  IFarmingHistory,
  FarmingType,
  FarmingSessionStatus,
} from '../database/models/AutoBattle';
import { v4 as uuidv4 } from 'uuid';

// Configurações do sistema
const AUTO_FARMING_CONFIG = {
  maxActiveSessionsPerUser: 1,
  minTickInterval: 60, // segundos
  maxSessionDuration: 3600, // 1 hora max
  energyCostPerRun: {
    dungeon: 20,
    arena: 15,
    mining: 5,
    fishing: 5,
    gathering: 3,
    crafting: 10,
    tower: 25,
  },
  baseLootChance: {
    common: 60,
    uncommon: 25,
    rare: 10,
    epic: 4,
    legendary: 1,
  },
};

// Resultado de uma run
interface RunResult {
  success: boolean;
  xpGained: number;
  coinsGained: number;
  monstersKilled: number;
  damageDealt: number;
  damageTaken: number;
  loot: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    rarity: string;
  }>;
  events: string[];
}

// Criar configuração de farming
export async function createFarmingConfig(
  discordId: string,
  type: FarmingType,
  name: string,
  settings: Partial<IAutoFarmingConfig['settings']> = {}
): Promise<IAutoFarmingConfig> {
  const config = new AutoFarmingConfig({
    odiscordId: discordId,
    type,
    name,
    isActive: true,
    settings: {
      maxRuns: 10,
      maxDuration: 60,
      stopOnLowHp: 20,
      stopOnFullInventory: true,
      useHealthPotions: true,
      useManaPotions: true,
      ...settings,
    },
    limits: {
      dailyRuns: 50,
      runsToday: 0,
      lastResetDate: new Date(),
      maxEnergyUse: 500,
      energyUsedToday: 0,
    },
  });

  await config.save();
  return config.toObject();
}

// Obter configurações do usuário
export async function getUserConfigs(
  discordId: string,
  type?: FarmingType
): Promise<any[]> {
  const query: any = { odiscordId: discordId, isActive: true };
  if (type) {
    query.type = type;
  }
  return await AutoFarmingConfig.find(query).lean();
}

// Atualizar configuração
export async function updateFarmingConfig(
  configId: string,
  discordId: string,
  updates: Partial<IAutoFarmingConfig>
): Promise<any> {
  return await AutoFarmingConfig.findOneAndUpdate(
    { _id: configId, odiscordId: discordId },
    { $set: updates },
    { new: true }
  ).lean();
}

// Deletar configuração
export async function deleteFarmingConfig(
  configId: string,
  discordId: string
): Promise<boolean> {
  const result = await AutoFarmingConfig.deleteOne({
    _id: configId,
    odiscordId: discordId,
  });
  return result.deletedCount > 0;
}

// Verificar se pode iniciar sessão
export async function canStartSession(
  discordId: string,
  configId: string
): Promise<{ canStart: boolean; reason?: string }> {
  // Verificar sessão ativa
  const activeSession = await FarmingSession.findOne({
    odiscordId: discordId,
    status: { $in: ['running', 'paused'] },
  });

  if (activeSession) {
    return { canStart: false, reason: 'Você já tem uma sessão de farming ativa.' };
  }

  // Verificar configuração
  const config = await AutoFarmingConfig.findById(configId);
  if (!config || config.odiscordId !== discordId) {
    return { canStart: false, reason: 'Configuração não encontrada.' };
  }

  if (!config.isActive) {
    return { canStart: false, reason: 'Esta configuração está desativada.' };
  }

  // Verificar limites diários
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (config.limits.lastResetDate < today) {
    // Reset diário
    config.limits.runsToday = 0;
    config.limits.energyUsedToday = 0;
    config.limits.lastResetDate = today;
    await config.save();
  }

  if (config.limits.runsToday >= config.limits.dailyRuns) {
    return { canStart: false, reason: 'Limite diário de runs atingido.' };
  }

  return { canStart: true };
}

// Iniciar sessão de farming
export async function startFarmingSession(
  discordId: string,
  configId: string
): Promise<{ success: boolean; session?: IFarmingSession; message: string }> {
  const check = await canStartSession(discordId, configId);
  if (!check.canStart) {
    return { success: false, message: check.reason! };
  }

  const config = await AutoFarmingConfig.findById(configId);
  if (!config) {
    return { success: false, message: 'Configuração não encontrada.' };
  }

  const session = new FarmingSession({
    sessionId: uuidv4(),
    odiscordId: discordId,
    configId,
    type: config.type,
    status: 'running',
    progress: {
      currentRun: 0,
      totalRuns: config.settings.maxRuns || 10,
      elapsedTime: 0,
      maxTime: (config.settings.maxDuration || 60) * 60,
    },
    stats: {
      monstersKilled: 0,
      damageDealt: 0,
      damageTaken: 0,
      healingDone: 0,
      deaths: 0,
      xpGained: 0,
      coinsGained: 0,
      itemsCollected: 0,
      itemsSold: 0,
      itemsDismantled: 0,
      energyUsed: 0,
      potionsUsed: 0,
    },
    loot: [],
    eventLog: [{
      timestamp: new Date(),
      event: 'session_started',
      details: { configName: config.name, type: config.type },
    }],
    startedAt: new Date(),
  });

  await session.save();

  return {
    success: true,
    session: session.toObject(),
    message: `Sessão de ${config.type} "${config.name}" iniciada!`,
  };
}

// Simular uma run (tick do farming)
export async function processFarmingTick(
  sessionId: string
): Promise<{ continue: boolean; result?: RunResult; session?: IFarmingSession; message: string }> {
  const session = await FarmingSession.findOne({ sessionId, status: 'running' });
  if (!session) {
    return { continue: false, message: 'Sessão não encontrada ou não está rodando.' };
  }

  const config = await AutoFarmingConfig.findById(session.configId);
  if (!config) {
    session.status = 'failed';
    session.endReason = 'Configuração não encontrada';
    await session.save();
    return { continue: false, message: 'Configuração não encontrada.' };
  }

  // Verificar se deve parar
  if (session.progress.currentRun >= session.progress.totalRuns) {
    session.status = 'completed';
    session.completedAt = new Date();
    session.endReason = 'Todas as runs completadas';
    await session.save();
    await createHistoryFromSession(session, config.name);
    return { continue: false, session: session.toObject(), message: 'Farming completado!' };
  }

  if (session.progress.elapsedTime >= session.progress.maxTime) {
    session.status = 'completed';
    session.completedAt = new Date();
    session.endReason = 'Tempo máximo atingido';
    await session.save();
    await createHistoryFromSession(session, config.name);
    return { continue: false, session: session.toObject(), message: 'Tempo máximo atingido.' };
  }

  // Simular run
  const result = simulateRun(session.type, config);

  // Atualizar estatísticas
  session.progress.currentRun++;
  session.progress.elapsedTime += AUTO_FARMING_CONFIG.minTickInterval;
  session.stats.monstersKilled += result.monstersKilled;
  session.stats.damageDealt += result.damageDealt;
  session.stats.damageTaken += result.damageTaken;
  session.stats.xpGained += result.xpGained;
  session.stats.coinsGained += result.coinsGained;
  session.stats.energyUsed += AUTO_FARMING_CONFIG.energyCostPerRun[session.type] || 10;

  // Processar loot
  for (const item of result.loot) {
    let action: 'kept' | 'sold' | 'dismantled' = 'kept';
    let value = 0;

    // Verificar se deve vender
    if (config.lootSettings.autoSell && config.lootSettings.sellRarity?.includes(item.rarity)) {
      action = 'sold';
      value = calculateItemValue(item.rarity);
      session.stats.coinsGained += value;
      session.stats.itemsSold++;
    }
    // Verificar se deve desmantelar
    else if (config.lootSettings.autoDismantle && config.lootSettings.dismantleRarity?.includes(item.rarity)) {
      action = 'dismantled';
      session.stats.itemsDismantled++;
    }
    // Manter item
    else {
      session.stats.itemsCollected++;
    }

    session.loot.push({
      ...item,
      action,
      value,
    });
  }

  // Adicionar eventos ao log
  for (const event of result.events) {
    session.eventLog.push({
      timestamp: new Date(),
      event,
      details: { run: session.progress.currentRun },
    });
  }

  // Atualizar limites da config
  config.limits.runsToday++;
  config.limits.energyUsedToday += AUTO_FARMING_CONFIG.energyCostPerRun[session.type] || 10;
  await config.save();

  await session.save();

  return {
    continue: true,
    result,
    session: session.toObject(),
    message: `Run ${session.progress.currentRun}/${session.progress.totalRuns} completada!`,
  };
}

// Simular uma run (lógica simplificada)
function simulateRun(type: FarmingType, config: IAutoFarmingConfig): RunResult {
  const result: RunResult = {
    success: true,
    xpGained: 0,
    coinsGained: 0,
    monstersKilled: 0,
    damageDealt: 0,
    damageTaken: 0,
    loot: [],
    events: [],
  };

  // Diferentes tipos de farming têm diferentes resultados
  switch (type) {
    case 'dungeon':
      result.monstersKilled = Math.floor(Math.random() * 20) + 10;
      result.damageDealt = result.monstersKilled * (Math.floor(Math.random() * 100) + 50);
      result.damageTaken = Math.floor(result.damageDealt * 0.3);
      result.xpGained = result.monstersKilled * 15;
      result.coinsGained = Math.floor(Math.random() * 500) + 100;
      result.events.push('dungeon_cleared');
      break;

    case 'arena':
      result.monstersKilled = 1;
      result.damageDealt = Math.floor(Math.random() * 2000) + 500;
      result.damageTaken = Math.floor(Math.random() * 1000) + 200;
      result.xpGained = Math.floor(Math.random() * 100) + 50;
      result.coinsGained = Math.floor(Math.random() * 300) + 50;
      result.events.push(Math.random() > 0.5 ? 'arena_victory' : 'arena_defeat');
      break;

    case 'mining':
      result.xpGained = Math.floor(Math.random() * 30) + 10;
      result.events.push('mining_complete');
      break;

    case 'fishing':
      result.xpGained = Math.floor(Math.random() * 25) + 5;
      result.events.push('fishing_complete');
      break;

    case 'gathering':
      result.xpGained = Math.floor(Math.random() * 20) + 5;
      result.events.push('gathering_complete');
      break;

    case 'crafting':
      result.xpGained = Math.floor(Math.random() * 50) + 20;
      result.events.push('crafting_complete');
      break;

    case 'tower':
      result.monstersKilled = Math.floor(Math.random() * 30) + 15;
      result.damageDealt = result.monstersKilled * (Math.floor(Math.random() * 150) + 75);
      result.damageTaken = Math.floor(result.damageDealt * 0.4);
      result.xpGained = result.monstersKilled * 20;
      result.coinsGained = Math.floor(Math.random() * 800) + 200;
      result.events.push('tower_floor_cleared');
      break;
  }

  // Gerar loot
  const lootChance = Math.random() * 100;
  if (lootChance < 70) {
    const rarity = determineLootRarity();
    result.loot.push({
      itemId: `item_${uuidv4().slice(0, 8)}`,
      itemName: generateItemName(type, rarity),
      quantity: Math.floor(Math.random() * 3) + 1,
      rarity,
    });
  }

  return result;
}

// Determinar raridade do loot
function determineLootRarity(): string {
  const roll = Math.random() * 100;
  let cumulative = 0;

  for (const [rarity, chance] of Object.entries(AUTO_FARMING_CONFIG.baseLootChance)) {
    cumulative += chance;
    if (roll <= cumulative) {
      return rarity;
    }
  }

  return 'common';
}

// Gerar nome de item
function generateItemName(type: FarmingType, rarity: string): string {
  const prefixes: Record<string, string[]> = {
    common: ['Simples', 'Básico', 'Normal'],
    uncommon: ['Bom', 'Refinado', 'Polido'],
    rare: ['Raro', 'Valioso', 'Precioso'],
    epic: ['Épico', 'Magnífico', 'Esplêndido'],
    legendary: ['Lendário', 'Mítico', 'Divino'],
  };

  const items: Record<FarmingType, string[]> = {
    dungeon: ['Espada', 'Escudo', 'Armadura', 'Anel', 'Amuleto'],
    arena: ['Troféu', 'Medalha', 'Insígnia', 'Coroa'],
    mining: ['Minério', 'Gema', 'Cristal', 'Pepita'],
    fishing: ['Peixe', 'Pérola', 'Coral', 'Concha'],
    gathering: ['Erva', 'Flor', 'Madeira', 'Couro'],
    crafting: ['Material', 'Componente', 'Essência', 'Fragmento'],
    tower: ['Relíquia', 'Artefato', 'Selo', 'Runa'],
  };

  const prefix = prefixes[rarity]?.[Math.floor(Math.random() * 3)] || 'Comum';
  const item = items[type]?.[Math.floor(Math.random() * items[type].length)] || 'Item';

  return `${prefix} ${item}`;
}

// Calcular valor do item para venda
function calculateItemValue(rarity: string): number {
  const values: Record<string, number> = {
    common: 10,
    uncommon: 50,
    rare: 200,
    epic: 1000,
    legendary: 5000,
  };
  return values[rarity] || 10;
}

// Pausar sessão
export async function pauseFarmingSession(
  sessionId: string,
  discordId: string
): Promise<{ success: boolean; session?: IFarmingSession; message: string }> {
  const session = await FarmingSession.findOne({
    sessionId,
    odiscordId: discordId,
    status: 'running',
  });

  if (!session) {
    return { success: false, message: 'Sessão não encontrada ou não está rodando.' };
  }

  session.status = 'paused';
  session.pausedAt = new Date();
  session.eventLog.push({
    timestamp: new Date(),
    event: 'session_paused',
  });

  await session.save();

  return {
    success: true,
    session: session.toObject(),
    message: 'Sessão pausada.',
  };
}

// Retomar sessão
export async function resumeFarmingSession(
  sessionId: string,
  discordId: string
): Promise<{ success: boolean; session?: IFarmingSession; message: string }> {
  const session = await FarmingSession.findOne({
    sessionId,
    odiscordId: discordId,
    status: 'paused',
  });

  if (!session) {
    return { success: false, message: 'Sessão não encontrada ou não está pausada.' };
  }

  session.status = 'running';
  session.resumedAt = new Date();
  session.eventLog.push({
    timestamp: new Date(),
    event: 'session_resumed',
  });

  await session.save();

  return {
    success: true,
    session: session.toObject(),
    message: 'Sessão retomada.',
  };
}

// Cancelar sessão
export async function cancelFarmingSession(
  sessionId: string,
  discordId: string
): Promise<{ success: boolean; session?: IFarmingSession; message: string }> {
  const session = await FarmingSession.findOne({
    sessionId,
    odiscordId: discordId,
    status: { $in: ['running', 'paused'] },
  });

  if (!session) {
    return { success: false, message: 'Sessão ativa não encontrada.' };
  }

  const config = await AutoFarmingConfig.findById(session.configId);

  session.status = 'cancelled';
  session.completedAt = new Date();
  session.endReason = 'Cancelado pelo usuário';
  session.eventLog.push({
    timestamp: new Date(),
    event: 'session_cancelled',
  });

  await session.save();
  await createHistoryFromSession(session, config?.name || 'Unknown');

  return {
    success: true,
    session: session.toObject(),
    message: 'Sessão cancelada.',
  };
}

// Criar histórico a partir da sessão
async function createHistoryFromSession(
  session: IFarmingSession,
  configName: string
): Promise<void> {
  const history = new FarmingHistory({
    odiscordId: session.odiscordId,
    type: session.type,
    configName,
    sessionId: session.sessionId,
    status: session.status,
    duration: session.progress.elapsedTime,
    runs: session.progress.currentRun,
    xpGained: session.stats.xpGained,
    coinsGained: session.stats.coinsGained,
    itemsCollected: session.stats.itemsCollected,
    completedAt: session.completedAt || new Date(),
  });

  await history.save();
}

// Obter sessão ativa
export async function getActiveSession(discordId: string): Promise<any> {
  return await FarmingSession.findOne({
    odiscordId: discordId,
    status: { $in: ['running', 'paused'] },
  }).lean();
}

// Obter histórico de farming
export async function getFarmingHistory(
  discordId: string,
  limit: number = 20
): Promise<any[]> {
  return await FarmingHistory.find({ odiscordId: discordId })
    .sort({ completedAt: -1 })
    .limit(limit)
    .lean();
}

// Obter estatísticas de farming
export async function getFarmingStats(discordId: string): Promise<{
  totalSessions: number;
  totalRuns: number;
  totalXp: number;
  totalCoins: number;
  totalItems: number;
  totalDuration: number;
  byType: Record<FarmingType, { sessions: number; runs: number; xp: number; coins: number }>;
}> {
  const history = await FarmingHistory.find({ odiscordId: discordId }).lean();

  const stats = {
    totalSessions: history.length,
    totalRuns: 0,
    totalXp: 0,
    totalCoins: 0,
    totalItems: 0,
    totalDuration: 0,
    byType: {} as Record<FarmingType, { sessions: number; runs: number; xp: number; coins: number }>,
  };

  for (const h of history) {
    stats.totalRuns += h.runs;
    stats.totalXp += h.xpGained;
    stats.totalCoins += h.coinsGained;
    stats.totalItems += h.itemsCollected;
    stats.totalDuration += h.duration;

    if (!stats.byType[h.type]) {
      stats.byType[h.type] = { sessions: 0, runs: 0, xp: 0, coins: 0 };
    }

    stats.byType[h.type].sessions++;
    stats.byType[h.type].runs += h.runs;
    stats.byType[h.type].xp += h.xpGained;
    stats.byType[h.type].coins += h.coinsGained;
  }

  return stats;
}

// Limpar sessões antigas
export async function cleanupOldSessions(daysOld: number = 7): Promise<number> {
  const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  const result = await FarmingSession.deleteMany({
    status: { $in: ['completed', 'failed', 'cancelled'] },
    completedAt: { $lte: cutoff },
  });
  return result.deletedCount;
}

// Resetar limites diários (chamado pelo scheduler)
export async function resetDailyLimits(): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await AutoFarmingConfig.updateMany(
    { 'limits.lastResetDate': { $lt: today } },
    {
      $set: {
        'limits.runsToday': 0,
        'limits.energyUsedToday': 0,
        'limits.lastResetDate': today,
      },
    }
  );

  return result.modifiedCount;
}
