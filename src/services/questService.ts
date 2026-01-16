// Serviço de Sistema de Quests
import { QuestDefinition, QuestProgress, IQuestDefinition, IQuestProgress, QuestType, QuestStatus } from '../database/models';
import { v4 as uuidv4 } from 'uuid';

// Configurações de quests
const QUEST_CONFIG = {
  maxActiveQuests: 5,
  dailyResetHour: 4, // 4:00 AM
  weeklyResetDay: 1, // Segunda-feira
};

export interface QuestAcceptResult {
  success: boolean;
  quest?: IQuestProgress;
  message: string;
}

export interface QuestProgressResult {
  success: boolean;
  quest?: IQuestProgress;
  completed?: boolean;
  message: string;
}

// Obter quests disponíveis para o jogador
export async function getAvailableQuests(
  discordId: string,
  playerLevel: number
): Promise<IQuestDefinition[]> {
  const now = new Date();

  // Buscar progresso atual do jogador
  const activeProgress = await QuestProgress.find({
    odiscordId: discordId,
    status: { $in: ['active', 'ready_to_claim'] },
  });

  const activeQuestIds = activeProgress.map(p => p.questId);

  // Buscar quests completadas recentemente (para cooldown)
  const recentlyCompleted = await QuestProgress.find({
    odiscordId: discordId,
    status: 'completed',
    completedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  });

  const recentlyCompletedIds = recentlyCompleted.map(p => p.questId);

  // Buscar quests disponíveis
  const quests = await QuestDefinition.find({
    isActive: true,
    minLevel: { $lte: playerLevel },
    questId: { $nin: [...activeQuestIds, ...recentlyCompletedIds] },
    $and: [
      {
        $or: [
          { maxLevel: { $exists: false } },
          { maxLevel: { $gte: playerLevel } },
        ],
      },
      {
        $or: [
          { availableFrom: { $exists: false } },
          { availableFrom: { $lte: now } },
        ],
      },
      {
        $or: [
          { availableUntil: { $exists: false } },
          { availableUntil: { $gte: now } },
        ],
      },
    ],
  }).limit(20).lean();

  return quests;
}

// Aceitar uma quest
export async function acceptQuest(
  discordId: string,
  questId: string
): Promise<QuestAcceptResult> {
  // Verificar limite de quests ativas
  const activeCount = await QuestProgress.countDocuments({
    odiscordId: discordId,
    status: 'active',
  });

  if (activeCount >= QUEST_CONFIG.maxActiveQuests) {
    return { success: false, message: `Você já tem ${QUEST_CONFIG.maxActiveQuests} quests ativas.` };
  }

  // Verificar se a quest existe
  const questDef = await QuestDefinition.findOne({ questId, isActive: true });
  if (!questDef) {
    return { success: false, message: 'Quest não encontrada ou indisponível.' };
  }

  // Verificar se já tem progresso nessa quest
  const existingProgress = await QuestProgress.findOne({
    odiscordId: discordId,
    questId,
    status: { $in: ['active', 'ready_to_claim'] },
  });

  if (existingProgress) {
    return { success: false, message: 'Você já está nessa quest.' };
  }

  // Criar progresso inicial
  const progress = new QuestProgress({
    odiscordId: discordId,
    questId,
    questName: questDef.name,
    questType: questDef.questType,
    objectives: questDef.objectives.map(obj => ({
      objectiveId: obj.objectiveId,
      description: obj.description,
      currentProgress: 0,
      requiredProgress: obj.requiredAmount,
      completed: false,
    })),
    status: 'active',
    acceptedAt: new Date(),
    expiresAt: questDef.timeLimit
      ? new Date(Date.now() + questDef.timeLimit * 60 * 1000)
      : undefined,
  });

  await progress.save();

  return {
    success: true,
    quest: progress.toObject(),
    message: `Quest "${questDef.name}" aceita!`,
  };
}

