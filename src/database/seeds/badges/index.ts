/**
 * Index de todas as badges - 151 badges no total
 */

import { BadgeDefinition } from './types';
import { progressionBadges } from './01-progression';
import { timeBadges } from './02-time';
import { socialBadges } from './03-social';
import { hardwareBadges } from './04-hardware';
import { overclockingBadges } from './05-overclocking';
import { setupwarsBadges } from './06-setupwars';
import { peripheralsBadges } from './07-peripherals';
import { printBadges } from './08-3dprint';
import { moddingBadges } from './09-modding';
import { championshipBadges } from './10-championships';
import { specialBadges } from './11-special';

// Combinar todas as badges
export const allBadges: BadgeDefinition[] = [
  ...progressionBadges,      // 10 badges
  ...timeBadges,             // 8 badges
  ...socialBadges,           // 12 badges
  ...hardwareBadges,         // 15 badges
  ...overclockingBadges,     // 20 badges
  ...setupwarsBadges,        // 12 badges
  ...peripheralsBadges,      // 14 badges
  ...printBadges,            // 15 badges
  ...moddingBadges,          // 15 badges
  ...championshipBadges,     // 15 badges
  ...specialBadges,          // 15 badges
];                           // Total: 151 badges

// Exportar por categoria para uso individual
export {
  progressionBadges,
  timeBadges,
  socialBadges,
  hardwareBadges,
  overclockingBadges,
  setupwarsBadges,
  peripheralsBadges,
  printBadges,
  moddingBadges,
  championshipBadges,
  specialBadges,
};

// Exportar tipos
export * from './types';

// Funcao helper para buscar badge por ID
export function getBadgeById(badgeId: string): BadgeDefinition | undefined {
  return allBadges.find(b => b.badgeId === badgeId);
}

// Funcao helper para buscar badges por categoria
export function getBadgesByCategory(category: string): BadgeDefinition[] {
  return allBadges.filter(b => b.category === category);
}

// Funcao helper para buscar badges por raridade
export function getBadgesByRarity(rarity: string): BadgeDefinition[] {
  return allBadges.filter(b => b.rarity === rarity);
}

// Estatisticas
export const badgeStats = {
  total: allBadges.length,
  byCategory: {
    level: progressionBadges.length,
    time: timeBadges.length,
    achievement: socialBadges.length,
    hardware: hardwareBadges.length,
    overclocking: overclockingBadges.length,
    setup: setupwarsBadges.length,
    peripherals: peripheralsBadges.length,
    '3dprint': printBadges.length,
    modding: moddingBadges.length,
    championship: championshipBadges.length,
    special: specialBadges.length,
  },
  byRarity: {
    common: allBadges.filter(b => b.rarity === 'common').length,
    uncommon: allBadges.filter(b => b.rarity === 'uncommon').length,
    rare: allBadges.filter(b => b.rarity === 'rare').length,
    epic: allBadges.filter(b => b.rarity === 'epic').length,
    legendary: allBadges.filter(b => b.rarity === 'legendary').length,
  },
};
