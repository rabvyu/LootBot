/**
 * Badges de Generosidade - 4 badges
 */

import { BadgeDefinition } from './types';

export const giftBadges: BadgeDefinition[] = [
  {
    badgeId: 'generous_heart',
    name: 'Coracao Generoso',
    description: 'Enviou seu primeiro presente',
    icon: '💝',
    category: 'achievement',
    rarity: 'common',
    requirement: { type: 'custom', value: 1 },
  },
  {
    badgeId: 'gift_giver',
    name: 'Presenteador',
    description: 'Enviou 10 presentes',
    icon: '🎁',
    category: 'achievement',
    rarity: 'uncommon',
    requirement: { type: 'custom', value: 10 },
  },
  {
    badgeId: 'santa_claus',
    name: 'Papai Noel',
    description: 'Enviou 50 presentes',
    icon: '🎅',
    category: 'achievement',
    rarity: 'rare',
    requirement: { type: 'custom', value: 50 },
  },
  {
    badgeId: 'philanthropist',
    name: 'Filantropo',
    description: 'Enviou 100 presentes',
    icon: '👑',
    category: 'achievement',
    rarity: 'epic',
    requirement: { type: 'custom', value: 100 },
  },
];
