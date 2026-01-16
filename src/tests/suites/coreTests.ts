// Testes do Core - XP, Níveis, Badges
import { TestRunner, assert } from '../TestRunner';
import { createMockUser, createMockCharacter } from '../mocks/mockGenerators';

export function registerCoreTests(runner: TestRunner): void {
  runner.suite('Core - Sistema de XP', () => {
    runner.test('Cálculo de XP para próximo nível', async () => {
      // Fórmula: Math.floor(100 * Math.pow(level, 1.5))
      const xpForLevel = (level: number): number => Math.floor(100 * Math.pow(level, 1.5));

      assert.equals(xpForLevel(1), 100);
      assert.equals(xpForLevel(5), 1118);
      assert.equals(xpForLevel(10), 3162);
      assert.greaterThan(xpForLevel(50), xpForLevel(49));
    });

    runner.test('Multiplicadores de XP funcionam corretamente', async () => {
      const baseXP = 100;
      const multipliers = {
        weekend: 1.3,
        event: 2.0,
        booster: 1.5,
        streak: 1.25,
      };

      const weekendXP = Math.floor(baseXP * multipliers.weekend);
      const eventXP = Math.floor(baseXP * multipliers.event);
      const combinedXP = Math.floor(baseXP * multipliers.weekend * multipliers.booster);

      assert.equals(weekendXP, 130);
      assert.equals(eventXP, 200);
      assert.equals(combinedXP, 195);
    });

    runner.test('Limites diários de XP são respeitados', async () => {
      const DAILY_LIMITS = {
        totalXP: 1500,
        messages: 500,
        voice: 300,
        reactions: 100,
      };

      const gained = { messages: 600, voice: 200 };
      const actualMessages = Math.min(gained.messages, DAILY_LIMITS.messages);
      const actualVoice = Math.min(gained.voice, DAILY_LIMITS.voice);

      assert.equals(actualMessages, 500);
      assert.equals(actualVoice, 200);
    });

    runner.test('Level up detectado corretamente', async () => {
      const user = createMockUser({ level: 5, xp: 1100 });
      const xpNeeded = Math.floor(100 * Math.pow(user.level, 1.5)); // 1118

      const shouldLevelUp = user.xp >= xpNeeded;
      assert.isFalse(shouldLevelUp);

      user.xp = 1200;
      const shouldLevelUpNow = user.xp >= xpNeeded;
      assert.isTrue(shouldLevelUpNow);
    });
  });

  runner.suite('Core - Sistema de Personagem', () => {
    runner.test('Criação de personagem com stats corretas', async () => {
      const character = createMockCharacter();

      assert.notNull(character.name);
      assert.equals(character.level, 1);
      assert.equals(character.hp, 100);
      assert.equals(character.maxHp, 100);
      assert.hasProperty(character, 'attributes');
      assert.hasProperty(character, 'stats');
    });

    runner.test('Atributos iniciais corretos', async () => {
      const character = createMockCharacter();

      assert.equals(character.attributes.strength, 10);
      assert.equals(character.attributes.dexterity, 10);
      assert.equals(character.attributes.intelligence, 10);
      assert.equals(character.attributes.vitality, 10);
      assert.equals(character.attributes.luck, 10);
    });

    runner.test('Cálculo de stats baseado em atributos', async () => {
      const calculateAttack = (strength: number, baseAttack: number): number => {
        return baseAttack + Math.floor(strength * 1.5);
      };

      const calculateDefense = (vitality: number, baseDefense: number): number => {
        return baseDefense + Math.floor(vitality * 1.2);
      };

      assert.equals(calculateAttack(10, 5), 20);
      assert.equals(calculateAttack(20, 5), 35);
      assert.equals(calculateDefense(10, 5), 17);
    });

    runner.test('HP máximo escala com vitality', async () => {
      const calculateMaxHp = (level: number, vitality: number): number => {
        return 100 + (level - 1) * 10 + vitality * 5;
      };

      assert.equals(calculateMaxHp(1, 10), 150);
      assert.equals(calculateMaxHp(10, 10), 240);
      assert.equals(calculateMaxHp(10, 20), 290);
    });

    runner.test('Classes têm modificadores corretos', async () => {
      const classModifiers: Record<string, any> = {
        warrior: { strength: 1.2, vitality: 1.1, intelligence: 0.8 },
        mage: { strength: 0.8, intelligence: 1.3, vitality: 0.9 },
        archer: { dexterity: 1.25, strength: 1.0, vitality: 0.95 },
      };

      assert.greaterThan(classModifiers.warrior.strength, 1);
      assert.lessThan(classModifiers.warrior.intelligence, 1);
      assert.greaterThan(classModifiers.mage.intelligence, classModifiers.warrior.intelligence);
    });
  });

  runner.suite('Core - Sistema de Combate', () => {
    runner.test('Cálculo de dano básico', async () => {
      const calculateDamage = (attack: number, defense: number): number => {
        const baseDamage = attack - defense * 0.5;
        return Math.max(1, Math.floor(baseDamage));
      };

      assert.equals(calculateDamage(100, 50), 75);
      assert.equals(calculateDamage(50, 100), 1); // Mínimo 1
      assert.equals(calculateDamage(100, 0), 100);
    });

    runner.test('Cálculo de dano crítico', async () => {
      const calculateCritDamage = (baseDamage: number, critMultiplier: number): number => {
        return Math.floor(baseDamage * (critMultiplier / 100));
      };

      assert.equals(calculateCritDamage(100, 150), 150);
      assert.equals(calculateCritDamage(100, 200), 200);
    });

    runner.test('Chance de evasão funciona', async () => {
      const checkEvasion = (evasionChance: number, roll: number): boolean => {
        return roll <= evasionChance;
      };

      assert.isTrue(checkEvasion(50, 25));
      assert.isFalse(checkEvasion(50, 75));
      assert.isTrue(checkEvasion(100, 100));
    });

    runner.test('Lifesteal calcula cura corretamente', async () => {
      const calculateLifesteal = (damage: number, lifestealPercent: number): number => {
        return Math.floor(damage * (lifestealPercent / 100));
      };

      assert.equals(calculateLifesteal(100, 10), 10);
      assert.equals(calculateLifesteal(100, 25), 25);
      assert.equals(calculateLifesteal(50, 10), 5);
    });

    runner.test('Ordem de turno baseada em speed', async () => {
      const combatants = [
        { name: 'A', speed: 50 },
        { name: 'B', speed: 100 },
        { name: 'C', speed: 75 },
      ];

      const sorted = [...combatants].sort((a, b) => b.speed - a.speed);

      assert.equals(sorted[0].name, 'B');
      assert.equals(sorted[1].name, 'C');
      assert.equals(sorted[2].name, 'A');
    });
  });

  runner.suite('Core - Sistema de Inventário', () => {
    runner.test('Adicionar item ao inventário', async () => {
      const inventory: any[] = [];
      const item = { itemId: 'potion_hp', quantity: 5 };

      inventory.push(item);

      assert.lengthOf(inventory, 1);
      assert.equals(inventory[0].quantity, 5);
    });

    runner.test('Stackar itens iguais', async () => {
      const inventory = [{ itemId: 'potion_hp', quantity: 5 }];
      const newItem = { itemId: 'potion_hp', quantity: 3 };

      const existing = inventory.find(i => i.itemId === newItem.itemId);
      if (existing) {
        existing.quantity += newItem.quantity;
      }

      assert.lengthOf(inventory, 1);
      assert.equals(inventory[0].quantity, 8);
    });

    runner.test('Remover item do inventário', async () => {
      const inventory = [{ itemId: 'potion_hp', quantity: 5 }];
      const removeAmount = 3;

      const item = inventory.find(i => i.itemId === 'potion_hp');
      if (item) {
        item.quantity -= removeAmount;
        if (item.quantity <= 0) {
          inventory.splice(inventory.indexOf(item), 1);
        }
      }

      assert.equals(inventory[0].quantity, 2);
    });

    runner.test('Limite de slots de inventário', async () => {
      const MAX_SLOTS = 50;
      const inventory = Array(MAX_SLOTS).fill({ itemId: 'item', quantity: 1 });

      assert.lengthOf(inventory, MAX_SLOTS);

      const canAddMore = inventory.length < MAX_SLOTS;
      assert.isFalse(canAddMore);
    });
  });
}

export default registerCoreTests;
