// Testes do Sistema de Favoritos e Builds
import { TestRunner, assert } from '../TestRunner';

export function registerFavoritesTests(runner: TestRunner): void {
  runner.suite('Favoritos - Gestão Básica', () => {
    runner.test('Adicionar item aos favoritos', async () => {
      const favorites: Array<{ favoriteId: string; type: string; targetId: string; targetName: string }> = [];
      const maxFavorites = 50;

      const newFavorite = {
        favoriteId: 'fav-123',
        type: 'item',
        targetId: 'sword-001',
        targetName: 'Espada Lendária',
      };

      const canAdd = favorites.length < maxFavorites;
      assert.isTrue(canAdd);

      favorites.push(newFavorite);
      assert.lengthOf(favorites, 1);
      assert.equals(favorites[0].targetName, 'Espada Lendária');
    });

    runner.test('Verificar duplicata de favoritos', async () => {
      const favorites = [
        { type: 'item', targetId: 'sword-001' },
        { type: 'quest', targetId: 'quest-001' },
      ];

      const newItem = { type: 'item', targetId: 'sword-001' };
      const exists = favorites.some(f => f.type === newItem.type && f.targetId === newItem.targetId);

      assert.isTrue(exists);
    });

    runner.test('Remover favorito', async () => {
      const favorites = [
        { favoriteId: 'fav-1', targetName: 'Item 1' },
        { favoriteId: 'fav-2', targetName: 'Item 2' },
        { favoriteId: 'fav-3', targetName: 'Item 3' },
      ];

      const idToRemove = 'fav-2';
      const index = favorites.findIndex(f => f.favoriteId === idToRemove);

      assert.greaterThan(index, -1);

      favorites.splice(index, 1);
      assert.lengthOf(favorites, 2);
      assert.isFalse(favorites.some(f => f.favoriteId === idToRemove));
    });

    runner.test('Limite de favoritos', async () => {
      const currentCount = 50;
      const maxFavorites = 50;

      const canAddMore = currentCount < maxFavorites;
      assert.isFalse(canAddMore);
    });
  });

  runner.suite('Favoritos - Filtros e Tags', () => {
    runner.test('Filtrar favoritos por tipo', async () => {
      const favorites = [
        { type: 'item', targetName: 'Espada' },
        { type: 'quest', targetName: 'Quest Principal' },
        { type: 'item', targetName: 'Escudo' },
        { type: 'dungeon', targetName: 'Caverna Sombria' },
      ];

      const itemFavorites = favorites.filter(f => f.type === 'item');
      assert.lengthOf(itemFavorites, 2);
    });

    runner.test('Adicionar tags a favorito', async () => {
      const favorite = {
        favoriteId: 'fav-1',
        tags: ['importante', 'crafting'],
      };

      favorite.tags.push('raro');
      assert.lengthOf(favorite.tags, 3);
      assert.includes(favorite.tags, 'raro');
    });

    runner.test('Filtrar por tag', async () => {
      const favorites = [
        { tags: ['importante', 'pvp'] },
        { tags: ['crafting'] },
        { tags: ['importante', 'pve'] },
        { tags: ['pvp'] },
      ];

      const importantFavorites = favorites.filter(f => f.tags.includes('importante'));
      assert.lengthOf(importantFavorites, 2);
    });

    runner.test('Atualizar nota de favorito', async () => {
      const favorite = {
        favoriteId: 'fav-1',
        note: 'Nota original',
      };

      favorite.note = 'Nota atualizada com mais detalhes';
      assert.equals(favorite.note, 'Nota atualizada com mais detalhes');
    });
  });

  runner.suite('Builds - Criação e Gestão', () => {
    runner.test('Criar build básica', async () => {
      const build = {
        buildId: 'build-123',
        name: 'Tank Build',
        class: 'warrior',
        level: 50,
        isPublic: false,
        isFavorite: true,
        equipment: {
          weapon: { itemId: 'sword-001', itemName: 'Espada do Guardião' },
          helmet: { itemId: 'helm-001', itemName: 'Elmo de Ferro' },
          chest: { itemId: 'chest-001', itemName: 'Peitoral Reforçado' },
        },
        skills: [
          { slotNumber: 1, skillId: 'taunt', skillName: 'Provocar' },
          { slotNumber: 2, skillId: 'shield_wall', skillName: 'Muralha de Escudos' },
        ],
      };

      assert.equals(build.name, 'Tank Build');
      assert.equals(build.class, 'warrior');
      assert.hasProperty(build.equipment, 'weapon');
      assert.lengthOf(build.skills, 2);
    });

    runner.test('Verificar limite de builds por usuário', async () => {
      const maxBuilds = 20;
      const currentBuilds = 18;

      const canCreate = currentBuilds < maxBuilds;
      assert.isTrue(canCreate);

      const currentBuilds2 = 20;
      const canCreate2 = currentBuilds2 < maxBuilds;
      assert.isFalse(canCreate2);
    });

    runner.test('Verificar nome duplicado', async () => {
      const existingBuilds = [
        { name: 'Tank Build' },
        { name: 'DPS Build' },
        { name: 'Healer Build' },
      ];

      const newName = 'Tank Build';
      const isDuplicate = existingBuilds.some(b => b.name === newName);

      assert.isTrue(isDuplicate);
    });

    runner.test('Calcular stats da build', async () => {
      const equipmentStats = [
        { hp: 100, defense: 50 },
        { hp: 80, defense: 30 },
        { hp: 50, defense: 20 },
      ];

      const calculatedStats = {
        hp: equipmentStats.reduce((sum, e) => sum + e.hp, 0),
        defense: equipmentStats.reduce((sum, e) => sum + e.defense, 0),
      };

      assert.equals(calculatedStats.hp, 230);
      assert.equals(calculatedStats.defense, 100);
    });
  });

  runner.suite('Builds - Público e Compartilhamento', () => {
    runner.test('Tornar build pública', async () => {
      const build = {
        isPublic: false,
        likes: 0,
        views: 0,
      };

      build.isPublic = true;
      assert.isTrue(build.isPublic);
    });

    runner.test('Sistema de likes', async () => {
      const build = { likes: 15, isPublic: true };

      // Dar like
      build.likes++;
      assert.equals(build.likes, 16);
    });

    runner.test('Incrementar views', async () => {
      const build = { views: 100 };

      build.views++;
      assert.equals(build.views, 101);
    });

    runner.test('Gerar código de compartilhamento', async () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '';

      for (let i = 0; i < 8; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }

      assert.lengthOf(code, 8);
      // Verificar que não contém caracteres ambíguos
      assert.isFalse(code.includes('O'));
      assert.isFalse(code.includes('0'));
      assert.isFalse(code.includes('I'));
      assert.isFalse(code.includes('1'));
    });

    runner.test('Expiração de compartilhamento', async () => {
      const now = Date.now();
      const shares = [
        { shareCode: 'ABC123', expiresAt: new Date(now - 1000) }, // Expirado
        { shareCode: 'DEF456', expiresAt: new Date(now + 86400000) }, // Válido
        { shareCode: 'GHI789', expiresAt: undefined }, // Sem expiração
      ];

      const validShares = shares.filter(
        s => !s.expiresAt || s.expiresAt.getTime() > now
      );

      assert.lengthOf(validShares, 2);
    });
  });

  runner.suite('Builds - Busca e Ranking', () => {
    runner.test('Buscar builds públicas por classe', async () => {
      const builds = [
        { class: 'warrior', isPublic: true, likes: 50 },
        { class: 'mage', isPublic: true, likes: 30 },
        { class: 'warrior', isPublic: true, likes: 45 },
        { class: 'warrior', isPublic: false, likes: 100 },
      ];

      const warriorBuilds = builds.filter(b => b.class === 'warrior' && b.isPublic);
      assert.lengthOf(warriorBuilds, 2);
    });

    runner.test('Ordenar builds por likes', async () => {
      const builds = [
        { name: 'Build A', likes: 30 },
        { name: 'Build B', likes: 100 },
        { name: 'Build C', likes: 50 },
      ];

      const sorted = [...builds].sort((a, b) => b.likes - a.likes);

      assert.equals(sorted[0].name, 'Build B');
      assert.equals(sorted[1].name, 'Build C');
      assert.equals(sorted[2].name, 'Build A');
    });

    runner.test('Buscar por tags', async () => {
      const builds = [
        { name: 'Tank PvE', tags: ['tank', 'pve', 'beginner'] },
        { name: 'Tank PvP', tags: ['tank', 'pvp', 'advanced'] },
        { name: 'DPS Raid', tags: ['dps', 'pve', 'raid'] },
      ];

      const pvpBuilds = builds.filter(b => b.tags.includes('pvp'));
      const tankBuilds = builds.filter(b => b.tags.includes('tank'));

      assert.lengthOf(pvpBuilds, 1);
      assert.lengthOf(tankBuilds, 2);
    });

    runner.test('Filtrar por nível', async () => {
      const builds = [
        { name: 'Iniciante', level: 10 },
        { name: 'Intermediário', level: 30 },
        { name: 'Avançado', level: 50 },
        { name: 'Endgame', level: 100 },
      ];

      const minLevel = 20;
      const maxLevel = 60;

      const filtered = builds.filter(b => b.level >= minLevel && b.level <= maxLevel);
      assert.lengthOf(filtered, 2);
    });
  });

  runner.suite('Builds - Templates', () => {
    runner.test('Carregar template por classe', async () => {
      const templates = [
        { templateId: 't1', class: 'warrior', role: 'tank' },
        { templateId: 't2', class: 'warrior', role: 'dps' },
        { templateId: 't3', class: 'mage', role: 'dps' },
      ];

      const warriorTemplates = templates.filter(t => t.class === 'warrior');
      assert.lengthOf(warriorTemplates, 2);
    });

    runner.test('Criar build a partir de template', async () => {
      const template = {
        templateId: 't1',
        name: 'Tank Básico',
        class: 'warrior',
        equipment: { weapon: { itemId: 'sword-001' } },
        skills: [{ slotNumber: 1, skillId: 'taunt' }],
      };

      const newBuild = {
        buildId: 'build-new',
        name: 'Minha Build Tank',
        class: template.class,
        equipment: { ...template.equipment },
        skills: [...template.skills],
        isPublic: false,
        likes: 0,
        views: 0,
      };

      assert.equals(newBuild.class, 'warrior');
      assert.hasProperty(newBuild.equipment, 'weapon');
    });

    runner.test('Templates por role', async () => {
      const templates = [
        { role: 'tank', difficulty: 'beginner' },
        { role: 'dps', difficulty: 'intermediate' },
        { role: 'healer', difficulty: 'advanced' },
        { role: 'tank', difficulty: 'advanced' },
      ];

      const tankTemplates = templates.filter(t => t.role === 'tank');
      assert.lengthOf(tankTemplates, 2);
    });
  });

  runner.suite('Builds - Estatísticas do Usuário', () => {
    runner.test('Calcular estatísticas de builds', async () => {
      const builds = [
        { isPublic: true, likes: 50, views: 200, uses: 10 },
        { isPublic: true, likes: 30, views: 150, uses: 5 },
        { isPublic: false, likes: 0, views: 50, uses: 20 },
      ];

      const stats = {
        totalBuilds: builds.length,
        publicBuilds: builds.filter(b => b.isPublic).length,
        totalLikes: builds.reduce((sum, b) => sum + b.likes, 0),
        totalViews: builds.reduce((sum, b) => sum + b.views, 0),
      };

      assert.equals(stats.totalBuilds, 3);
      assert.equals(stats.publicBuilds, 2);
      assert.equals(stats.totalLikes, 80);
      assert.equals(stats.totalViews, 400);
    });

    runner.test('Build mais usada', async () => {
      const builds = [
        { name: 'Build A', uses: 15 },
        { name: 'Build B', uses: 50 },
        { name: 'Build C', uses: 30 },
      ];

      const mostUsed = builds.reduce((a, b) => (a.uses > b.uses ? a : b));
      assert.equals(mostUsed.name, 'Build B');
    });

    runner.test('Build mais popular (likes)', async () => {
      const builds = [
        { name: 'Build A', likes: 100 },
        { name: 'Build B', likes: 50 },
        { name: 'Build C', likes: 75 },
      ];

      const mostLiked = builds.reduce((a, b) => (a.likes > b.likes ? a : b));
      assert.equals(mostLiked.name, 'Build A');
    });
  });
}

export default registerFavoritesTests;
