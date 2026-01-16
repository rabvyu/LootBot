// Sistema de Bônus de Pets e Monstros Domados

export type PetRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface PetBonus {
  type: 'attack' | 'defense' | 'hp' | 'crit_chance' | 'crit_damage' | 'evasion'
    | 'speed' | 'lifesteal' | 'poison' | 'fire' | 'ice' | 'all_stats'
    | 'drop_rate' | 'xp_bonus' | 'special';
  value: number;
  description: string;
}

export interface PetTemplate {
  id: string;
  name: string;
  emoji: string;
  rarity: PetRarity;
  description: string;
  bonuses: PetBonus[];
  specialAbility?: string;
  synergyClasses?: string[]; // Classes que ganham bônus extra
  synergyBonus?: number; // Porcentagem de bônus extra
}

// Pets Comuns
export const commonPets: PetTemplate[] = [
  {
    id: 'wolf',
    name: 'Lobo',
    emoji: '🐺',
    rarity: 'common',
    description: 'Um lobo leal que aumenta seu poder de ataque.',
    bonuses: [
      { type: 'attack', value: 5, description: '+5% ATK' },
      { type: 'speed', value: 3, description: '+3% Velocidade' },
    ],
    synergyClasses: ['warrior', 'archer'],
    synergyBonus: 10,
  },
  {
    id: 'bear',
    name: 'Urso',
    emoji: '🐻',
    rarity: 'common',
    description: 'Um urso resistente que aumenta sua defesa.',
    bonuses: [
      { type: 'hp', value: 50, description: '+50 HP' },
      { type: 'defense', value: 3, description: '+3% DEF' },
    ],
    synergyClasses: ['warrior', 'paladin'],
    synergyBonus: 10,
  },
  {
    id: 'eagle',
    name: 'Águia',
    emoji: '🦅',
    rarity: 'common',
    description: 'Uma águia veloz que melhora seus críticos.',
    bonuses: [
      { type: 'crit_chance', value: 5, description: '+5% Crítico' },
      { type: 'crit_damage', value: 3, description: '+3% Dano Crítico' },
    ],
    synergyClasses: ['archer'],
    synergyBonus: 10,
  },
  {
    id: 'snake',
    name: 'Cobra',
    emoji: '🐍',
    rarity: 'common',
    description: 'Uma cobra venenosa que aplica toxinas.',
    bonuses: [
      { type: 'poison', value: 5, description: '+5% dano de veneno' },
      { type: 'evasion', value: 3, description: '+3% Evasão' },
    ],
    synergyClasses: ['archer', 'mage'],
    synergyBonus: 10,
  },
];

// Pets Incomuns
export const uncommonPets: PetTemplate[] = [
  {
    id: 'alpha_wolf',
    name: 'Lobo Alfa',
    emoji: '🐺',
    rarity: 'uncommon',
    description: 'O líder da alcateia com poder superior.',
    bonuses: [
      { type: 'attack', value: 10, description: '+10% ATK' },
      { type: 'speed', value: 5, description: '+5% Velocidade' },
    ],
    synergyClasses: ['warrior', 'archer'],
    synergyBonus: 15,
  },
  {
    id: 'cave_bear',
    name: 'Urso das Cavernas',
    emoji: '🐻',
    rarity: 'uncommon',
    description: 'Urso ancestral com resistência lendária.',
    bonuses: [
      { type: 'hp', value: 100, description: '+100 HP' },
      { type: 'defense', value: 7, description: '+7% DEF' },
    ],
    synergyClasses: ['warrior', 'paladin'],
    synergyBonus: 15,
  },
  {
    id: 'royal_falcon',
    name: 'Falcão Real',
    emoji: '🦅',
    rarity: 'uncommon',
    description: 'Falcão treinado para caça precisa.',
    bonuses: [
      { type: 'crit_chance', value: 10, description: '+10% Crítico' },
      { type: 'crit_damage', value: 5, description: '+5% Dano Crítico' },
    ],
    synergyClasses: ['archer'],
    synergyBonus: 15,
  },
  {
    id: 'deadly_viper',
    name: 'Víbora Mortal',
    emoji: '🐍',
    rarity: 'uncommon',
    description: 'Serpente com veneno letal.',
    bonuses: [
      { type: 'poison', value: 10, description: '+10% dano de veneno' },
      { type: 'evasion', value: 5, description: '+5% Evasão' },
    ],
    synergyClasses: ['archer', 'mage'],
    synergyBonus: 15,
  },
];

