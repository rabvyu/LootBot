// Serviço da Torre dos Desafios
import { TowerRun, TowerRecord, ITowerRun, ITowerRecord, TowerRunStatus, TowerModifier, TowerFloorResult } from '../database/models';
import { v4 as uuidv4 } from 'uuid';

// Configurações da torre
const TOWER_CONFIG = {
  maxFloors: 100,
  baseEnemyHp: 100,
  baseEnemyAttack: 20,
  hpScaling: 1.15, // 15% mais HP por andar
  attackScaling: 1.10, // 10% mais ataque por andar
  bossFloors: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
  bossHpMultiplier: 3,
  bossAttackMultiplier: 1.5,
  modifierInterval: 5, // Novo modificador a cada 5 andares
  rewardsPerFloor: 10, // Moedas base por andar
  xpPerFloor: 25, // XP base por andar
};

// Modificadores possíveis
const MODIFIERS: TowerModifier[] = [
  { modifierId: 'double_enemies', name: 'Horda', effect: 'Dobro de inimigos no andar' },
  { modifierId: 'no_healing', name: 'Proibido Curar', effect: 'Cura desabilitada' },
  { modifierId: 'poison_floor', name: 'Veneno', effect: 'Perde 5% HP por turno' },
  { modifierId: 'rage', name: 'Fúria', effect: 'Inimigos com +50% ataque' },
  { modifierId: 'armor', name: 'Blindados', effect: 'Inimigos com +50% defesa' },
  { modifierId: 'speed', name: 'Velocidade', effect: 'Inimigos atacam primeiro' },
  { modifierId: 'drain', name: 'Dreno', effect: 'Inimigos drenam vida' },
  { modifierId: 'reflect', name: 'Reflexo', effect: 'Inimigos refletem 20% do dano' },
];

// Calcular stats do andar
export function calculateFloorStats(floor: number): {
  enemyCount: number;
  enemyHp: number;
  enemyAttack: number;
  isBoss: boolean;
} {
  const isBoss = TOWER_CONFIG.bossFloors.includes(floor);
  const enemyCount = isBoss ? 1 : Math.min(Math.floor(floor / 10) + 1, 5);

  let enemyHp = Math.floor(TOWER_CONFIG.baseEnemyHp * Math.pow(TOWER_CONFIG.hpScaling, floor - 1));
  let enemyAttack = Math.floor(TOWER_CONFIG.baseEnemyAttack * Math.pow(TOWER_CONFIG.attackScaling, floor - 1));

  if (isBoss) {
    enemyHp *= TOWER_CONFIG.bossHpMultiplier;
    enemyAttack *= TOWER_CONFIG.bossAttackMultiplier;
  }

  return { enemyCount, enemyHp, enemyAttack, isBoss };
}

// Obter modificador aleatório
export function getRandomModifier(): TowerModifier {
  return MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)];
}

// Iniciar corrida na torre
export async function startTowerRun(
  odiscordId: string,
  username: string,
  characterHp: number,
  seasonId?: string
): Promise<{ success: boolean; run?: ITowerRun; message: string }> {
  // Verificar se já tem corrida ativa
  const activeRun = await TowerRun.findOne({
    odiscordId,
    status: 'active',
  });

  if (activeRun) {
    return { success: false, message: 'Você já tem uma corrida ativa na torre.' };
  }

  const run = new TowerRun({
    runId: uuidv4(),
    odiscordId,
    username,
    currentFloor: 1,
    highestFloor: 0,
    status: 'active' as TowerRunStatus,
    hp: characterHp,
    maxHp: characterHp,
    activeModifiers: [],
    floorResults: [],
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    totalTimeSpent: 0,
    deaths: 0,
    startedAt: new Date(),
    seasonId,
  });

  await run.save();

  return {
    success: true,
    run: run.toObject(),
    message: 'Corrida na Torre dos Desafios iniciada! Boa sorte!',
  };
}

