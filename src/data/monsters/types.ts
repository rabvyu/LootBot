import { MonsterType } from '../../database/models/Monster';

export interface MonsterData {
  id: string;
  name: string;
  emoji: string;
  description: string;
  type: MonsterType;
  level: number;
  hp: number;
  attack: number;
  defense: number;
  xpReward: number;
  coinsReward: { min: number; max: number };
  drops: { resourceId: string; chance: number; minAmount: number; maxAmount: number }[];
  location: string;
  isBoss?: boolean;
}

export interface LocationData {
  id: string;
  name: string;
  emoji: string;
  description: string;
  tier: number;
  minLevel: number;
  maxLevel: number;
}

// Location definitions
export const LOCATIONS: LocationData[] = [
  // Tier 1 - Iniciante (1-5)
  { id: 'floresta_verde', name: 'Floresta Verde', emoji: '🌲', description: 'Uma floresta pacífica com criaturas fracas.', tier: 1, minLevel: 1, maxLevel: 5 },
  { id: 'planicie', name: 'Planície Pacífica', emoji: '🌾', description: 'Campos abertos com animais selvagens.', tier: 1, minLevel: 1, maxLevel: 5 },
  { id: 'fazenda', name: 'Fazenda Abandonada', emoji: '🏚️', description: 'Uma fazenda tomada por criaturas estranhas.', tier: 1, minLevel: 2, maxLevel: 6 },
  { id: 'rio', name: 'Rio Tranquilo', emoji: '🏞️', description: 'Um rio com criaturas aquáticas.', tier: 1, minLevel: 2, maxLevel: 6 },
  { id: 'colinas', name: 'Colinas Verdejantes', emoji: '⛰️', description: 'Colinas com predadores naturais.', tier: 1, minLevel: 3, maxLevel: 7 },

  // Tier 2 - Novato (5-10)
  { id: 'floresta_sombria', name: 'Floresta Sombria', emoji: '🌑', description: 'Uma floresta escura e perigosa.', tier: 2, minLevel: 5, maxLevel: 10 },
  { id: 'caverna_morcegos', name: 'Caverna dos Morcegos', emoji: '🦇', description: 'Cavernas infestadas de morcegos.', tier: 2, minLevel: 5, maxLevel: 10 },
  { id: 'ruinas_antigas', name: 'Ruínas Antigas', emoji: '🏛️', description: 'Ruínas habitadas por mortos-vivos.', tier: 2, minLevel: 6, maxLevel: 11 },
  { id: 'pantano', name: 'Pântano Nebuloso', emoji: '🐊', description: 'Um pântano cheio de criaturas vis.', tier: 2, minLevel: 6, maxLevel: 11 },
  { id: 'cemiterio', name: 'Cemitério Velho', emoji: '🪦', description: 'Um cemitério assombrado.', tier: 2, minLevel: 7, maxLevel: 12 },

  // Tier 3 - Intermediário (10-20)
  { id: 'mina_ferro', name: 'Mina de Ferro', emoji: '⛏️', description: 'Minas abandonadas com golems.', tier: 3, minLevel: 10, maxLevel: 15 },
  { id: 'mina_ouro', name: 'Mina de Ouro', emoji: '🥇', description: 'Minas ricas guardadas por criaturas.', tier: 3, minLevel: 12, maxLevel: 17 },
  { id: 'floresta_maldita', name: 'Floresta Amaldiçoada', emoji: '🌲', description: 'Floresta corrompida por magia negra.', tier: 3, minLevel: 14, maxLevel: 19 },
  { id: 'torre', name: 'Torre Abandonada', emoji: '🗼', description: 'Torre de um mago corrompido.', tier: 3, minLevel: 15, maxLevel: 20 },
  { id: 'catacumbas', name: 'Catacumbas', emoji: '💀', description: 'Catacumbas cheias de mortos-vivos.', tier: 3, minLevel: 16, maxLevel: 22 },

  // Tier 4 - Avançado (20-35)
  { id: 'vulcao', name: 'Vulcão Ativo', emoji: '🌋', description: 'Um vulcão com elementais de fogo.', tier: 4, minLevel: 20, maxLevel: 28 },
  { id: 'geleira', name: 'Geleira Eterna', emoji: '🏔️', description: 'Terras congeladas com criaturas de gelo.', tier: 4, minLevel: 22, maxLevel: 30 },
  { id: 'deserto', name: 'Deserto Escaldante', emoji: '🏜️', description: 'Deserto com criaturas mortais.', tier: 4, minLevel: 24, maxLevel: 32 },
  { id: 'castelo', name: 'Castelo em Ruínas', emoji: '🏰', description: 'Castelo tomado por trevas.', tier: 4, minLevel: 26, maxLevel: 34 },
  { id: 'esgoto', name: 'Esgoto da Cidade', emoji: '🚰', description: 'Esgotos com aberrações.', tier: 4, minLevel: 28, maxLevel: 35 },

  // Tier 5 - Expert (35-50)
  { id: 'abismo', name: 'Abismo Profundo', emoji: '🕳️', description: 'As profundezas do mundo.', tier: 5, minLevel: 35, maxLevel: 42 },
  { id: 'templo', name: 'Templo Corrompido', emoji: '⛩️', description: 'Templo profanado por cultistas.', tier: 5, minLevel: 38, maxLevel: 45 },
  { id: 'laboratorio', name: 'Laboratório Sombrio', emoji: '🧪', description: 'Laboratório de experimentos.', tier: 5, minLevel: 40, maxLevel: 47 },
  { id: 'fortaleza', name: 'Fortaleza Negra', emoji: '🏯', description: 'Fortaleza de um lorde das trevas.', tier: 5, minLevel: 42, maxLevel: 50 },
  { id: 'prisao', name: 'Prisão dos Condenados', emoji: '⛓️', description: 'Prisão de almas torturadas.', tier: 5, minLevel: 45, maxLevel: 52 },

  // Tier 6 - Mestre (50-75)
  { id: 'reino_mortos', name: 'Reino dos Mortos', emoji: '☠️', description: 'O próprio reino da morte.', tier: 6, minLevel: 50, maxLevel: 60 },
  { id: 'dimensao_sombria', name: 'Dimensão Sombria', emoji: '🌀', description: 'Uma dimensão de pesadelos.', tier: 6, minLevel: 55, maxLevel: 65 },
  { id: 'santuario', name: 'Santuário Profano', emoji: '🔮', description: 'Santuário de rituais sombrios.', tier: 6, minLevel: 60, maxLevel: 70 },
  { id: 'covil_dragao', name: 'Covil do Dragão', emoji: '🐉', description: 'Lar dos dragões ancestrais.', tier: 6, minLevel: 65, maxLevel: 75 },
  { id: 'trono_caos', name: 'Trono do Caos', emoji: '👑', description: 'O centro do caos absoluto.', tier: 6, minLevel: 70, maxLevel: 80 },

  // Dungeons Especiais (75-100)
  { id: 'dungeon_apocalipse', name: 'Dungeon do Apocalipse', emoji: '💀', description: 'A dungeon final.', tier: 7, minLevel: 75, maxLevel: 90 },
  { id: 'cidadela', name: 'Cidadela Celestial Corrompida', emoji: '🏛️', description: 'Onde anjos caíram.', tier: 7, minLevel: 85, maxLevel: 100 },
];
