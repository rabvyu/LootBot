import { MonsterData, LocationData, LOCATIONS } from './types';
import { TIER1_MONSTERS } from './tier1-iniciante';
import { TIER2_MONSTERS } from './tier2-novato';
import { TIER3_MONSTERS } from './tier3-intermediario';
import { TIER4_MONSTERS } from './tier4-avancado';
import { TIER5_MONSTERS } from './tier5-expert';
import { TIER6_MONSTERS } from './tier6-mestre';

// Combinar todos os monstros
export const ALL_MONSTERS: MonsterData[] = [
  ...TIER1_MONSTERS,
  ...TIER2_MONSTERS,
  ...TIER3_MONSTERS,
  ...TIER4_MONSTERS,
  ...TIER5_MONSTERS,
  ...TIER6_MONSTERS,
];

// Re-exportar tipos e localizações
export { MonsterData, LocationData, LOCATIONS };

// Exportar tiers individualmente
export {
  TIER1_MONSTERS,
  TIER2_MONSTERS,
  TIER3_MONSTERS,
  TIER4_MONSTERS,
  TIER5_MONSTERS,
  TIER6_MONSTERS,
};

// Funções utilitárias

/**
 * Obtém um monstro pelo ID
 */
export function getMonsterById(id: string): MonsterData | undefined {
  return ALL_MONSTERS.find(m => m.id === id);
}

/**
 * Obtém todos os monstros de uma localização
 */
export function getMonstersByLocation(locationId: string): MonsterData[] {
  return ALL_MONSTERS.filter(m => m.location === locationId);
}

/**
 * Obtém monstros por nível (range)
 */
export function getMonstersByLevelRange(minLevel: number, maxLevel: number): MonsterData[] {
  return ALL_MONSTERS.filter(m => m.level >= minLevel && m.level <= maxLevel);
}

/**
 * Obtém monstros por tipo
 */
export function getMonstersByType(type: 'normal' | 'elite' | 'boss'): MonsterData[] {
  return ALL_MONSTERS.filter(m => m.type === type);
}

/**
 * Obtém todos os bosses
 */
export function getAllBosses(): MonsterData[] {
  return ALL_MONSTERS.filter(m => m.isBoss === true);
}

/**
 * Obtém uma localização pelo ID
 */
export function getLocationById(id: string): LocationData | undefined {
  return LOCATIONS.find(l => l.id === id);
}

/**
 * Obtém localizações por tier
 */
export function getLocationsByTier(tier: number): LocationData[] {
  return LOCATIONS.filter(l => l.tier === tier);
}

/**
 * Obtém localizações disponíveis para um nível
 */
export function getLocationsForLevel(level: number): LocationData[] {
  return LOCATIONS.filter(l => level >= l.minLevel && level <= l.maxLevel);
}

/**
 * Obtém um monstro aleatório de uma localização
 */
export function getRandomMonsterFromLocation(locationId: string, playerLevel?: number): MonsterData | undefined {
  let monsters = getMonstersByLocation(locationId);

  // Se o nível do jogador foi fornecido, filtrar monstros apropriados
  if (playerLevel !== undefined) {
    const appropriateMonsters = monsters.filter(m => {
      // Permitir monstros até 5 níveis acima ou abaixo do jogador
      return Math.abs(m.level - playerLevel) <= 5;
    });

    // Se houver monstros apropriados, usar eles; senão, usar todos da localização
    if (appropriateMonsters.length > 0) {
      monsters = appropriateMonsters;
    }
  }

  if (monsters.length === 0) return undefined;

  // Peso para tipos de monstros (normais mais comuns, bosses mais raros)
  const weightedMonsters: MonsterData[] = [];
  monsters.forEach(monster => {
    const weight = monster.type === 'boss' ? 1 : monster.type === 'elite' ? 3 : 10;
    for (let i = 0; i < weight; i++) {
      weightedMonsters.push(monster);
    }
  });

  return weightedMonsters[Math.floor(Math.random() * weightedMonsters.length)];
}

/**
 * Obtém um monstro aleatório adequado para o nível do jogador
 */
export function getRandomMonsterForLevel(playerLevel: number): MonsterData | undefined {
  // Encontrar localizações disponíveis para o nível
  const availableLocations = getLocationsForLevel(playerLevel);

  if (availableLocations.length === 0) {
    // Se não houver localização adequada, pegar a mais próxima
    const sortedLocations = [...LOCATIONS].sort((a, b) => {
      const distA = Math.min(Math.abs(a.minLevel - playerLevel), Math.abs(a.maxLevel - playerLevel));
      const distB = Math.min(Math.abs(b.minLevel - playerLevel), Math.abs(b.maxLevel - playerLevel));
      return distA - distB;
    });

    if (sortedLocations.length > 0) {
      return getRandomMonsterFromLocation(sortedLocations[0].id, playerLevel);
    }
    return undefined;
  }

  // Escolher uma localização aleatória entre as disponíveis
  const randomLocation = availableLocations[Math.floor(Math.random() * availableLocations.length)];
  return getRandomMonsterFromLocation(randomLocation.id, playerLevel);
}

// Estatísticas
export const MONSTER_STATS = {
  total: ALL_MONSTERS.length,
  byTier: {
    tier1: TIER1_MONSTERS.length,
    tier2: TIER2_MONSTERS.length,
    tier3: TIER3_MONSTERS.length,
    tier4: TIER4_MONSTERS.length,
    tier5: TIER5_MONSTERS.length,
    tier6: TIER6_MONSTERS.length,
  },
  byType: {
    normal: ALL_MONSTERS.filter(m => m.type === 'normal').length,
    elite: ALL_MONSTERS.filter(m => m.type === 'elite').length,
    boss: ALL_MONSTERS.filter(m => m.type === 'boss').length,
  },
  totalLocations: LOCATIONS.length,
};
