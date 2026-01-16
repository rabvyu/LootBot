// Serviço de Sistema de Raids
import { RaidRun, RaidLockout, IRaidRun, IRaidLockout, RaidRunStatus, RaidRunParticipantData, RaidPhase } from '../database/models';
import { v4 as uuidv4 } from 'uuid';

// Definições de raids
export interface RaidDefinition {
  raidId: string;
  name: string;
  description: string;
  minLevel: number;
  minPlayers: number;
  maxPlayers: number;
  difficulty: 'normal' | 'heroic' | 'mythic';
  phases: RaidPhaseDefinition[];
  rewards: RaidRewardDef[];
  lockoutDays: number;
}

export interface RaidPhaseDefinition {
  phaseNumber: number;
  name: string;
  bossName: string;
  bossHp: number;
  bossAttack: number;
  bossDefense: number;
  mechanics: string[];
  enrageTimer: number; // segundos
}

export interface RaidRewardDef {
  itemId: string;
  dropChance: number;
  phaseRequired?: number;
}

// Raids disponíveis
const RAID_DEFINITIONS: RaidDefinition[] = [
  {
    raidId: 'dragon_lair',
    name: 'Covil do Dragão',
    description: 'Enfrente o temível Dragão Ancião e sua corte.',
    minLevel: 30,
    minPlayers: 4,
    maxPlayers: 8,
    difficulty: 'normal',
    phases: [
      {
        phaseNumber: 1,
        name: 'Guarda do Dragão',
        bossName: 'Capitão Draconiano',
        bossHp: 10000,
        bossAttack: 150,
        bossDefense: 80,
        mechanics: ['Investida', 'Grito de Guerra'],
        enrageTimer: 180,
      },
      {
        phaseNumber: 2,
        name: 'Câmara do Tesouro',
        bossName: 'Guardião de Ouro',
        bossHp: 15000,
        bossAttack: 200,
        bossDefense: 120,
        mechanics: ['Chuva de Moedas', 'Armadura Dourada'],
        enrageTimer: 240,
      },
      {
        phaseNumber: 3,
        name: 'Trono do Dragão',
        bossName: 'Dragão Ancião',
        bossHp: 30000,
        bossAttack: 350,
        bossDefense: 150,
        mechanics: ['Sopro de Fogo', 'Voo', 'Fúria Dracônica'],
        enrageTimer: 420,
      },
    ],
    rewards: [
      { itemId: 'dragon_scale', dropChance: 0.3 },
      { itemId: 'dragon_tooth', dropChance: 0.2, phaseRequired: 3 },
      { itemId: 'dragon_heart', dropChance: 0.05, phaseRequired: 3 },
    ],
    lockoutDays: 7,
  },
  {
    raidId: 'demon_fortress',
    name: 'Fortaleza Demoníaca',
    description: 'Invada a fortaleza dos demônios e derrote o Senhor das Trevas.',
    minLevel: 40,
    minPlayers: 6,
    maxPlayers: 10,
    difficulty: 'heroic',
    phases: [
      {
        phaseNumber: 1,
        name: 'Portões do Inferno',
        bossName: 'Guarda Demoníaco',
        bossHp: 20000,
        bossAttack: 250,
        bossDefense: 100,
        mechanics: ['Chamas Infernais', 'Invocação'],
        enrageTimer: 200,
      },
      {
        phaseNumber: 2,
        name: 'Salão dos Tormentos',
        bossName: 'Torturador Sombrio',
        bossHp: 25000,
        bossAttack: 300,
        bossDefense: 130,
        mechanics: ['Correntes de Agonia', 'Medo'],
        enrageTimer: 300,
      },
      {
        phaseNumber: 3,
        name: 'Arena de Sangue',
        bossName: 'Campeão Demoníaco',
        bossHp: 35000,
        bossAttack: 400,
        bossDefense: 160,
        mechanics: ['Execução', 'Sede de Sangue', 'Frenesi'],
        enrageTimer: 360,
      },
      {
        phaseNumber: 4,
        name: 'Trono das Trevas',
        bossName: 'Senhor das Trevas',
        bossHp: 50000,
        bossAttack: 500,
        bossDefense: 200,
        mechanics: ['Apocalipse', 'Dominação', 'Portal Dimensional', 'Forma Final'],
        enrageTimer: 600,
      },
    ],
    rewards: [
      { itemId: 'demon_essence', dropChance: 0.4 },
      { itemId: 'shadow_crystal', dropChance: 0.25, phaseRequired: 3 },
      { itemId: 'dark_crown', dropChance: 0.03, phaseRequired: 4 },
    ],
    lockoutDays: 7,
  },
];

