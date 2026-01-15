import { EquipmentData, SET_BONUSES } from './items';
import { EquipmentSlot, EquipmentRarity } from '../database/models/Equipment';

const SLOTS: EquipmentSlot[] = ['weapon', 'armor', 'helmet', 'boots', 'gloves', 'ring', 'amulet'];
const RARITIES: EquipmentRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

const RARITY_MULT: Record<EquipmentRarity, number> = {
  common: 1.0, uncommon: 1.2, rare: 1.5, epic: 1.8, legendary: 2.2,
};

const RARITY_DROP: Record<EquipmentRarity, number> = {
  common: 50, uncommon: 30, rare: 13, epic: 5, legendary: 2,
};

const SLOT_EMOJIS: Record<EquipmentSlot, string> = {
  weapon: '⚔️', armor: '🛡️', helmet: '⛑️', boots: '👢', gloves: '🧤', ring: '💍', amulet: '📿',
};

// Base names per tier and slot
const TIER_NAMES: Record<number, Record<EquipmentSlot, string[]>> = {
  1: {
    weapon: ['Adaga de Madeira', 'Espada Quebrada', 'Cajado Velho', 'Arco Torto', 'Foice Enferrujada'],
    armor: ['Tunica de Pano', 'Couro Rasgado', 'Veste de Aprendiz', 'Armadura Remendada'],
    helmet: ['Capuz de Pano', 'Elmo de Lata', 'Bandana Velha', 'Bone Puido'],
    boots: ['Sandalia Gasta', 'Botas de Couro', 'Sapatos Rasgados', 'Chinelos'],
    gloves: ['Luvas de Pano', 'Manoplas de Couro', 'Faixas de Mao', 'Mitenes Velhos'],
    ring: ['Anel de Osso', 'Anel Simples', 'Argola de Ferro', 'Aro de Madeira'],
    amulet: ['Colar de Dente', 'Pingente Rachado', 'Amuleto de Pedra', 'Talismo Velho'],
  },
  2: {
    weapon: ['Espada de Bronze', 'Machado de Lenhador', 'Cajado de Carvalho', 'Arco de Cacador', 'Lanca Curta'],
    armor: ['Peitoral de Couro', 'Cota de Malha Leve', 'Manto de Viajante', 'Armadura de Bronze'],
    helmet: ['Elmo de Bronze', 'Capuz de Couro', 'Capacete de Guarda', 'Coifa de Malha'],
    boots: ['Botas de Viajante', 'Grevas de Bronze', 'Sapatos de Cacador', 'Botas Refortadas'],
    gloves: ['Manoplas de Bronze', 'Luvas de Arqueiro', 'Bracers de Couro', 'Punhos de Guarda'],
    ring: ['Anel de Bronze', 'Sinete de Aprendiz', 'Aro de Cobre', 'Anel do Viajante'],
    amulet: ['Amuleto de Cacador', 'Talizma de Forca', 'Colar de Bronze', 'Pingente de Lobo'],
  },
  3: {
    weapon: ['Espada de Ferro', 'Martelo de Guerra', 'Cajado Arcano', 'Arco Longo', 'Alabarda'],
    armor: ['Armadura de Ferro', 'Cota de Malha', 'Manto Encantado', 'Coraceira de Placas'],
    helmet: ['Elmo de Ferro', 'Capuz Encantado', 'Grande Elmo', 'Tiara Magica'],
    boots: ['Grevas de Ferro', 'Botas Magicas', 'Botas de Cavaleiro', 'Sapatilhas Ageis'],
    gloves: ['Manoplas de Ferro', 'Luvas Arcanas', 'Bracers de Batalha', 'Punhos de Ferro'],
    ring: ['Anel de Prata', 'Sinete de Mago', 'Anel de Ferro', 'Aro Encantado'],
    amulet: ['Amuleto Arcano', 'Talizma de Protecao', 'Colar de Prata', 'Pingente Magico'],
  },
  4: {
    weapon: ['Espada de Aco', 'Machado Duplo', 'Cajado de Cristal', 'Arco Composto', 'Lanca Real'],
    armor: ['Armadura de Aco', 'Cota Dragonica', 'Manto de Batalha', 'Armadura de Elite'],
    helmet: ['Elmo de Aco', 'Coroa de Guerreiro', 'Grande Elmo Real', 'Capuz de Sombras'],
    boots: ['Grevas de Aco', 'Botas de Velocidade', 'Botas de Elite', 'Sapatilhas de Sombra'],
    gloves: ['Manoplas de Aco', 'Luvas de Assassino', 'Bracers de Elite', 'Punhos de Aco'],
    ring: ['Anel de Ouro', 'Sinete Real', 'Anel de Aco', 'Aro de Poder'],
    amulet: ['Amuleto de Elite', 'Talizma de Poder', 'Colar de Ouro', 'Pingente de Forca'],
  },
  5: {
    weapon: ['Espada Mistica', 'Machado Infernal', 'Cajado Celestial', 'Arco Elemental', 'Lanca Sagrada'],
    armor: ['Armadura Mistica', 'Cota Celestial', 'Manto das Sombras', 'Armadura Sagrada'],
    helmet: ['Elmo Mistico', 'Coroa Celestial', 'Capacete Infernal', 'Capuz das Trevas'],
    boots: ['Grevas Misticas', 'Botas Celestiais', 'Botas Infernais', 'Sapatilhas Astrais'],
    gloves: ['Manoplas Misticas', 'Luvas Celestiais', 'Bracers Infernais', 'Punhos Astrais'],
    ring: ['Anel Mistico', 'Sinete Celestial', 'Anel Infernal', 'Aro das Trevas'],
    amulet: ['Amuleto Mistico', 'Talizma Celestial', 'Colar Infernal', 'Pingente Astral'],
  },
  6: {
    weapon: ['Espada Divina', 'Machado do Caos', 'Cajado do Vazio', 'Arco Draconico', 'Lanca do Destino'],
    armor: ['Armadura Divina', 'Cota do Caos', 'Manto do Vazio', 'Armadura Dragonica'],
    helmet: ['Elmo Divino', 'Coroa do Caos', 'Capacete do Vazio', 'Capuz Draconico'],
    boots: ['Grevas Divinas', 'Botas do Caos', 'Botas do Vazio', 'Sapatilhas Draconicas'],
    gloves: ['Manoplas Divinas', 'Luvas do Caos', 'Bracers do Vazio', 'Punhos Draconicos'],
    ring: ['Anel Divino', 'Sinete do Caos', 'Anel do Vazio', 'Aro Draconico'],
    amulet: ['Amuleto Divino', 'Talizma do Caos', 'Colar do Vazio', 'Pingente Draconico'],
  },
};

