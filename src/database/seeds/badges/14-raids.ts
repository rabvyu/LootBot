/**
 * Badges de Raids - 9 badges
 */

import { BadgeDefinition } from './types';

export const raidBadges: BadgeDefinition[] = [
  // Participation badges
  {
    badgeId: 'raid_rookie',
    name: 'Novato das Raids',
    description: 'Participou da sua primeira raid',
    icon: '⚔️',
    category: 'achievement',
    rarity: 'common',
    requirement: { type: 'custom', value: 1 },
  },
  {
    badgeId: 'raid_veteran',
    name: 'Veterano de Raids',
    description: 'Venceu 5 raids',
    icon: '🗡️',
    category: 'achievement',
    rarity: 'uncommon',
    requirement: { type: 'custom', value: 5 },
  },
  {
    badgeId: 'raid_champion',
    name: 'Campeao das Raids',
    description: 'Venceu 25 raids',
    icon: '🏆',
    category: 'achievement',
    rarity: 'rare',
    requirement: { type: 'custom', value: 25 },
  },
  {
    badgeId: 'raid_master',
    name: 'Mestre das Raids',
    description: 'Venceu 50 raids',
    icon: '👑',
    category: 'achievement',
    rarity: 'epic',
    requirement: { type: 'custom', value: 50 },
  },
  {
    badgeId: 'raid_legend',
    name: 'Lenda das Raids',
    description: 'Venceu 100 raids',
    icon: '🌟',
    category: 'achievement',
    rarity: 'legendary',
    requirement: { type: 'custom', value: 100 },
  },

  // Boss slayer badges
  {
    badgeId: 'boss_hunter',
    name: 'Cacador de Bosses',
    description: 'Derrotou 3 tipos diferentes de boss',
    icon: '🎯',
    category: 'achievement',
    rarity: 'uncommon',
    requirement: { type: 'custom', value: 3 },
  },
  {
    badgeId: 'boss_slayer',
    name: 'Matador de Bosses',
    description: 'Derrotou todos os 5 tipos de boss',
    icon: '💀',
    category: 'achievement',
    rarity: 'rare',
    requirement: { type: 'custom', value: 5 },
  },

  // Damage badges
  {
    badgeId: 'damage_dealer',
    name: 'Destruidor',
    description: 'Causou 100.000 de dano total em raids',
    icon: '💥',
    category: 'achievement',
    rarity: 'rare',
    requirement: { type: 'custom', value: 100000 },
  },
  {
    badgeId: 'devastator',
    name: 'Devastador',
    description: 'Causou 1.000.000 de dano total em raids',
    icon: '☄️',
    category: 'achievement',
    rarity: 'legendary',
    requirement: { type: 'custom', value: 1000000 },
  },
];