export function getRaidDefinition(raidId: string): RaidDefinition | undefined {
  return RAID_DEFINITIONS.find(r => r.raidId === raidId);
}

export function getAllRaidDefinitions(): RaidDefinition[] {
  return RAID_DEFINITIONS;
}

// Iniciar raid
export async function startRaid(
  raidId: string,
  leaderId: string,
  leaderName: string,
  participants: Array<{ odiscordId: string; username: string; characterLevel: number }>
): Promise<{ success: boolean; raid?: IRaidRun; message: string }> {
  const raidDef = getRaidDefinition(raidId);
  if (!raidDef) {
    return { success: false, message: 'Raid não encontrada.' };
  }

  // Verificar número de participantes
  if (participants.length < raidDef.minPlayers) {
    return { success: false, message: `Mínimo de ${raidDef.minPlayers} jogadores necessários.` };
  }

  if (participants.length > raidDef.maxPlayers) {
    return { success: false, message: `Máximo de ${raidDef.maxPlayers} jogadores permitidos.` };
  }

  // Verificar nível dos participantes
  const underleveled = participants.filter(p => p.characterLevel < raidDef.minLevel);
  if (underleveled.length > 0) {
    return { success: false, message: `Alguns jogadores não têm nível mínimo (${raidDef.minLevel}).` };
  }

  // Verificar lockouts
  for (const participant of participants) {
    const lockout = await RaidLockout.findOne({
      odiscordId: participant.odiscordId,
      raidId,
      expiresAt: { $gt: new Date() },
    });

    if (lockout) {
      return { success: false, message: `${participant.username} ainda está em lockout desta raid.` };
    }
  }

  // Criar run da raid
  const raidRun = new RaidRun({
    runId: uuidv4(),
    raidId,
    raidName: raidDef.name,
    difficulty: raidDef.difficulty,
    leaderId,
    leaderName,
    participants: participants.map(p => ({
      odiscordId: p.odiscordId,
      username: p.username,
      damageDealt: 0,
      healingDone: 0,
      deaths: 0,
      joinedAt: new Date(),
    })),
    currentPhase: 1,
    phases: raidDef.phases.map(phase => ({
      phaseNumber: phase.phaseNumber,
      name: phase.name,
      bossName: phase.bossName,
      bossCurrentHp: phase.bossHp,
      bossMaxHp: phase.bossHp,
      started: false,
      completed: false,
      timeSpent: 0,
    })),
    status: 'forming' as RaidRunStatus,
    totalDamageDealt: 0,
    totalHealingDone: 0,
    totalDeaths: 0,
    startedAt: new Date(),
  });

  await raidRun.save();

  return {
    success: true,
    raid: raidRun.toObject(),
    message: `Raid "${raidDef.name}" iniciada! Preparando para a primeira fase.`,
  };
}

// Iniciar fase
export async function startPhase(runId: string): Promise<{ success: boolean; raid?: IRaidRun; message: string }> {
  const raid = await RaidRun.findOne({ runId, status: { $in: ['forming', 'in_progress'] } });
  if (!raid) {
    return { success: false, message: 'Raid não encontrada ou já finalizada.' };
  }

  const currentPhase = raid.phases.find(p => p.phaseNumber === raid.currentPhase);
  if (!currentPhase) {
    return { success: false, message: 'Fase não encontrada.' };
  }

  if (currentPhase.started && !currentPhase.completed) {
    return { success: false, message: 'Fase já está em andamento.' };
  }

  currentPhase.started = true;
  currentPhase.startedAt = new Date();
  raid.status = 'in_progress';

  await raid.save();

  return {
    success: true,
    raid: raid.toObject(),
    message: `Fase ${raid.currentPhase}: "${currentPhase.name}" iniciada! Boss: ${currentPhase.bossName}`,
  };
}

