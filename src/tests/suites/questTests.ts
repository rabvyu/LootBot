// Testes do Sistema de Quests
import { TestRunner, assert } from '../TestRunner';
import { createMockQuest, createMockCharacter } from '../mocks/mockGenerators';

export function registerQuestTests(runner: TestRunner): void {
  runner.suite('Quests - Sistema Básico', () => {
    runner.test('Criar quest com objetivos', async () => {
      const quest = createMockQuest({
        objectives: [
          { type: 'kill', target: 'goblin', quantity: 10, description: 'Derrote 10 goblins' },
          { type: 'collect', target: 'herb', quantity: 5, description: 'Colete 5 ervas' },
        ],
      });

      assert.lengthOf(quest.objectives, 2);
      assert.equals(quest.objectives[0].quantity, 10);
    });

    runner.test('Verificar pré-requisitos de quest', async () => {
      const completedQuests = ['quest_intro', 'quest_chapter1'];
      const quest = createMockQuest({
        prerequisites: ['quest_intro', 'quest_chapter1'],
      });

      const hasAllPrereqs = quest.prerequisites.every((p: string) => completedQuests.includes(p));
      assert.isTrue(hasAllPrereqs);
    });

    runner.test('Verificar requisito de nível', async () => {
      const playerLevel = 15;
      const quest = createMockQuest({ levelRequired: 20 });

      const meetsLevel = playerLevel >= quest.levelRequired;
      assert.isFalse(meetsLevel);
    });

    runner.test('Quest types são válidos', async () => {
      const validTypes = ['main', 'side', 'daily', 'weekly', 'guild', 'event'];
      const quest = createMockQuest({ type: 'side' });

      assert.includes(validTypes, quest.type);
    });
  });

  runner.suite('Quests - Progresso', () => {
    runner.test('Atualizar progresso de objetivo kill', async () => {
      const progress = { kill_goblin: 5 };
      const objective = { type: 'kill', target: 'goblin', quantity: 10 };

      progress.kill_goblin += 1;

      const isComplete = progress.kill_goblin >= objective.quantity;
      assert.isFalse(isComplete);
      assert.equals(progress.kill_goblin, 6);
    });

    runner.test('Quest completa quando todos objetivos cumpridos', async () => {
      const objectives = [
        { type: 'kill', target: 'goblin', quantity: 10 },
        { type: 'collect', target: 'herb', quantity: 5 },
      ];

      const progress = {
        kill_goblin: 10,
        collect_herb: 5,
      };

      const allComplete = objectives.every(obj => {
        const key = `${obj.type}_${obj.target}`;
        return (progress as any)[key] >= obj.quantity;
      });

      assert.isTrue(allComplete);
    });

    runner.test('Progresso não excede quantidade necessária', async () => {
      const progress = { kill_goblin: 15 };
      const required = 10;

      const displayProgress = Math.min(progress.kill_goblin, required);
      assert.equals(displayProgress, 10);
    });
  });

  runner.suite('Quests - Recompensas', () => {
    runner.test('Calcular recompensas de quest', async () => {
      const quest = createMockQuest({
        rewards: [
          { type: 'coins', quantity: 1000 },
          { type: 'xp', quantity: 500 },
          { type: 'material', itemId: 'iron_ore', quantity: 10 },
        ],
      });

      const coinsReward = quest.rewards.find((r: any) => r.type === 'coins');
      const xpReward = quest.rewards.find((r: any) => r.type === 'xp');

      assert.notNull(coinsReward);
      assert.equals(coinsReward.quantity, 1000);
      assert.equals(xpReward.quantity, 500);
    });

    runner.test('Recompensas bônus por dificuldade', async () => {
      const baseReward = 1000;
      const difficultyMultipliers: Record<string, number> = {
        easy: 1.0,
        normal: 1.5,
        hard: 2.0,
      };

      const hardReward = Math.floor(baseReward * difficultyMultipliers.hard);
      assert.equals(hardReward, 2000);
    });

    runner.test('Claim de recompensas só uma vez', async () => {
      const questStatus = {
        completed: true,
        rewardsClaimed: false,
      };

      // Primeiro claim
      if (questStatus.completed && !questStatus.rewardsClaimed) {
        questStatus.rewardsClaimed = true;
      }

      assert.isTrue(questStatus.rewardsClaimed);

      // Tentar claim novamente
      const canClaimAgain = questStatus.completed && !questStatus.rewardsClaimed;
      assert.isFalse(canClaimAgain);
    });
  });

  runner.suite('Quests - Daily/Weekly', () => {
    runner.test('Daily quest reseta à meia-noite', async () => {
      const lastCompletedAt = new Date('2024-01-15T15:00:00');
      const now = new Date('2024-01-16T10:00:00');

      const lastResetMidnight = new Date(lastCompletedAt);
      lastResetMidnight.setHours(0, 0, 0, 0);

      const todayMidnight = new Date(now);
      todayMidnight.setHours(0, 0, 0, 0);

      const shouldReset = todayMidnight > lastResetMidnight;
      assert.isTrue(shouldReset);
    });

    runner.test('Weekly quest reseta na segunda-feira', async () => {
      const getWeekNumber = (date: Date): number => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      };

      const lastWeek = new Date('2024-01-08');
      const thisWeek = new Date('2024-01-15');

      const lastWeekNum = getWeekNumber(lastWeek);
      const thisWeekNum = getWeekNumber(thisWeek);

      assert.greaterThan(thisWeekNum, lastWeekNum);
    });

    runner.test('Limite de daily quests', async () => {
      const MAX_DAILY_QUESTS = 3;
      const completedToday = 3;

      const canAcceptMore = completedToday < MAX_DAILY_QUESTS;
      assert.isFalse(canAcceptMore);
    });
  });

  runner.suite('Quests - Main Story', () => {
    runner.test('Chapters desbloqueiam em ordem', async () => {
      const chapters = [
        { id: 1, name: 'O Despertar', prereq: null },
        { id: 2, name: 'Sombras no Horizonte', prereq: 1 },
        { id: 3, name: 'A Ordem', prereq: 2 },
      ];

      const completedChapters = [1];

      const chapter2Unlocked: boolean = chapters[1].prereq === null ||
        (chapters[1].prereq !== null && completedChapters.includes(chapters[1].prereq));
      const chapter3Unlocked: boolean = chapters[2].prereq === null ||
        (chapters[2].prereq !== null && completedChapters.includes(chapters[2].prereq));

      assert.isTrue(chapter2Unlocked);
      assert.isFalse(chapter3Unlocked);
    });

    runner.test('Diálogo de NPC com escolhas', async () => {
      const dialogue = {
        text: 'Você aceita a missão?',
        choices: [
          { text: 'Sim, aceito!', action: 'accept_quest' },
          { text: 'Preciso pensar...', action: 'decline_quest' },
        ],
      };

      assert.lengthOf(dialogue.choices, 2);
      assert.equals(dialogue.choices[0].action, 'accept_quest');
    });
  });

  runner.suite('Quests - Guild Quests', () => {
    runner.test('Contribuição dividida entre membros', async () => {
      const questReward = 10000;
      const participantsCount = 5;
      const guildShare = 0.3; // 30% vai pro banco da guilda

      const guildAmount = Math.floor(questReward * guildShare);
      const playerAmount = Math.floor((questReward - guildAmount) / participantsCount);

      assert.equals(guildAmount, 3000);
      assert.equals(playerAmount, 1400);
    });

    runner.test('Progresso compartilhado entre membros', async () => {
      const objective = { target: 'boss', quantity: 10 };
      const memberContributions = [
        { id: 'p1', kills: 4 },
        { id: 'p2', kills: 3 },
        { id: 'p3', kills: 3 },
      ];

      const totalKills = memberContributions.reduce((sum, m) => sum + m.kills, 0);
      const isComplete = totalKills >= objective.quantity;

      assert.equals(totalKills, 10);
      assert.isTrue(isComplete);
    });
  });
}

export default registerQuestTests;
