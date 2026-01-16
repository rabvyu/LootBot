/**
 * Badges de PvP - 11 badges
 */

import { BadgeDefinition } from './types';

export const pvpBadges: BadgeDefinition[] = [
  // Victory milestones
  {
    badgeId: 'pvp_duelist',
    name: 'Duelista',
    description: 'Venceu seu primeiro duelo PvP',
    icon: '⚔️',
    category: 'pvp',
    rarity: 'common',
    requirement: { type: 'pvp_wins', value: 1 },
  },
  {
    badgeId: 'pvp_fighter',
    name: 'Lutador',
    description: 'Venceu 10 duelos PvP',
    icon: '🥊',
    category: 'pvp',
    rarity: 'uncommon',
    requirement: { type: 'pvp_wins', value: 10 },
  },
  {
    badgeId: 'pvp_warrior',
    name: 'Guerreiro PvP',
    description: 'Venceu 50 duelos PvP',
    icon: '🗡️',
    category: 'pvp',
    rarity: 'rare',
    requirement: { type: 'pvp_wins', value: 50 },
  },
  {
    badgeId: 'pvp_champion',
    name: 'Campeao de Arena',
    description: 'Venceu 100 duelos PvP',
    icon: '🏆',
    category: 'pvp',
    rarity: 'epic',
    requirement: { type: 'pvp_wins', value: 100 },
  },
  {
    badgeId: 'pvp_legend',
    name: 'Lenda do PvP',
    description: 'Venceu 500 duelos PvP',
    icon: '👑',
    category: 'pvp',
    rarity: 'legendary',
    requirement: { type: 'pvp_wins', value: 500 },
  },

  // Streak badges
  {
    badgeId: 'pvp_streak_5',
    name: 'Sequencia de Vitorias',
    description: 'Venceu 5 duelos consecutivos',
    icon: '🔥',
    category: 'pvp',
    rarity: 'uncommon',
    requirement: { type: 'pvp_streak', value: 5 },
  },
  {
    badgeId: 'pvp_streak_10',
    name: 'Imbativel',
    description: 'Venceu 10 duelos consecutivos',
    icon: '💫',
    category: 'pvp',
    rarity: 'rare',
    requirement: { type: 'pvp_streak', value: 10 },
  },

  // Rank badges
  {
    badgeId: 'pvp_gold',
    name: 'Rank Ouro',
    description: 'Alcancou o rank Ouro no PvP',
    icon: '🥇',
    category: 'pvp',
    rarity: 'uncommon',
    requirement: { type: 'pvp_rank', value: 1200 },
  },
  {
    badgeId: 'pvp_diamond',
    name: 'Rank Diamante',
    description: 'Alcancou o rank Diamante no PvP',
    icon: '💎',
    category: 'pvp',
    rarity: 'rare',
    requirement: { type: 'pvp_rank', value: 1800 },
  },
  {
    badgeId: 'pvp_master',
    name: 'Rank Mestre',
    description: 'Alcancou o rank Mestre no PvP',
    icon: '🔮',
    category: 'pvp',
    rarity: 'epic',
    requirement: { type: 'pvp_rank', value: 2100 },
  },
  {
    badgeId: 'pvp_grandmaster',
    name: 'Grao-Mestre',
    description: 'Alcancou o rank Grao-Mestre no PvP',
    icon: '👑',
    category: 'pvp',
    rarity: 'legendary',
    requirement: { type: 'pvp_rank', value: 2400 },
  },
];