// Sets per tier
const TIER_SETS: Record<number, string[]> = {
  1: ['Iniciante', 'Ferrugem'],
  2: ['Cacador', 'Floresta'],
  3: ['Lobisomem', 'Mineiro', 'Guardiao'],
  4: ['Assassino', 'Elemental', 'Vampiro'],
  5: ['Infernal', 'Abissal', 'Celestial'],
  6: ['Draconico', 'Divino', 'Caos'],
};

// Base stats per tier
const BASE_STATS: Record<number, { atk: number; def: number; hp: number }> = {
  1: { atk: 5, def: 3, hp: 15 },
  2: { atk: 10, def: 6, hp: 30 },
  3: { atk: 18, def: 12, hp: 60 },
  4: { atk: 30, def: 20, hp: 100 },
  5: { atk: 50, def: 35, hp: 180 },
  6: { atk: 80, def: 55, hp: 300 },
};

function generateEquipment(): EquipmentData[] {
  const equipment: EquipmentData[] = [];
  let idCounter = 0;

  for (let tier = 1; tier <= 6; tier++) {
    const sets = TIER_SETS[tier];
    const baseStats = BASE_STATS[tier];

    for (const slot of SLOTS) {
      const names = TIER_NAMES[tier][slot];

      for (const rarity of RARITIES) {
        const mult = RARITY_MULT[rarity];
        const dropChance = RARITY_DROP[rarity];

        // Non-set equipment
        for (let i = 0; i < 2; i++) {
          const baseName = names[i % names.length];
          const name = rarity === 'legendary' ? `${baseName} Lendario` :
                       rarity === 'epic' ? `${baseName} Epico` :
                       rarity === 'rare' ? `${baseName} Raro` :
                       rarity === 'uncommon' ? `${baseName} Aprimorado` : baseName;

          const stats = getStatsForSlot(slot, baseStats, mult);

          equipment.push({
            id: `eq_${tier}_${slot}_${rarity}_${idCounter++}`,
            name,
            emoji: SLOT_EMOJIS[slot],
            slot,
            rarity,
            tier,
            stats,
            dropChance: dropChance / 2,
          });
        }

        // Set equipment
        for (const setName of sets) {
          const name = `${names[0]} ${setName}`;
          const stats = getStatsForSlot(slot, baseStats, mult * 0.9);

          equipment.push({
            id: `eq_${tier}_${slot}_${rarity}_set_${setName.toLowerCase()}_${idCounter++}`,
            name: rarity === 'legendary' ? `${name} Lendario` :
                  rarity === 'epic' ? `${name} Epico` :
                  rarity === 'rare' ? `${name} Raro` :
                  rarity === 'uncommon' ? `${name} Aprimorado` : name,
            emoji: SLOT_EMOJIS[slot],
            slot,
            rarity,
            tier,
            setName,
            stats,
            dropChance: dropChance / 3,
          });
        }
      }
    }
  }

  return equipment;
}