// Entrar no próximo andar
export async function enterFloor(runId: string): Promise<{
  success: boolean;
  run?: ITowerRun;
  floorStats?: ReturnType<typeof calculateFloorStats>;
  newModifier?: TowerModifier;
  message: string;
}> {
  const run = await TowerRun.findOne({ runId, status: 'active' });
  if (!run) {
    return { success: false, message: 'Corrida não encontrada ou não está ativa.' };
  }

  const floorStats = calculateFloorStats(run.currentFloor);
  let newModifier: TowerModifier | undefined;

  // Adicionar modificador a cada X andares
  if (run.currentFloor % TOWER_CONFIG.modifierInterval === 0 && run.currentFloor > 0) {
    newModifier = getRandomModifier();
    run.activeModifiers.push(newModifier);
  }

  await run.save();

  return {
    success: true,
    run: run.toObject(),
    floorStats,
    newModifier,
    message: `Andar ${run.currentFloor}${floorStats.isBoss ? ' - BOSS!' : ''}: ${floorStats.enemyCount} inimigo(s) com ${floorStats.enemyHp} HP.`,
  };
}

// Completar andar
export async function completeFloor(
  runId: string,
  result: {
    damageDealt: number;
    damageTaken: number;
    timeSpent: number;
    bossDefeated?: boolean;
  }
): Promise<{ success: boolean; run?: ITowerRun; rewards?: { coins: number; xp: number }; message: string }> {
  const run = await TowerRun.findOne({ runId, status: 'active' });
  if (!run) {
    return { success: false, message: 'Corrida não encontrada ou não está ativa.' };
  }

  const floorStats = calculateFloorStats(run.currentFloor);

  // Registrar resultado do andar
  const floorResult: TowerFloorResult = {
    floor: run.currentFloor,
    enemies: floorStats.enemyCount,
    bossDefeated: result.bossDefeated || false,
    damageDealt: result.damageDealt,
    damageTaken: result.damageTaken,
    timeSpent: result.timeSpent,
    modifiers: run.activeModifiers.map(m => m.modifierId),
    completed: true,
  };

  run.floorResults.push(floorResult);
  run.totalDamageDealt += result.damageDealt;
  run.totalDamageTaken += result.damageTaken;
  run.totalTimeSpent += result.timeSpent;
  run.hp -= result.damageTaken;
  run.highestFloor = Math.max(run.highestFloor, run.currentFloor);

  // Calcular recompensas
  const floorMultiplier = floorStats.isBoss ? 3 : 1;
  const rewards = {
    coins: Math.floor(TOWER_CONFIG.rewardsPerFloor * run.currentFloor * floorMultiplier),
    xp: Math.floor(TOWER_CONFIG.xpPerFloor * run.currentFloor * floorMultiplier),
  };

  // Verificar se HP acabou
  if (run.hp <= 0) {
    run.hp = 0;
    run.status = 'failed';
    run.completedAt = new Date();
    await run.save();
    await updateTowerRecord(run);

    return {
      success: true,
      run: run.toObject(),
      rewards,
      message: `Você caiu no andar ${run.currentFloor}! Melhor resultado: ${run.highestFloor}.`,
    };
  }

  // Verificar se chegou ao topo
  if (run.currentFloor >= TOWER_CONFIG.maxFloors) {
    run.status = 'completed';
    run.completedAt = new Date();
    await run.save();
    await updateTowerRecord(run);

    return {
      success: true,
      run: run.toObject(),
      rewards,
      message: `Parabéns! Você conquistou a Torre dos Desafios!`,
    };
  }

  // Avançar para próximo andar
  run.currentFloor++;
  await run.save();

  return {
    success: true,
    run: run.toObject(),
    rewards,
    message: `Andar ${run.currentFloor - 1} completado! Próximo: ${run.currentFloor}. HP: ${run.hp}/${run.maxHp}`,
  };
}

