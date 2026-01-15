import { MonsterData } from './types';

// Tier 1 - Iniciante (Nível 1-7) - 25 monstros
export const TIER1_MONSTERS: MonsterData[] = [
  // Floresta Verde (5)
  { id: 'slime_verde', name: 'Slime Verde', emoji: '🟢', description: 'Um slime gelatinoso e lento.', type: 'normal', level: 1, hp: 25, attack: 4, defense: 1, xpReward: 10, coinsReward: { min: 5, max: 15 }, drops: [{ resourceId: 'essence', chance: 5, minAmount: 1, maxAmount: 1 }], location: 'floresta_verde' },
  { id: 'coelho_selvagem', name: 'Coelho Selvagem', emoji: '🐰', description: 'Um coelho agressivo.', type: 'normal', level: 1, hp: 20, attack: 5, defense: 0, xpReward: 8, coinsReward: { min: 3, max: 10 }, drops: [], location: 'floresta_verde' },
  { id: 'rato_gigante', name: 'Rato Gigante', emoji: '🐀', description: 'Um rato maior que o normal.', type: 'normal', level: 2, hp: 30, attack: 6, defense: 2, xpReward: 12, coinsReward: { min: 8, max: 18 }, drops: [], location: 'floresta_verde' },
  { id: 'abelha_raivosa', name: 'Abelha Raivosa', emoji: '🐝', description: 'Uma abelha venenosa.', type: 'normal', level: 2, hp: 15, attack: 8, defense: 0, xpReward: 10, coinsReward: { min: 5, max: 12 }, drops: [{ resourceId: 'essence', chance: 8, minAmount: 1, maxAmount: 1 }], location: 'floresta_verde' },
  { id: 'lobo_filhote', name: 'Lobo Filhote', emoji: '🐺', description: 'Um filhote de lobo perdido.', type: 'normal', level: 3, hp: 40, attack: 9, defense: 3, xpReward: 18, coinsReward: { min: 10, max: 25 }, drops: [{ resourceId: 'wood', chance: 15, minAmount: 1, maxAmount: 2 }], location: 'floresta_verde' },

  // Planície (5)
  { id: 'javali', name: 'Javali', emoji: '🐗', description: 'Um javali selvagem.', type: 'normal', level: 1, hp: 35, attack: 7, defense: 2, xpReward: 12, coinsReward: { min: 8, max: 20 }, drops: [], location: 'planicie' },
  { id: 'cobra_pequena', name: 'Cobra Pequena', emoji: '🐍', description: 'Uma cobra venenosa.', type: 'normal', level: 2, hp: 22, attack: 9, defense: 1, xpReward: 14, coinsReward: { min: 10, max: 22 }, drops: [{ resourceId: 'essence', chance: 10, minAmount: 1, maxAmount: 1 }], location: 'planicie' },
  { id: 'corvo', name: 'Corvo', emoji: '🐦‍⬛', description: 'Um corvo agressivo.', type: 'normal', level: 2, hp: 18, attack: 7, defense: 0, xpReward: 10, coinsReward: { min: 5, max: 15 }, drops: [], location: 'planicie' },
  { id: 'tartaruga', name: 'Tartaruga', emoji: '🐢', description: 'Uma tartaruga defensiva.', type: 'normal', level: 3, hp: 50, attack: 4, defense: 8, xpReward: 15, coinsReward: { min: 12, max: 28 }, drops: [{ resourceId: 'stone', chance: 20, minAmount: 1, maxAmount: 3 }], location: 'planicie' },
  { id: 'raposa', name: 'Raposa', emoji: '🦊', description: 'Uma raposa astuta.', type: 'normal', level: 3, hp: 32, attack: 10, defense: 2, xpReward: 16, coinsReward: { min: 12, max: 25 }, drops: [], location: 'planicie' },

  // Fazenda (5)
  { id: 'espantalho_vivo', name: 'Espantalho Vivo', emoji: '🎃', description: 'Um espantalho animado.', type: 'normal', level: 2, hp: 35, attack: 8, defense: 2, xpReward: 15, coinsReward: { min: 10, max: 22 }, drops: [{ resourceId: 'wood', chance: 25, minAmount: 1, maxAmount: 3 }], location: 'fazenda' },
  { id: 'galinha_mutante', name: 'Galinha Mutante', emoji: '🐔', description: 'Uma galinha estranhamente grande.', type: 'normal', level: 3, hp: 28, attack: 10, defense: 1, xpReward: 14, coinsReward: { min: 8, max: 18 }, drops: [], location: 'fazenda' },
  { id: 'porco_zumbi', name: 'Porco Zumbi', emoji: '🐷', description: 'Um porco morto-vivo.', type: 'normal', level: 4, hp: 45, attack: 11, defense: 3, xpReward: 22, coinsReward: { min: 15, max: 30 }, drops: [{ resourceId: 'essence', chance: 12, minAmount: 1, maxAmount: 2 }], location: 'fazenda' },
  { id: 'vaca_louca', name: 'Vaca Louca', emoji: '🐄', description: 'Uma vaca enlouquecida.', type: 'normal', level: 4, hp: 55, attack: 9, defense: 4, xpReward: 20, coinsReward: { min: 12, max: 28 }, drops: [], location: 'fazenda' },
  { id: 'golem_palha', name: 'Golem de Palha', emoji: '🌾', description: 'Um golem feito de palha.', type: 'elite', level: 5, hp: 70, attack: 12, defense: 5, xpReward: 35, coinsReward: { min: 25, max: 50 }, drops: [{ resourceId: 'wood', chance: 40, minAmount: 2, maxAmount: 5 }], location: 'fazenda' },

  // Rio (5)
  { id: 'piranha', name: 'Peixe Piranha', emoji: '🐟', description: 'Uma piranha faminta.', type: 'normal', level: 2, hp: 20, attack: 10, defense: 0, xpReward: 12, coinsReward: { min: 8, max: 18 }, drops: [{ resourceId: 'fish_common', chance: 30, minAmount: 1, maxAmount: 2 }], location: 'rio' },
  { id: 'sapo_venenoso', name: 'Sapo Venenoso', emoji: '🐸', description: 'Um sapo tóxico.', type: 'normal', level: 3, hp: 25, attack: 12, defense: 1, xpReward: 16, coinsReward: { min: 10, max: 22 }, drops: [{ resourceId: 'essence', chance: 15, minAmount: 1, maxAmount: 1 }], location: 'rio' },
  { id: 'caranguejo', name: 'Caranguejo', emoji: '🦀', description: 'Um caranguejo de pinças afiadas.', type: 'normal', level: 3, hp: 40, attack: 8, defense: 6, xpReward: 18, coinsReward: { min: 12, max: 25 }, drops: [], location: 'rio' },
  { id: 'lontra_furiosa', name: 'Lontra Furiosa', emoji: '🦦', description: 'Uma lontra territorial.', type: 'normal', level: 4, hp: 35, attack: 11, defense: 3, xpReward: 20, coinsReward: { min: 14, max: 30 }, drops: [{ resourceId: 'fish_uncommon', chance: 15, minAmount: 1, maxAmount: 1 }], location: 'rio' },
  { id: 'serpente_agua', name: 'Serpente d\'Água', emoji: '🐍', description: 'Uma serpente aquática.', type: 'elite', level: 5, hp: 55, attack: 14, defense: 4, xpReward: 30, coinsReward: { min: 20, max: 45 }, drops: [{ resourceId: 'essence', chance: 25, minAmount: 1, maxAmount: 2 }], location: 'rio' },

  // Colinas (5)
  { id: 'cabra_montesa', name: 'Cabra Montesa', emoji: '🐐', description: 'Uma cabra das montanhas.', type: 'normal', level: 3, hp: 45, attack: 10, defense: 4, xpReward: 18, coinsReward: { min: 12, max: 28 }, drops: [], location: 'colinas' },
  { id: 'aguia_agressiva', name: 'Águia Agressiva', emoji: '🦅', description: 'Uma águia territorial.', type: 'normal', level: 4, hp: 35, attack: 14, defense: 2, xpReward: 22, coinsReward: { min: 15, max: 32 }, drops: [], location: 'colinas' },
  { id: 'toupeira_gigante', name: 'Toupeira Gigante', emoji: '🐹', description: 'Uma toupeira enorme.', type: 'normal', level: 4, hp: 50, attack: 11, defense: 5, xpReward: 24, coinsReward: { min: 18, max: 35 }, drops: [{ resourceId: 'stone', chance: 30, minAmount: 2, maxAmount: 4 }], location: 'colinas' },
  { id: 'lagarto_pedras', name: 'Lagarto das Pedras', emoji: '🦎', description: 'Um lagarto camuflado.', type: 'normal', level: 5, hp: 55, attack: 13, defense: 6, xpReward: 28, coinsReward: { min: 20, max: 40 }, drops: [{ resourceId: 'stone', chance: 35, minAmount: 2, maxAmount: 5 }], location: 'colinas' },
  { id: 'urso_colinas', name: 'Urso das Colinas', emoji: '🐻', description: 'O predador alfa das colinas.', type: 'boss', level: 7, hp: 150, attack: 20, defense: 10, xpReward: 100, coinsReward: { min: 80, max: 150 }, drops: [{ resourceId: 'essence', chance: 60, minAmount: 3, maxAmount: 6 }, { resourceId: 'iron', chance: 30, minAmount: 1, maxAmount: 3 }], location: 'colinas', isBoss: true },
];
