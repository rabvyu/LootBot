// Testes do Sistema de Guildas
import { TestRunner, assert } from '../TestRunner';
import { createMockGuild, generateDiscordId } from '../mocks/mockGenerators';

export function registerGuildTests(runner: TestRunner): void {
  runner.suite('Guildas - Criação e Configuração', () => {
    runner.test('Criar guilda com dados válidos', async () => {
      const guild = createMockGuild({
        name: 'Heróis da Luz',
        tag: 'HDL',
      });

      assert.equals(guild.name, 'Heróis da Luz');
      assert.equals(guild.tag, 'HDL');
      assert.equals(guild.level, 1);
    });

    runner.test('Limite de caracteres no nome', async () => {
      const name = 'Uma Guilda Com Nome Muito Muito Grande';
      const MAX_NAME_LENGTH = 30;

      const isValid = name.length <= MAX_NAME_LENGTH;
      assert.isFalse(isValid);
    });

    runner.test('Tag deve ter 3-5 caracteres', async () => {
      const validateTag = (tag: string): boolean => {
        return tag.length >= 3 && tag.length <= 5 && /^[A-Z0-9]+$/.test(tag);
      };

      assert.isTrue(validateTag('ABC'));
      assert.isTrue(validateTag('AB123'));
      assert.isFalse(validateTag('AB')); // Muito curto
      assert.isFalse(validateTag('ABCDEF')); // Muito longo
      assert.isFalse(validateTag('abc')); // Minúsculas
    });

    runner.test('Custo de criação de guilda', async () => {
      const GUILD_CREATION_COST = 50000;
      const playerCoins = 45000;

      const canCreate = playerCoins >= GUILD_CREATION_COST;
      assert.isFalse(canCreate);
    });
  });

  runner.suite('Guildas - Sistema de Membros', () => {
    runner.test('Adicionar membro à guilda', async () => {
      const guild = createMockGuild({ memberCount: 5 });
      const newMember = { discordId: generateDiscordId(), role: 'member' };

      guild.members.push(newMember);
      guild.memberCount += 1;

      assert.equals(guild.memberCount, 6);
      assert.lengthOf(guild.members, 1);
    });

    runner.test('Limite de membros por nível', async () => {
      const getMemberLimit = (level: number): number => {
        return 20 + (level - 1) * 5; // 20 base + 5 por nível
      };

      assert.equals(getMemberLimit(1), 20);
      assert.equals(getMemberLimit(5), 40);
      assert.equals(getMemberLimit(10), 65);
    });

    runner.test('Não pode entrar em guilda cheia', async () => {
      const guild = createMockGuild({
        memberCount: 20,
        maxMembers: 20,
      });

      const canJoin = guild.memberCount < guild.maxMembers;
      assert.isFalse(canJoin);
    });

    runner.test('Hierarquia de cargos', async () => {
      const roles = ['member', 'officer', 'co-leader', 'leader'];
      const roleHierarchy: Record<string, number> = {
        member: 0,
        officer: 1,
        'co-leader': 2,
        leader: 3,
      };

      const canPromote = (promoterRole: string, targetCurrentRole: string): boolean => {
        return roleHierarchy[promoterRole] > roleHierarchy[targetCurrentRole] + 1;
      };

      assert.isTrue(canPromote('leader', 'member'));
      assert.isFalse(canPromote('officer', 'member'));
    });
  });

  runner.suite('Guildas - Sistema de XP e Nível', () => {
    runner.test('Contribuição de XP', async () => {
      const guild = createMockGuild({ xp: 1000 });
      const contribution = 500;

      guild.xp += contribution;

      assert.equals(guild.xp, 1500);
    });

    runner.test('Level up de guilda', async () => {
      const xpForLevel = (level: number): number => {
        return Math.floor(10000 * Math.pow(level, 1.5));
      };

      const guild = createMockGuild({ level: 5, xp: 120000 });
      const xpNeeded = xpForLevel(guild.level);

      const shouldLevelUp = guild.xp >= xpNeeded;
      assert.isTrue(shouldLevelUp);
    });

    runner.test('Perks por nível', async () => {
      const guildPerks: Record<number, string[]> = {
        5: ['xp_boost_5'],
        10: ['loot_boost_10'],
        15: ['bank_expansion'],
        20: ['crafting_discount'],
      };

      const guildLevel = 12;
      const unlockedPerks: string[] = [];

      for (const [level, perks] of Object.entries(guildPerks)) {
        if (guildLevel >= parseInt(level)) {
          unlockedPerks.push(...perks);
        }
      }

      assert.lengthOf(unlockedPerks, 2);
      assert.includes(unlockedPerks, 'xp_boost_5');
      assert.includes(unlockedPerks, 'loot_boost_10');
    });
  });

  runner.suite('Guildas - Banco da Guilda', () => {
    runner.test('Depositar no banco', async () => {
      const guildBank = { coins: 10000, items: [] as any[] };
      const deposit = 5000;

      guildBank.coins += deposit;

      assert.equals(guildBank.coins, 15000);
    });

    runner.test('Sacar do banco (apenas officers+)', async () => {
      const memberRole = 'member';
      const officerRole = 'officer';

      const canWithdraw = (role: string): boolean => {
        return ['officer', 'co-leader', 'leader'].includes(role);
      };

      assert.isFalse(canWithdraw(memberRole));
      assert.isTrue(canWithdraw(officerRole));
    });

    runner.test('Log de transações', async () => {
      const bankLog: any[] = [];
      const transaction = {
        type: 'deposit',
        amount: 5000,
        by: 'user123',
        timestamp: new Date(),
      };

      bankLog.push(transaction);

      assert.lengthOf(bankLog, 1);
      assert.equals(bankLog[0].type, 'deposit');
    });
  });

  runner.suite('Guildas - Convites', () => {
    runner.test('Criar convite com expiração', async () => {
      const invite = {
        code: 'ABC123',
        guildId: 'guild_1',
        createdBy: 'user123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        maxUses: 10,
        uses: 0,
      };

      assert.notNull(invite.code);
      assert.equals(invite.maxUses, 10);
    });

    runner.test('Convite expirado não funciona', async () => {
      const invite = {
        expiresAt: new Date(Date.now() - 1000),
        uses: 0,
        maxUses: 10,
      };

      const isValid = new Date() < invite.expiresAt && invite.uses < invite.maxUses;
      assert.isFalse(isValid);
    });

    runner.test('Convite com máximo de usos', async () => {
      const invite = {
        uses: 10,
        maxUses: 10,
      };

      const canUse = invite.uses < invite.maxUses;
      assert.isFalse(canUse);
    });
  });

  runner.suite('Guildas - Guild Wars', () => {
    runner.test('Declarar guerra entre guildas', async () => {
      const war = {
        challengerId: 'guild_1',
        defenderId: 'guild_2',
        status: 'pending',
        battles: [],
        score: { guild_1: 0, guild_2: 0 },
      };

      assert.equals(war.status, 'pending');
      assert.equals(war.score.guild_1, 0);
    });

    runner.test('Batalha 5v5 em guild war', async () => {
      const BATTLE_SIZE = 5;
      const guild1Members = 20;
      const guild2Members = 15;

      const canBattle = guild1Members >= BATTLE_SIZE && guild2Members >= BATTLE_SIZE;
      assert.isTrue(canBattle);
    });

    runner.test('Vitória por melhor de 5', async () => {
      const score = { guild_1: 3, guild_2: 1 };
      const WINS_NEEDED = 3;

      const winner = score.guild_1 >= WINS_NEEDED ? 'guild_1' :
                    score.guild_2 >= WINS_NEEDED ? 'guild_2' : null;

      assert.equals(winner, 'guild_1');
    });
  });
}

export default registerGuildTests;