// Aplicar dano ao boss
export async function dealDamageToBoss(
  runId: string,
  odiscordId: string,
  damage: number
): Promise<{ success: boolean; raid?: IRaidRun; phaseCompleted?: boolean; message: string }> {
  const raid = await RaidRun.findOne({ runId, status: 'in_progress' });
  if (!raid) {
    return { success: false, message: 'Raid não está em andamento.' };
  }

  const currentPhase = raid.phases.find(p => p.phaseNumber === raid.currentPhase);
  if (!currentPhase || !currentPhase.started || currentPhase.completed) {
    return { success: false, message: 'Fase não está ativa.' };
  }

  // Atualizar dano do participante
  const participant = raid.participants.find(p => p.odiscordId === odiscordId);
  if (participant) {
    participant.damageDealt += damage;
  }

  // Aplicar dano ao boss
  if (currentPhase.bossCurrentHp === undefined) {
    currentPhase.bossCurrentHp = currentPhase.bossMaxHp || 1000;
  }
  currentPhase.bossCurrentHp -= damage;
  raid.totalDamageDealt += damage;

  let phaseCompleted = false;

  if (currentPhase.bossCurrentHp <= 0) {
    currentPhase.bossCurrentHp = 0;
    currentPhase.completed = true;
    currentPhase.completedAt = new Date();
    currentPhase.timeSpent = Math.floor(
      (currentPhase.completedAt.getTime() - currentPhase.startedAt!.getTime()) / 1000
    );
    phaseCompleted = true;

    // Verificar se há próxima fase
    const nextPhase = raid.phases.find(p => p.phaseNumber === raid.currentPhase + 1);
    if (nextPhase) {
      raid.currentPhase++;
    } else {
      // Raid completa!
      raid.status = 'completed';
      raid.completedAt = new Date();
    }
  }

  await raid.save();

  return {
    success: true,
    raid: raid.toObject(),
    phaseCompleted,
    message: phaseCompleted
      ? `${currentPhase.bossName} derrotado!`
      : `Dano causado! HP do boss: ${currentPhase.bossCurrentHp}/${currentPhase.bossMaxHp}`,
  };
}

// Registrar morte de participante
export async function registerDeath(runId: string, odiscordId: string): Promise<void> {
  await RaidRun.updateOne(
    { runId, 'participants.odiscordId': odiscordId },
    {
      $inc: {
        'participants.$.deaths': 1,
        totalDeaths: 1,
      },
    }
  );
}

// Registrar cura
export async function registerHealing(runId: string, odiscordId: string, amount: number): Promise<void> {
  await RaidRun.updateOne(
    { runId, 'participants.odiscordId': odiscordId },
    {
      $inc: {
        'participants.$.healingDone': amount,
        totalHealingDone: amount,
      },
    }
  );
}

// Finalizar raid (sucesso ou falha)
export async function endRaid(
  runId: string,
  success: boolean
): Promise<{ success: boolean; raid?: IRaidRun; message: string }> {
  const raid = await RaidRun.findOne({ runId, status: 'in_progress' });
  if (!raid) {
    return { success: false, message: 'Raid não está em andamento.' };
  }

  raid.status = success ? 'completed' : 'failed';
  raid.completedAt = new Date();

  // Se completou com sucesso, criar lockouts
  if (success) {
    const raidDef = getRaidDefinition(raid.raidId);
    if (raidDef) {
      const lockoutExpiry = new Date(Date.now() + raidDef.lockoutDays * 24 * 60 * 60 * 1000);

      for (const participant of raid.participants) {
        const lockout = new RaidLockout({
          odiscordId: participant.odiscordId,
          raidId: raid.raidId,
          difficulty: raid.difficulty,
          completedPhases: raid.phases.filter(p => p.completed).map(p => p.phaseNumber),
          expiresAt: lockoutExpiry,
        });
        await lockout.save();
      }
    }
  }

  await raid.save();

  return {
    success: true,
    raid: raid.toObject(),
    message: success
      ? 'Raid completada com sucesso! Recompensas distribuídas.'
      : 'Raid falhou. Melhor sorte na próxima vez!',
  };
}

// Obter lockouts do jogador
export async function getPlayerLockouts(odiscordId: string): Promise<IRaidLockout[]> {
  return await RaidLockout.find({
    odiscordId,
    expiresAt: { $gt: new Date() },
  }).lean();
}

// Obter raid ativa do jogador
export async function getActiveRaid(odiscordId: string): Promise<IRaidRun | null> {
  return await RaidRun.findOne({
    'participants.odiscordId': odiscordId,
    status: { $in: ['forming', 'in_progress'] },
  }).lean();
}

// Obter histórico de raids
export async function getRaidHistory(
  odiscordId: string,
  limit: number = 10
): Promise<IRaidRun[]> {
  return await RaidRun.find({
    'participants.odiscordId': odiscordId,
    status: { $in: ['completed', 'failed'] },
  })
    .sort({ completedAt: -1 })
    .limit(limit)
    .lean();
}

// Limpar lockouts expirados
export async function cleanupExpiredLockouts(): Promise<number> {
  const result = await RaidLockout.deleteMany({
    expiresAt: { $lte: new Date() },
  });
  return result.deletedCount;
}
