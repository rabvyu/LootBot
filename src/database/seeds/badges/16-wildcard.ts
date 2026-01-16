/**
 * Badges de Classes Wildcard - 54 badges
 *
 * Classes Wildcard:
 * - Intermediarias (5% chance): chaos_disciple, light_avatar
 * - Avancadas (1% chance): transcendent, void_walker, inner_demon, legendary_hero
 *
 * Categorias:
 * - Primeiros 5 jogadores a conseguir cada classe (30 badges)
 * - Conquistas por classe (18 badges)
 * - Conquistas gerais de wildcard (6 badges)
 */

import { BadgeDefinition } from './types';

export const wildcardBadges: BadgeDefinition[] = [
  // ============================================
  // PRIMEIROS 5 - CLASSES INTERMEDIARIAS
  // ============================================

  // Discipulo do Caos - Primeiros 5
  {
    badgeId: 'wildcard_chaos_first_1',
    name: 'Primeiro Discipulo do Caos',
    description: 'Primeiro jogador a desbloquear a classe Discipulo do Caos',
    icon: '🌀',
    category: 'wildcard',
    requirement: { type: 'wildcard_first', value: 1, customCheck: 'chaos_disciple_first_1' },
    rarity: 'legendary',
    limited: true,
  },
  {
    badgeId: 'wildcard_chaos_first_2',
    name: 'Segundo Discipulo do Caos',
    description: 'Segundo jogador a desbloquear a classe Discipulo do Caos',
    icon: '🌀',
    category: 'wildcard',
    requirement: { type: 'wildcard_first', value: 2, customCheck: 'chaos_disciple_first_2' },
    rarity: 'epic',
    limited: true,
  },
  {
    badgeId: 'wildcard_chaos_first_3',
    name: 'Terceiro Discipulo do Caos',
    description: 'Terceiro jogador a desbloquear a classe Discipulo do Caos',
    icon: '🌀',
    category: 'wildcard',
    requirement: { type: 'wildcard_first', value: 3, customCheck: 'chaos_disciple_first_3' },
    rarity: 'epic',
    limited: true,
  },
  {
    badgeId: 'wildcard_chaos_first_4',
    name: 'Quarto Discipulo do Caos',
    description: 'Quarto jogador a desbloquear a classe Discipulo do Caos',
    icon: '🌀',
    category: 'wildcard',
    requirement: { type: 'wildcard_first', value: 4, customCheck: 'chaos_disciple_first_4' },
    rarity: 'rare',
    limited: true,
  },
  {
    badgeId: 'wildcard_chaos_first_5',
    name: 'Quinto Discipulo do Caos',
    description: 'Quinto jogador a desbloquear a classe Discipulo do Caos',
    icon: '🌀',
    category: 'wildcard',
    requirement: { type: 'wildcard_first', value: 5, customCheck: 'chaos_disciple_first_5' },
    rarity: 'rare',
    limited: true,
  },

  // Avatar da Luz - Primeiros 5
  {
    badgeId: 'wildcard_light_first_1',
    name: 'Primeiro Avatar da Luz',
    description: 'Primeiro jogador a desbloquear a classe Avatar da Luz',
    icon: '🌟',
    category: 'wildcard',
    requirement: { type: 'wildcard_first', value: 1, customCheck: 'light_avatar_first_1' },
    rarity: 'legendary',
    limited: true,
  },
  {
    badgeId: 'wildcard_light_first_2',
    name: 'Segundo Avatar da Luz',
    description: 'Segundo jogador a desbloquear a classe Avatar da Luz',
    icon: '🌟',
    category: 'wildcard',
    requirement: { type: 'wildcard_first', value: 2, customCheck: 'light_avatar_first_2' },
    rarity: 'epic',
    limited: true,
  },
  {
    badgeId: 'wildcard_light_first_3',
    name: 'Terceiro Avatar da Luz',
    description: 'Terceiro jogador a desbloquear a classe Avatar da Luz',
    icon: '🌟',
    category: 'wildcard',
    requirement: { type: 'wildcard_first', value: 3, customCheck: 'light_avatar_first_3' },
    rarity: 'epic',
    limited: true,
  },
  {
    badgeId: 'wildcard_light_first_4',
    name: 'Quarto Avatar da Luz',
    description: 'Quarto jogador a desbloquear a classe Avatar da Luz',
    icon: '🌟',
    category: 'wildcard',
    requirement: { type: 'wildcard_first', value: 4, customCheck: 'light_avatar_first_4' },
    rarity: 'rare',
    limited: true,
  },
  {
    badgeId: 'wildcard_light_first_5',
    name: 'Quinto Avatar da Luz',
    description: 'Quinto jogador a desbloquear a classe Avatar da Luz',
    icon: '🌟',
    category: 'wildcard',
    requirement: { type: 'wildcard_first', value: 5, customCheck: 'light_avatar_first_5' },
    rarity: 'rare',
    limited: true,
  },

  // ============================================
  // PRIMEIROS 5 - CLASSES AVANCADAS
  // ============================================

  // Transcendente - Primeiros 5
  {
    badgeId: 'wildcard_transcendent_first_1',
    name: 'Primeiro Transcendente',
    description: 'Primeiro jogador a desbloquear a classe Transcendente - a mais rara!',
    icon: '💎',
    category: 'wildcard',
    requirement: { type: 'wildcard_first', value: 1, customCheck: 'transcendent_first_1' },
    rarity: 'legendary',
    limited: true,
  },
  {
    badgeId: 'wildcard_transcendent_first_2',
    name: 'Segundo Transcendente',
    description: 'Segundo jogador a desbloquear a classe Transcendente',
    icon: '💎',
    category: 'wildcard',
    requirement: { type: 'wildcard_first', value: 2, customCheck: 'transcendent_first_2' },
    rarity: 'legendary',
    limited: true,
  },
  {
    badgeId: 'wildcard_transcendent_first_3',
    name: 'Terceiro Transcendente',
    description: 'Terceiro jogador a desbloquear a classe Transcendente',
    icon: '💎',
    category: 'wildcard',
    requirement: { type: 'wildcard_first', value: 3, customCheck: 'transcendent_first_3' },
    rarity: 'epic',
    limited: true,
  },
  {
    badgeId: 'wildcard_transcendent_first_4',
    name: 'Quarto Transcendente',
    description: 'Quarto jogador a desbloquear a classe Transcendente',
    icon: '💎',
    category: 'wildcard',
    requirement: { type: 'wildcard_first', value: 4, customCheck: 'transcendent_first_4' },
    rarity: 'epic',
    limited: true,
  },
  {
    badgeId: 'wildcard_transcendent_first_5',
    name: 'Quinto Transcendente',
    description: 'Quinto jogador a desbloquear a classe Transcendente',
    icon: '💎',
    category: 'wildcard',
    requirement: { type: 'wildcard_first', value: 5, customCheck: 'transcendent_first_5' },
    rarity: 'epic',
    limited: true,
  },

  // Void Walker - Primeiros 5
  {
    badgeId: 'wildcard_void_first_1',
    name: 'Primeiro Void Walker',
    description: 'Primeiro jogador a desbloquear a classe Void Walker',
    icon: '🌌',
    category: 'wildcard',
    requirement: { type: 'wildcard_first', value: 1, customCheck: 'void_walker_first_1' },
    rarity: 'legendary',
    limited: true,
  },
  {
    badgeId: 'wildcard_void_first_2',
    name: 'Segundo Void Walker',
    description: 'Segundo jogador a desbloquear a classe Void Walker',
    icon: '🌌',
    category: 'wildcard',
    requirement: { type: 'wildcard_first', value: 2, customCheck: 'void_walker_first_2' },
    rarity: 'legendary',
    limited: true,
  },
  {
    badgeId: 'wildcard_void_first_3',
    name: 'Terceiro Void Walker',
    description: 'Terceiro jogador a desbloquear a classe Void Walker',
    icon: '🌌',
    category: 'wildcard',
    requirement: { type: 'wildcard_first', value: 3, customCheck: 'void_walker_first_3' },
    rarity: 'epic',
    limited: true,
  },
  {
    badgeId: 'wildcard_void_first_4',
    name: 'Quarto Void Walker',
    description: 'Quarto jogador a desbloquear a classe Void Walker',
    icon: '🌌',
    category: 'wildcard',
    requirement: { type: 'wildcard_first', value: 4, customCheck: 'void_walker_first_4' },
    rarity: 'epic',
    limited: true,
  },
  {
    badgeId: 'wildcard_void_first_5',
    name: 'Quinto Void Walker',
    description: 'Quinto jogador a desbloquear a classe Void Walker',
    icon: '🌌',
    category: 'wildcard',
    requirement: { type: 'wildcard_first', value: 5, customCheck: 'void_walker_first_5' },
    rarity: 'epic',
    limited: true,
  },

  // Demonio Interior - Primeiros 5
  {
    badgeId: 'wildcard_demon_first_1',
    name: 'Primeiro Demonio Interior',
    description: 'Primeiro jogador a desbloquear a classe Demonio Interior',
    icon: '👹',
    category: 'wildcard',
    requirement: { type: 'wildcard_first', value: 1, customCheck: 'inner_demon_first_1' },
    rarity: 'legendary',
    limited: true,
  },
  {
    badgeId: 'wildcard_demon_first_2',
    name: 'Segundo Demonio Interior',
    description: 'Segundo jogador a desbloquear a classe Demonio Interior',
    icon: '👹',
    category: 'wildcard',
    requirement: { type: 'wildcard_first', value: 2, customCheck: 'inner_demon_first_2' },
    rarity: 'legendary',
    limited: true,
  },
  {
    badgeId: 'wildcard_demon_first_3',
    name: 'Terceiro Demonio Interior',
    description: 'Terceiro jogador a desbloquear a classe Demonio Interior',
    icon: '👹',
    category: 'wildcard',
    requirement: { type: 'wildcard_first', value: 3, customCheck: 'inner_demon_first_3' },
    rarity: 'epic',
    limited: true,
  },
  {
    badgeId: 'wildcard_demon_first_4',
    name: 'Quarto Demonio Interior',
    description: 'Quarto jogador a desbloquear a classe Demonio Interior',
    icon: '👹',
    category: 'wildcard',
    requirement: { type: 'wildcard_first', value: 4, customCheck: 'inner_demon_first_4' },
    rarity: 'epic',
    limited: true,
  },
  {
    badgeId: 'wildcard_demon_first_5',
    name: 'Quinto Demonio Interior',
    description: 'Quinto jogador a desbloquear a classe Demonio Interior',
    icon: '👹',
    category: 'wildcard',
    requirement: { type: 'wildcard_first', value: 5, customCheck: 'inner_demon_first_5' },
    rarity: 'epic',
    limited: true,
  },

  // Heroi Lendario - Primeiros 5
  {
    badgeId: 'wildcard_hero_first_1',
    name: 'Primeiro Heroi Lendario',
    description: 'Primeiro jogador a desbloquear a classe Heroi Lendario',
    icon: '🏆',
    category: 'wildcard',
    requirement: { type: 'wildcard_first', value: 1, customCheck: 'legendary_hero_first_1' },
    rarity: 'legendary',
    limited: true,
  },
  {
    badgeId: 'wildcard_hero_first_2',
    name: 'Segundo Heroi Lendario',
    description: 'Segundo jogador a desbloquear a classe Heroi Lendario',
    icon: '🏆',
    category: 'wildcard',
    requirement: { type: 'wildcard_first', value: 2, customCheck: 'legendary_hero_first_2' },
    rarity: 'legendary',
    limited: true,
  },
  {
    badgeId: 'wildcard_hero_first_3',
    name: 'Terceiro Heroi Lendario',
    description: 'Terceiro jogador a desbloquear a classe Heroi Lendario',
    icon: '🏆',
    category: 'wildcard',
    requirement: { type: 'wildcard_first', value: 3, customCheck: 'legendary_hero_first_3' },
    rarity: 'epic',
    limited: true,
  },
  {
    badgeId: 'wildcard_hero_first_4',
    name: 'Quarto Heroi Lendario',
    description: 'Quarto jogador a desbloquear a classe Heroi Lendario',
    icon: '🏆',
    category: 'wildcard',
    requirement: { type: 'wildcard_first', value: 4, customCheck: 'legendary_hero_first_4' },
    rarity: 'epic',
    limited: true,
  },
  {
    badgeId: 'wildcard_hero_first_5',
    name: 'Quinto Heroi Lendario',
    description: 'Quinto jogador a desbloquear a classe Heroi Lendario',
    icon: '🏆',
    category: 'wildcard',
    requirement: { type: 'wildcard_first', value: 5, customCheck: 'legendary_hero_first_5' },
    rarity: 'epic',
    limited: true,
  },

  // ============================================
  // CONQUISTAS POR CLASSE - DISCIPULO DO CAOS
  // ============================================
  {
    badgeId: 'wildcard_chaos_master',
    name: 'Mestre do Caos',
    description: 'Venca 100 batalhas como Discipulo do Caos',
    icon: '🌀',
    category: 'wildcard',
    requirement: { type: 'wildcard_battles', value: 100, customCheck: 'chaos_disciple_wins' },
    rarity: 'epic',
  },
  {
    badgeId: 'wildcard_chaos_incarnate',
    name: 'Caos Encarnado',
    description: 'Cause 100.000 de dano como Discipulo do Caos',
    icon: '💥',
    category: 'wildcard',
    requirement: { type: 'wildcard_damage', value: 100000, customCheck: 'chaos_disciple_damage' },
    rarity: 'epic',
  },
  {
    badgeId: 'wildcard_true_chaos',
    name: 'Caos Verdadeiro',
    description: 'Ative 200 efeitos aleatorios com Caos Aleatorio',
    icon: '🎲',
    category: 'wildcard',
    requirement: { type: 'custom', value: 200, customCheck: 'chaos_random_effects' },
    rarity: 'rare',
  },

  // ============================================
  // CONQUISTAS POR CLASSE - AVATAR DA LUZ
  // ============================================
  {
    badgeId: 'wildcard_light_bearer',
    name: 'Portador da Luz',
    description: 'Cure 100.000 de HP como Avatar da Luz',
    icon: '💚',
    category: 'wildcard',
    requirement: { type: 'custom', value: 100000, customCheck: 'light_avatar_healing' },
    rarity: 'epic',
  },
  {
    badgeId: 'wildcard_divine_light',
    name: 'Luz Divina',
    description: 'Purifique 100 debuffs com Pureza',
    icon: '✨',
    category: 'wildcard',
    requirement: { type: 'custom', value: 100, customCheck: 'light_avatar_purify' },
    rarity: 'rare',
  },
  {
    badgeId: 'wildcard_supreme_avatar',
    name: 'Avatar Supremo',
    description: 'Venca 50 batalhas sem receber debuffs como Avatar da Luz',
    icon: '👼',
    category: 'wildcard',
    requirement: { type: 'wildcard_battles', value: 50, customCheck: 'light_avatar_no_debuff_wins' },
    rarity: 'legendary',
  },

  // ============================================
  // CONQUISTAS POR CLASSE - TRANSCENDENTE
  // ============================================
  {
    badgeId: 'wildcard_beyond_mortality',
    name: 'Alem da Mortalidade',
    description: 'Atinja nivel 100 como Transcendente',
    icon: '⭐',
    category: 'wildcard',
    requirement: { type: 'level', value: 100, customCheck: 'transcendent_max_level' },
    rarity: 'legendary',
  },
  {
    badgeId: 'wildcard_multi_master',
    name: 'Multi-Mestre',
    description: 'Use ultimates de 6 classes diferentes com Convergencia',
    icon: '🔮',
    category: 'wildcard',
    requirement: { type: 'custom', value: 6, customCheck: 'transcendent_convergence' },
    rarity: 'epic',
  },
  {
    badgeId: 'wildcard_ethereal',
    name: 'Forma Eterea',
    description: 'Ignore 200 ataques com Forma Eterea (30% chance)',
    icon: '👻',
    category: 'wildcard',
    requirement: { type: 'custom', value: 200, customCheck: 'transcendent_ethereal_dodges' },
    rarity: 'epic',
  },

  // ============================================
  // CONQUISTAS POR CLASSE - VOID WALKER
  // ============================================
  {
    badgeId: 'wildcard_dimension_hopper',
    name: 'Saltador Dimensional',
    description: 'Use Portal 100 vezes para fugir e voltar a batalhas',
    icon: '🌀',
    category: 'wildcard',
    requirement: { type: 'custom', value: 100, customCheck: 'void_walker_portal_uses' },
    rarity: 'rare',
  },
  {
    badgeId: 'wildcard_reality_bender',
    name: 'Dobrador da Realidade',
    description: 'Repita 150 ataques com Distorcao (25% chance)',
    icon: '🔄',
    category: 'wildcard',
    requirement: { type: 'custom', value: 150, customCheck: 'void_walker_distortion' },
    rarity: 'epic',
  },
  {
    badgeId: 'wildcard_void_master',
    name: 'Mestre do Vazio',
    description: 'Venca 100 batalhas como Void Walker',
    icon: '🌌',
    category: 'wildcard',
    requirement: { type: 'wildcard_battles', value: 100, customCheck: 'void_walker_wins' },
    rarity: 'epic',
  },

  // ============================================
  // CONQUISTAS POR CLASSE - DEMONIO INTERIOR
  // ============================================
  {
    badgeId: 'wildcard_demon_form',
    name: 'Forma Demoniaca',
    description: 'Entre em Forma Demoniaca 100 vezes',
    icon: '😈',
    category: 'wildcard',
    requirement: { type: 'custom', value: 100, customCheck: 'inner_demon_form_uses' },
    rarity: 'rare',
  },
  {
    badgeId: 'wildcard_soul_eater',
    name: 'Devorador de Almas',
    description: 'Drene 100.000 de HP com Drenar Almas (25% lifesteal)',
    icon: '💀',
    category: 'wildcard',
    requirement: { type: 'custom', value: 100000, customCheck: 'inner_demon_lifesteal' },
    rarity: 'epic',
  },
  {
    badgeId: 'wildcard_hellfire',
    name: 'Fogo Infernal',
    description: 'Cause 200.000 de dano como Demonio Interior',
    icon: '🔥',
    category: 'wildcard',
    requirement: { type: 'wildcard_damage', value: 200000, customCheck: 'inner_demon_damage' },
    rarity: 'legendary',
  },

  // ============================================
  // CONQUISTAS POR CLASSE - HEROI LENDARIO
  // ============================================
  {
    badgeId: 'wildcard_living_legend',
    name: 'Lenda Viva',
    description: 'Inspire aliados 200 vezes com Inspiracao (+30% stats)',
    icon: '🌟',
    category: 'wildcard',
    requirement: { type: 'custom', value: 200, customCheck: 'legendary_hero_inspiration' },
    rarity: 'epic',
  },
  {
    badgeId: 'wildcard_heros_journey',
    name: 'Jornada do Heroi',
    description: 'Venca 200 batalhas como Heroi Lendario',
    icon: '⚔️',
    category: 'wildcard',
    requirement: { type: 'wildcard_battles', value: 200, customCheck: 'legendary_hero_wins' },
    rarity: 'legendary',
  },
  {
    badgeId: 'wildcard_moment_glory',
    name: 'Momento de Gloria',
    description: 'Sobreviva a dano fatal 50 vezes com Momento Lendario',
    icon: '💫',
    category: 'wildcard',
    requirement: { type: 'custom', value: 50, customCheck: 'legendary_hero_death_immunity' },
    rarity: 'legendary',
  },

  // ============================================
  // CONQUISTAS GERAIS DE WILDCARD
  // ============================================
  {
    badgeId: 'wildcard_lucky_soul',
    name: 'Alma Sortuda',
    description: 'Consiga uma classe Wildcard na primeira tentativa de evolucao',
    icon: '🍀',
    category: 'wildcard',
    requirement: { type: 'custom', value: 1, customCheck: 'first_try_wildcard' },
    rarity: 'legendary',
    hidden: true,
  },
  {
    badgeId: 'wildcard_against_odds',
    name: 'Contra Todas as Chances',
    description: 'Consiga uma classe Wildcard Avancada (1% de chance)',
    icon: '🎰',
    category: 'wildcard',
    requirement: { type: 'wildcard_class', value: 1, customCheck: 'advanced_wildcard_unlock' },
    rarity: 'epic',
  },
  {
    badgeId: 'wildcard_collector',
    name: 'Colecionador Wildcard',
    description: 'Desbloqueie 3 classes Wildcard diferentes (qualquer personagem)',
    icon: '📚',
    category: 'wildcard',
    requirement: { type: 'wildcard_collector', value: 3 },
    rarity: 'epic',
  },
  {
    badgeId: 'wildcard_ultimate_collector',
    name: 'Colecionador Supremo',
    description: 'Desbloqueie todas as 6 classes Wildcard',
    icon: '🏅',
    category: 'wildcard',
    requirement: { type: 'wildcard_collector', value: 6 },
    rarity: 'legendary',
  },
  {
    badgeId: 'wildcard_persistent',
    name: 'Persistente',
    description: 'Tente conseguir uma Wildcard 50 vezes (mesmo sem sucesso)',
    icon: '🎯',
    category: 'wildcard',
    requirement: { type: 'custom', value: 50, customCheck: 'wildcard_attempts' },
    rarity: 'rare',
  },
  {
    badgeId: 'wildcard_double_lucky',
    name: 'Sorte Dobrada',
    description: 'Consiga 2 classes Wildcard em menos de 10 tentativas',
    icon: '🎲',
    category: 'wildcard',
    requirement: { type: 'custom', value: 2, customCheck: 'wildcard_quick_double' },
    rarity: 'legendary',
    hidden: true,
  },
];
