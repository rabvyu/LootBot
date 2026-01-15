/**
 * Badges de Tempo de Comunidade - 8 badges
 */

import { BadgeDefinition } from './types';

export const timeBadges: BadgeDefinition[] = [
  {
    badgeId: 'time_1w',
    name: 'Novato',
    description: '1 semana na comunidade',
    icon: '📅',
    category: 'time',
    requirement: { type: 'days_member', value: 7 },
    rarity: 'common',
  },
  {
    badgeId: 'time_1m',
    name: 'Membro',
    description: '1 mes na comunidade',
    icon: '🗓️',
    category: 'time',
    requirement: { type: 'days_member', value: 30 },
    rarity: 'common',
  },
  {
    badgeId: 'time_3m',
    name: 'Regular',
    description: '3 meses na comunidade',
    icon: '📆',
    category: 'time',
    requirement: { type: 'days_member', value: 90 },
    rarity: 'uncommon',
  },
  {
    badgeId: 'time_6m',
    name: 'Fiel',
    description: '6 meses na comunidade',
    icon: '🏛️',
    category: 'time',
    requirement: { type: 'days_member', value: 180 },
    rarity: 'uncommon',
  },
  {
    badgeId: 'time_1y',
    name: 'Veterano',
    description: '1 ano na comunidade',
    icon: '🏆',
    category: 'time',
    requirement: { type: 'days_member', value: 365 },
    rarity: 'rare',
  },
  {
    badgeId: 'time_2y',
    name: 'Antigo',
    description: '2 anos na comunidade',
    icon: '⭐',
    category: 'time',
    requirement: { type: 'days_member', value: 730 },
    rarity: 'epic',
  },
  {
    badgeId: 'time_3y',
    name: 'Ancestral',
    description: '3 anos na comunidade',
    icon: '👴',
    category: 'time',
    requirement: { type: 'days_member', value: 1095 },
    rarity: 'epic',
  },
  {
    badgeId: 'time_founder',
    name: 'Fundador',
    description: 'Um dos primeiros 100 membros',
    icon: '🌟',
    category: 'time',
    requirement: { type: 'first_members', value: 100 },
    rarity: 'legendary',
  },
];
