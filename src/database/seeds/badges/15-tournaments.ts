/**
 * Badges de Torneios - 7 badges
 */

import { BadgeDefinition } from './types';

export const tournamentBadges: BadgeDefinition[] = [
  // Participation badges
  {
    badgeId: 'tournament_rookie',
    name: 'Novato dos Torneios',
    description: 'Participou do seu primeiro torneio',
    icon: '🎮',
    category: 'achievement',
    rarity: 'common',
    requirement: { type: 'custom', value: 1 },
  },
  {
    badgeId: 'tournament_regular',
    name: 'Competidor Regular',
    description: 'Participou de 10 torneios',
    icon: '🎯',
    category: 'achievement',
    rarity: 'uncommon',
    requirement: { type: 'custom', value: 10 },
  },
  {
    badgeId: 'tournament_veteran',
    name: 'Veterano de Torneios',
    description: 'Participou de 50 torneios',
    icon: '⚔️',
    category: 'achievement',
    rarity: 'rare',
    requirement: { type: 'custom', value: 50 },
  },

  // Victory badges
  {
    badgeId: 'tournament_winner',
    name: 'Campeao',
    description: 'Venceu seu primeiro torneio',
    icon: '🏆',
    category: 'achievement',
    rarity: 'rare',
    requirement: { type: 'custom', value: 1 },
  },
  {
    badgeId: 'tournament_champion',
    name: 'Multi-Campeao',
    description: 'Venceu 5 torneios',
    icon: '👑',
    category: 'achievement',
    rarity: 'epic',
    requirement: { type: 'custom', value: 5 },
  },
  {
    badgeId: 'tournament_legend',
    name: 'Lenda dos Torneios',
    description: 'Venceu 10 torneios',
    icon: '🌟',
    category: 'achievement',
    rarity: 'legendary',
    requirement: { type: 'custom', value: 10 },
  },

  // Podium badge
  {
    badgeId: 'podium_collector',
    name: 'Colecionador de Podios',
    description: 'Ficou no podio 10 vezes',
    icon: '🏅',
    category: 'achievement',
    rarity: 'epic',
    requirement: { type: 'custom', value: 10 },
  },
];
