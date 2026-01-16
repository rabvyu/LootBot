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
  | 'pvp'
  | 'wildcard';

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
  | 'pvp_rank'
  | 'wildcard_first'       // Primeiros a conseguir classe wildcard
  | 'wildcard_class'       // Ter classe wildcard específica
  | 'wildcard_battles'     // Vitórias com classe wildcard
  | 'wildcard_damage'      // Dano causado com classe wildcard
  | 'wildcard_collector';  // Coleção de classes wildcard

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
