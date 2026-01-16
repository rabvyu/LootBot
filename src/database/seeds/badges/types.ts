/**
 * Tipos para definicao de badges
 */

export type BadgeCategory =
  | 'level'
  | 'time'
  | 'achievement'
  | 'special'
  | 'hardware'
  | 'overclocking'
  | 'setup'
  | 'peripherals'
  | '3dprint'
  | 'modding'
  | 'championship'
  | 'pvp';

export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type RequirementType =
  | 'level'
  | 'days_member'
  | 'messages'
  | 'voice_hours'
  | 'reactions_given'
  | 'reactions_received'
  | 'streak'
  | 'manual'
  | 'event'
  | 'boost'
  | 'first_members'
  | 'competition'
  | 'custom'
  | 'pvp_wins'
  | 'pvp_streak'
  | 'pvp_rank';

export interface BadgeRequirement {
  type: RequirementType;
  value: number;
  customCheck?: string; // Nome da funcao de verificacao customizada
}

export interface BadgeDefinition {
  badgeId: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  requirement: BadgeRequirement;
  rarity: BadgeRarity;
  hidden?: boolean; // Badge secreta
  limited?: boolean; // Badge de edicao limitada
}