// Pets Raros
export const rarePets: PetTemplate[] = [
  {
    id: 'spectral_wolf',
    name: 'Lobo Espectral',
    emoji: '👻',
    rarity: 'rare',
    description: 'Espírito de lobo que drena energia vital.',
    bonuses: [
      { type: 'attack', value: 15, description: '+15% ATK' },
      { type: 'lifesteal', value: 8, description: '+8% Lifesteal' },
    ],
    specialAbility: 'Uivo Espectral: 10% chance de assustar inimigo (perde turno)',
    synergyClasses: ['warrior', 'mage'],
    synergyBonus: 20,
  },
  {
    id: 'stone_golem',
    name: 'Golem de Pedra',
    emoji: '🗿',
    rarity: 'rare',
    description: 'Construto mágico indestrutível.',
    bonuses: [
      { type: 'hp', value: 200, description: '+200 HP' },
      { type: 'defense', value: 15, description: '+15% DEF' },
    ],
    specialAbility: 'Armadura de Pedra: Absorve primeiro ataque de cada batalha',
    synergyClasses: ['paladin', 'warrior'],
    synergyBonus: 20,
  },
  {
    id: 'griffin',
    name: 'Grifo',
    emoji: '🦅',
    rarity: 'rare',
    description: 'Criatura majestosa com golpes devastadores.',
    bonuses: [
      { type: 'crit_chance', value: 15, description: '+15% Crítico' },
      { type: 'crit_damage', value: 10, description: '+10% Dano Crítico' },
    ],
    specialAbility: 'Mergulho Mortal: Críticos causam +50% dano',
    synergyClasses: ['archer', 'warrior'],
    synergyBonus: 20,
  },
  {
    id: 'lesser_hydra',
    name: 'Hidra Menor',
    emoji: '🐉',
    rarity: 'rare',
    description: 'Hidra jovem com múltiplas cabeças.',
    bonuses: [
      { type: 'attack', value: 10, description: '+10% ATK' },
      { type: 'special', value: 2, description: 'Ataca 2x por turno (50% dano cada)' },
    ],
    specialAbility: 'Regeneração: Recupera 5% HP por turno',
    synergyClasses: ['mage', 'archer'],
    synergyBonus: 20,
  },
];

// Pets Épicos
export const epicPets: PetTemplate[] = [
  {
    id: 'young_dragon',
    name: 'Dragão Menor',
    emoji: '🐲',
    rarity: 'epic',
    description: 'Filhote de dragão com poder elemental.',
    bonuses: [
      { type: 'attack', value: 20, description: '+20% ATK' },
      { type: 'fire', value: 10, description: '+10% dano de todos elementos' },
    ],
    specialAbility: 'Sopro de Fogo: 20% chance de causar queimadura',
    synergyClasses: ['mage'],
    synergyBonus: 25,
  },
  {
    id: 'fire_elemental',
    name: 'Elemental de Fogo',
    emoji: '🔥',
    rarity: 'epic',
    description: 'Espírito de fogo puro.',
    bonuses: [
      { type: 'fire', value: 25, description: '+25% Dano de Fogo' },
      { type: 'special', value: 1, description: 'Imune a fogo' },
    ],
    specialAbility: 'Explosão de Chamas: AoE de fogo ao morrer',
    synergyClasses: ['mage'],
    synergyBonus: 25,
  },
  {
    id: 'ice_elemental',
    name: 'Elemental de Gelo',
    emoji: '❄️',
    rarity: 'epic',
    description: 'Espírito de gelo eterno.',
    bonuses: [
      { type: 'ice', value: 25, description: '+25% Dano de Gelo' },
      { type: 'special', value: 1, description: 'Imune a gelo' },
    ],
    specialAbility: 'Nevasca: 15% chance de congelar inimigo',
    synergyClasses: ['mage'],
    synergyBonus: 25,
  },
  {
    id: 'baby_phoenix',
    name: 'Fênix Bebê',
    emoji: '🐦',
    rarity: 'epic',
    description: 'Filhote de fênix com poder de renascimento.',
    bonuses: [
      { type: 'fire', value: 15, description: '+15% Dano de Fogo' },
      { type: 'special', value: 30, description: 'Revive com 30% HP 1x por dia' },
    ],
    specialAbility: 'Renascimento: Revive automaticamente uma vez',
    synergyClasses: ['paladin', 'mage'],
    synergyBonus: 25,
  },
];