// Atualizar progresso de objetivo
export async function updateQuestProgress(
  discordId: string,
  objectiveType: string,
  targetId: string,
  amount: number = 1
): Promise<QuestProgressResult[]> {
  const results: QuestProgressResult[] = [];

  // Buscar quests ativas do jogador
  const activeQuests = await QuestProgress.find({
    odiscordId: discordId,
    status: 'active',
  });

  for (const quest of activeQuests) {
    // Buscar definição da quest para verificar objetivos
    const questDef = await QuestDefinition.findOne({ questId: quest.questId });
    if (!questDef) continue;

    let questUpdated = false;

    for (let i = 0; i < quest.objectives.length; i++) {
      const objective = quest.objectives[i];
      const defObjective = questDef.objectives.find(o => o.objectiveId === objective.objectiveId);

      if (!defObjective || objective.completed) continue;

      // Verificar se o objetivo corresponde ao tipo de ação
      if (defObjective.type === objectiveType &&
          (!defObjective.targetId || defObjective.targetId === targetId)) {
        objective.currentProgress += amount;

        if (objective.currentProgress >= objective.requiredProgress) {
          objective.currentProgress = objective.requiredProgress;
          objective.completed = true;
        }

        questUpdated = true;
      }
    }

    if (questUpdated) {
      // Verificar se todos os objetivos estão completos
      const allCompleted = quest.objectives.every(obj => obj.completed);

      if (allCompleted) {
        quest.status = 'ready_to_claim';
      }

      await quest.save();

      results.push({
        success: true,
        quest: quest.toObject(),
        completed: allCompleted,
        message: allCompleted
          ? `Quest "${quest.questName}" pronta para coletar recompensa!`
          : `Progresso atualizado em "${quest.questName}"!`,
      });
    }
  }

  return results;
}

// Coletar recompensa da quest
export async function claimQuestReward(
  discordId: string,
  questId: string
): Promise<{ success: boolean; rewards?: any; message: string }> {
  const progress = await QuestProgress.findOne({
    odiscordId: discordId,
    questId,
    status: 'ready_to_claim',
  });

  if (!progress) {
    return { success: false, message: 'Quest não encontrada ou não está pronta para coletar.' };
  }

  const questDef = await QuestDefinition.findOne({ questId });
  if (!questDef) {
    return { success: false, message: 'Definição da quest não encontrada.' };
  }

  progress.status = 'completed';
  progress.completedAt = new Date();
  await progress.save();

  return {
    success: true,
    rewards: questDef.rewards,
    message: `Recompensas de "${questDef.name}" coletadas!`,
  };
}

// Abandonar quest
export async function abandonQuest(
  discordId: string,
  questId: string
): Promise<{ success: boolean; message: string }> {
  const progress = await QuestProgress.findOne({
    odiscordId: discordId,
    questId,
    status: 'active',
  });

  if (!progress) {
    return { success: false, message: 'Quest ativa não encontrada.' };
  }

  progress.status = 'abandoned';
  await progress.save();

  return { success: true, message: 'Quest abandonada.' };
}

// Obter quests ativas do jogador
export async function getActiveQuests(discordId: string): Promise<IQuestProgress[]> {
  return await QuestProgress.find({
    odiscordId: discordId,
    status: { $in: ['active', 'ready_to_claim'] },
  }).lean();
}

// Obter histórico de quests completadas
export async function getCompletedQuests(
  discordId: string,
  limit: number = 10
): Promise<IQuestProgress[]> {
  return await QuestProgress.find({
    odiscordId: discordId,
    status: 'completed',
  })
    .sort({ completedAt: -1 })
    .limit(limit)
    .lean();
}

// Processar quests expiradas
export async function processExpiredQuests(): Promise<number> {
  const result = await QuestProgress.updateMany(
    {
      status: 'active',
      expiresAt: { $lte: new Date() },
    },
    {
      $set: { status: 'expired' },
    }
  );

  return result.modifiedCount;
}

// Resetar quests diárias
export async function resetDailyQuests(discordId: string): Promise<void> {
  await QuestProgress.updateMany(
    {
      odiscordId: discordId,
      questType: 'daily',
      status: 'completed',
    },
    {
      $set: { status: 'reset' },
    }
  );
}

// Criar quest (admin)
export async function createQuestDefinition(
  questData: Partial<IQuestDefinition>
): Promise<IQuestDefinition> {
  const quest = new QuestDefinition({
    questId: uuidv4(),
    ...questData,
    isActive: true,
  });

  await quest.save();
  return quest.toObject();
}

// Obter estatísticas de quests do jogador
export async function getQuestStats(discordId: string): Promise<{
  totalCompleted: number;
  dailyCompleted: number;
  weeklyCompleted: number;
  mainCompleted: number;
  sideCompleted: number;
}> {
  const completed = await QuestProgress.find({
    odiscordId: discordId,
    status: 'completed',
  });

  const stats = {
    totalCompleted: completed.length,
    dailyCompleted: 0,
    weeklyCompleted: 0,
    mainCompleted: 0,
    sideCompleted: 0,
  };

  for (const quest of completed) {
    switch (quest.questType) {
      case 'daily':
        stats.dailyCompleted++;
        break;
      case 'weekly':
        stats.weeklyCompleted++;
        break;
      case 'main':
        stats.mainCompleted++;
        break;
      case 'side':
        stats.sideCompleted++;
        break;
    }
  }

  return stats;
}
