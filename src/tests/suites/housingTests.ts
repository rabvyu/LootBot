// Testes do Sistema de Housing/Base Pessoal
import { TestRunner, assert } from '../TestRunner';

export function registerHousingTests(runner: TestRunner): void {
  runner.suite('Housing - Base do Aventureiro', () => {
    runner.test('Níveis de base', async () => {
      const baseLevels: Record<number, { name: string; cost: number; slots: number }> = {
        1: { name: 'Tenda', cost: 0, slots: 10 },
        2: { name: 'Cabana', cost: 50000, slots: 30 },
        3: { name: 'Casa', cost: 200000, slots: 60 },
        4: { name: 'Mansão', cost: 500000, slots: 100 },
        5: { name: 'Fortaleza', cost: 1000000, slots: 150 },
        6: { name: 'Castelo', cost: 5000000, slots: 250 },
      };

      assert.equals(baseLevels[1].cost, 0);
      assert.equals(baseLevels[6].slots, 250);
      assert.greaterThan(baseLevels[4].cost, baseLevels[3].cost);
    });

    runner.test('Upgrade de base', async () => {
      const base = { level: 2, name: 'Cabana' };
      const upgradeCost = 200000;
      const playerCoins = 250000;

      const canUpgrade = playerCoins >= upgradeCost;
      assert.isTrue(canUpgrade);

      if (canUpgrade) {
        base.level = 3;
        base.name = 'Casa';
      }

      assert.equals(base.level, 3);
    });

    runner.test('Slots de armazém por nível', async () => {
      const getStorageSlots = (level: number): number => {
        const baseSlots = 10;
        const perLevelBonus = 20;
        return baseSlots + (level - 1) * perLevelBonus + level * 10;
      };

      assert.equals(getStorageSlots(1), 20);
      assert.greaterThan(getStorageSlots(3), getStorageSlots(2));
    });
  });

  runner.suite('Housing - NPCs Contratáveis', () => {
    runner.test('Lista de NPCs disponíveis', async () => {
      const npcs = [
        { id: 'blacksmith', name: 'Ferreiro', costPerWeek: 5000, effect: '+5% crafting' },
        { id: 'alchemist', name: 'Alquimista', costPerWeek: 5000, effect: '+10% poções' },
        { id: 'trainer', name: 'Treinador', costPerWeek: 10000, effect: '+5% XP' },
        { id: 'merchant', name: 'Mercador', costPerWeek: 10000, effect: '-5% preços' },
        { id: 'guardian', name: 'Guardião', costPerWeek: 15000, effect: '+5% defesa' },
        { id: 'sage', name: 'Sábio', costPerWeek: 15000, effect: '+10% loot raro' },
      ];

      assert.lengthOf(npcs, 6);
      assert.equals(npcs[2].costPerWeek, 10000);
    });

    runner.test('Limite de NPCs por nível de base', async () => {
      const getNpcLimit = (baseLevel: number): number => {
        if (baseLevel >= 6) return 4;
        if (baseLevel >= 4) return 2;
        if (baseLevel >= 3) return 1;
        return 0;
      };

      assert.equals(getNpcLimit(1), 0);
      assert.equals(getNpcLimit(3), 1);
      assert.equals(getNpcLimit(5), 2);
      assert.equals(getNpcLimit(6), 4);
    });

    runner.test('Pagamento semanal de NPC', async () => {
      const hiredNpcs = [
        { id: 'blacksmith', costPerWeek: 5000 },
        { id: 'trainer', costPerWeek: 10000 },
      ];

      const totalWeeklyCost = hiredNpcs.reduce((sum, npc) => sum + npc.costPerWeek, 0);
      assert.equals(totalWeeklyCost, 15000);
    });

    runner.test('NPC demitido se não pagar', async () => {
      const npc = {
        id: 'blacksmith',
        active: true,
        lastPaidAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 dias atrás
      };

      const daysSincePayment = Math.floor(
        (Date.now() - npc.lastPaidAt.getTime()) / (24 * 60 * 60 * 1000)
      );

      const shouldFire = daysSincePayment > 7;
      assert.isTrue(shouldFire);
    });
  });

  runner.suite('Housing - Sistema de Jardim', () => {
    runner.test('Plantar semente', async () => {
      const garden = {
        plots: [] as any[],
        maxPlots: 4,
      };

      const seed = {
        seedId: 'common_herb',
        plantedAt: new Date(),
        growthTime: 4 * 60 * 60 * 1000, // 4 horas
        readyAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
      };

      garden.plots.push(seed);

      assert.lengthOf(garden.plots, 1);
    });

    runner.test('Verificar se planta está pronta', async () => {
      const plant = {
        readyAt: new Date(Date.now() - 1000), // Já passou
      };

      const isReady = new Date() >= plant.readyAt;
      assert.isTrue(isReady);
    });

    runner.test('Colher planta', async () => {
      const plant = {
        seedId: 'common_herb',
        yield: { itemId: 'herb', quantity: { min: 5, max: 10 } },
      };

      const harvestedQuantity = Math.floor(
        Math.random() * (plant.yield.quantity.max - plant.yield.quantity.min + 1)
      ) + plant.yield.quantity.min;

      assert.greaterThan(harvestedQuantity, 4);
      assert.lessThan(harvestedQuantity, 11);
    });

    runner.test('Regar aumenta qualidade', async () => {
      const plant = {
        watered: false,
        qualityBonus: 0,
      };

      // Regar a planta
      plant.watered = true;
      plant.qualityBonus = 20; // +20% yield

      assert.isTrue(plant.watered);
      assert.equals(plant.qualityBonus, 20);
    });

    runner.test('Fertilizante acelera crescimento', async () => {
      const baseGrowthTime = 4 * 60 * 60 * 1000; // 4 horas
      const fertilizerReduction = 0.25; // 25% mais rápido

      const reducedTime = Math.floor(baseGrowthTime * (1 - fertilizerReduction));
      assert.equals(reducedTime, 3 * 60 * 60 * 1000);
    });

    runner.test('Tipos de sementes', async () => {
      const seeds = [
        { id: 'common_herb', growthTime: 4, rarity: 'common' },
        { id: 'rare_crystal', growthTime: 12, rarity: 'rare' },
        { id: 'epic_essence', growthTime: 24, rarity: 'epic' },
        { id: 'legendary_fragment', growthTime: 48, rarity: 'legendary' },
      ];

      assert.lengthOf(seeds, 4);
      assert.greaterThan(seeds[3].growthTime, seeds[0].growthTime);
    });
  });

  runner.suite('Housing - Estações de Crafting', () => {
    runner.test('Bônus de crafting por estação', async () => {
      const craftingStation = {
        type: 'anvil',
        level: 3,
        successBonus: 15, // +15% chance de sucesso
      };

      const baseCraftingChance = 80;
      const actualChance = Math.min(100, baseCraftingChance + craftingStation.successBonus);

      assert.equals(actualChance, 95);
    });

    runner.test('Upgrade de estação', async () => {
      const station = { level: 2, maxLevel: 5 };
      const upgradeCost = 50000;

      const canUpgrade = station.level < station.maxLevel;
      assert.isTrue(canUpgrade);

      station.level += 1;
      assert.equals(station.level, 3);
    });
  });

  runner.suite('Housing - Portal de Dungeon', () => {
    runner.test('Redução de cooldown por portal', async () => {
      const baseCooldown = 30 * 60 * 1000; // 30 minutos
      const portalReduction = 0.2; // 20% redução

      const reducedCooldown = Math.floor(baseCooldown * (1 - portalReduction));
      assert.equals(reducedCooldown, 24 * 60 * 1000);
    });

    runner.test('Portal só disponível em base nível 5+', async () => {
      const baseLevel = 4;
      const PORTAL_REQUIRED_LEVEL = 5;

      const hasPortal = baseLevel >= PORTAL_REQUIRED_LEVEL;
      assert.isFalse(hasPortal);
    });

    runner.test('Teleporte para dungeon específica', async () => {
      const availableDungeons = ['forest', 'cave', 'castle', 'abyss'];
      const selectedDungeon = 'cave';

      const canTeleport = availableDungeons.includes(selectedDungeon);
      assert.isTrue(canTeleport);
    });
  });

  runner.suite('Housing - Decorações', () => {
    runner.test('Decorações cosméticas', async () => {
      const decorations = [
        { id: 'trophy_1', name: 'Troféu de Boss', slot: 'wall' },
        { id: 'carpet_1', name: 'Tapete Real', slot: 'floor' },
        { id: 'chandelier', name: 'Candelabro', slot: 'ceiling' },
      ];

      assert.lengthOf(decorations, 3);
    });

    runner.test('Limite de decorações por slot', async () => {
      const slotLimits: Record<string, number> = {
        wall: 5,
        floor: 3,
        ceiling: 1,
        table: 10,
      };

      const currentDecorations = { wall: 5 };
      const canAddWallDecor = currentDecorations.wall < slotLimits.wall;

      assert.isFalse(canAddWallDecor);
    });
  });
}

export default registerHousingTests;