// Curar na torre
export async function healInTower(runId: string, amount: number): Promise<{ success: boolean; newHp?: number; message: string }> {
  const run = await TowerRun.findOne({ runId, status: 'active' });
  if (!run) {
    return { success: false, message: 'Corrida não encontrada.' };
  }

  // Verificar se tem modificador que impede cura
  const noHealModifier = run.activeModifiers.find(m => m.modifierId === 'no_healing');
  if (noHealModifier) {
    return { success: false, message: 'Cura desabilitada por modificador!' };
  }

  run.hp = Math.min(run.hp + amount, run.maxHp);
  await run.save();

  return { success: true, newHp: run.hp, message: `Curado! HP: ${run.hp}/${run.maxHp}` };
}

// Abandonar corrida
export async function abandonRun(runId: string): Promise<{ success: boolean; message: string }> {
  const run = await TowerRun.findOne({ runId, status: 'active' });
  if (!run) {
    return { success: false, message: 'Corrida não encontrada.' };
  }

  run.status = 'abandoned';
  run.completedAt = new Date();
  await run.save();
  await updateTowerRecord(run);

  return { success: true, message: `Corrida abandonada no andar ${run.currentFloor}. Melhor: ${run.highestFloor}.` };
}

// Atualizar recorde do jogador
async function updateTowerRecord(run: ITowerRun): Promise<void> {
  if (!run.seasonId) return;

  const existingRecord = await TowerRecord.findOne({
    odiscordId: run.odiscordId,
    seasonId: run.seasonId,
  });

  if (!existingRecord) {
    const record = new TowerRecord({
      odiscordId: run.odiscordId,
      username: run.username,
      highestFloor: run.highestFloor,
      totalRuns: 1,
      bestTime: run.totalTimeSpent,
      seasonId: run.seasonId,
      achievedAt: new Date(),
    });
    await record.save();
  } else if (run.highestFloor > existingRecord.highestFloor) {
    existingRecord.highestFloor = run.highestFloor;
    existingRecord.bestTime = run.totalTimeSpent;
    existingRecord.totalRuns++;
    existingRecord.achievedAt = new Date();
    await existingRecord.save();
  } else {
    existingRecord.totalRuns++;
    if (run.highestFloor === existingRecord.highestFloor && run.totalTimeSpent < existingRecord.bestTime) {
      existingRecord.bestTime = run.totalTimeSpent;
    }
    await existingRecord.save();
  }
}

// Obter corrida ativa
export async function getActiveRun(odiscordId: string): Promise<ITowerRun | null> {
  return await TowerRun.findOne({ odiscordId, status: 'active' }).lean();
}

// Obter ranking da temporada
export async function getSeasonLeaderboard(seasonId: string, limit: number = 20): Promise<ITowerRecord[]> {
  return await TowerRecord.find({ seasonId })
    .sort({ highestFloor: -1, bestTime: 1 })
    .limit(limit)
    .lean();
}

// Obter histórico de corridas
export async function getRunHistory(odiscordId: string, limit: number = 10): Promise<ITowerRun[]> {
  return await TowerRun.find({
    odiscordId,
    status: { $in: ['completed', 'failed', 'abandoned'] },
  })
    .sort({ completedAt: -1 })
    .limit(limit)
    .lean();
}

// Obter estatísticas do jogador
export async function getPlayerTowerStats(odiscordId: string): Promise<{
  totalRuns: number;
  highestFloor: number;
  totalFloorsCleared: number;
  totalBossesDefeated: number;
  averageFloor: number;
}> {
  const runs = await TowerRun.find({
    odiscordId,
    status: { $in: ['completed', 'failed', 'abandoned'] },
  }).lean();

  const stats = {
    totalRuns: runs.length,
    highestFloor: 0,
    totalFloorsCleared: 0,
    totalBossesDefeated: 0,
    averageFloor: 0,
  };

  for (const run of runs) {
    stats.highestFloor = Math.max(stats.highestFloor, run.highestFloor);
    stats.totalFloorsCleared += run.highestFloor;
    stats.totalBossesDefeated += run.floorResults.filter(f => f.bossDefeated).length;
  }

  stats.averageFloor = runs.length > 0 ? Math.floor(stats.totalFloorsCleared / runs.length) : 0;

  return stats;
}