function getStatsForSlot(slot: EquipmentSlot, base: { atk: number; def: number; hp: number }, mult: number) {
  const stats: Record<string, number> = {};

  switch (slot) {
    case 'weapon':
      stats.attack = Math.floor(base.atk * mult * 1.5);
      if (Math.random() > 0.5) stats.critChance = Math.floor(3 * mult);
      break;
    case 'armor':
      stats.defense = Math.floor(base.def * mult * 1.5);
      stats.hp = Math.floor(base.hp * mult);
      break;
    case 'helmet':
      stats.defense = Math.floor(base.def * mult * 0.7);
      stats.hp = Math.floor(base.hp * mult * 0.5);
      break;
    case 'boots':
      stats.defense = Math.floor(base.def * mult * 0.5);
      if (Math.random() > 0.5) stats.critChance = Math.floor(2 * mult);
      break;
    case 'gloves':
      stats.attack = Math.floor(base.atk * mult * 0.5);
      stats.defense = Math.floor(base.def * mult * 0.3);
      break;
    case 'ring':
      stats.attack = Math.floor(base.atk * mult * 0.3);
      if (Math.random() > 0.5) stats.critDamage = Math.floor(5 * mult);
      break;
    case 'amulet':
      stats.hp = Math.floor(base.hp * mult * 0.8);
      if (Math.random() > 0.5) stats.critDamage = Math.floor(3 * mult);
      break;
  }

  return stats;
}

export const ALL_EQUIPMENT: EquipmentData[] = generateEquipment();

export function getEquipmentById(id: string): EquipmentData | undefined {
  return ALL_EQUIPMENT.find(e => e.id === id);
}

export function getEquipmentByTier(tier: number): EquipmentData[] {
  return ALL_EQUIPMENT.filter(e => e.tier === tier);
}

export function getEquipmentBySlot(slot: EquipmentSlot): EquipmentData[] {
  return ALL_EQUIPMENT.filter(e => e.slot === slot);
}

export function getEquipmentByRarity(rarity: EquipmentRarity): EquipmentData[] {
  return ALL_EQUIPMENT.filter(e => e.rarity === rarity);
}

export function getEquipmentBySet(setName: string): EquipmentData[] {
  return ALL_EQUIPMENT.filter(e => e.setName === setName);
}

export function getRandomEquipmentDrop(tier: number): EquipmentData | null {
  const tierEquipment = ALL_EQUIPMENT.filter(e => e.tier === tier);
  if (tierEquipment.length === 0) return null;

  const totalChance = tierEquipment.reduce((sum, e) => sum + e.dropChance, 0);
  let roll = Math.random() * totalChance;

  for (const eq of tierEquipment) {
    roll -= eq.dropChance;
    if (roll <= 0) return eq;
  }

  return tierEquipment[0];
}

export const EQUIPMENT_STATS = {
  total: ALL_EQUIPMENT.length,
  byTier: {
    tier1: ALL_EQUIPMENT.filter(e => e.tier === 1).length,
    tier2: ALL_EQUIPMENT.filter(e => e.tier === 2).length,
    tier3: ALL_EQUIPMENT.filter(e => e.tier === 3).length,
    tier4: ALL_EQUIPMENT.filter(e => e.tier === 4).length,
    tier5: ALL_EQUIPMENT.filter(e => e.tier === 5).length,
    tier6: ALL_EQUIPMENT.filter(e => e.tier === 6).length,
  },
  byRarity: {
    common: ALL_EQUIPMENT.filter(e => e.rarity === 'common').length,
    uncommon: ALL_EQUIPMENT.filter(e => e.rarity === 'uncommon').length,
    rare: ALL_EQUIPMENT.filter(e => e.rarity === 'rare').length,
    epic: ALL_EQUIPMENT.filter(e => e.rarity === 'epic').length,
    legendary: ALL_EQUIPMENT.filter(e => e.rarity === 'legendary').length,
  },
  sets: Object.keys(SET_BONUSES).length,
};