// Pets Lendários
export const legendaryPets: PetTemplate[] = [
  {
    id: 'ancient_dragon',
    name: 'Dragão Ancião',
    emoji: '🐉',
    rarity: 'legendary',
    description: 'Dragão milenar com poder imensurável.',
    bonuses: [
      { type: 'all_stats', value: 30, description: '+30% todos stats' },
      { type: 'fire', value: 20, description: '+20% dano de fogo' },
    ],
    specialAbility: 'Fúria Dracônica: Ataque devastador de fogo a cada 5 turnos',
    synergyClasses: ['warrior', 'mage'],
    synergyBonus: 35,
  },
  {
    id: 'phoenix',
    name: 'Fênix',
    emoji: '🔥',
    rarity: 'legendary',
    description: 'Ave imortal que renasce das cinzas.',
    bonuses: [
      { type: 'all_stats', value: 25, description: '+25% todos stats' },
      { type: 'special', value: 1, description: 'Revive infinito (CD: 1 dia)' },
    ],
    specialAbility: 'Imortalidade: Não pode morrer permanentemente',
    synergyClasses: ['paladin'],
    synergyBonus: 35,
  },
  {
    id: 'unicorn',
    name: 'Unicórnio',
    emoji: '🦄',
    rarity: 'legendary',
    description: 'Criatura mágica de cura suprema.',
    bonuses: [
      { type: 'hp', value: 300, description: '+300 HP' },
      { type: 'special', value: 50, description: '+50% efetividade de cura' },
    ],
    specialAbility: 'Pureza: Imune a todos debuffs',
    synergyClasses: ['paladin'],
    synergyBonus: 35,
  },
  {
    id: 'behemoth',
    name: 'Behemoth',
    emoji: '🦣',
    rarity: 'legendary',
    description: 'Besta colossal de poder devastador.',
    bonuses: [
      { type: 'hp', value: 500, description: '+500 HP' },
      { type: 'defense', value: 20, description: '+20% DEF' },
      { type: 'attack', value: 15, description: '+15% ATK' },
    ],
    specialAbility: 'Pisada Titânica: AoE que atordoa todos inimigos',
    synergyClasses: ['warrior'],
    synergyBonus: 35,
  },
];

// Todos os pets
export const allPets: PetTemplate[] = [
  ...commonPets,
  ...uncommonPets,
  ...rarePets,
  ...epicPets,
  ...legendaryPets,
];

// Funções auxiliares
export const getPetById = (id: string): PetTemplate | undefined => {
  return allPets.find(pet => pet.id === id);
};

export const getPetsByRarity = (rarity: PetRarity): PetTemplate[] => {
  return allPets.filter(pet => pet.rarity === rarity);
};

// Calcular bônus total de um pet para uma classe
export const calculatePetBonuses = (
  pet: PetTemplate,
  characterClass: string,
  hunterBonus: number = 0 // Bônus da classe Caçador
): PetBonus[] => {
  let multiplier = 1;

  // Verificar sinergia
  if (pet.synergyClasses?.includes(characterClass)) {
    multiplier += (pet.synergyBonus || 0) / 100;
  }

  // Aplicar bônus de caçador
  if (hunterBonus > 0) {
    multiplier += hunterBonus / 100;
  }

  return pet.bonuses.map(bonus => ({
    ...bonus,
    value: Math.floor(bonus.value * multiplier),
    description: `${bonus.description} (${Math.floor(multiplier * 100 - 100)}% bônus)`,
  }));
};

// Contagem de pets
export const PET_COUNTS = {
  common: commonPets.length,
  uncommon: uncommonPets.length,
  rare: rarePets.length,
  epic: epicPets.length,
  legendary: legendaryPets.length,
  get total() {
    return this.common + this.uncommon + this.rare + this.epic + this.legendary;
  },
};
