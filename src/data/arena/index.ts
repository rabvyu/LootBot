// Sistema de Arena PvP Ranqueada

// Tipo de rank
export type ArenaRank = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master' | 'grandmaster' | 'legend';

// Interface de definição de rank
export interface ArenaRankData {
  rankId: ArenaRank;
  name: string;
  emoji: string;
  minRating: number;
  maxRating: number;
  color: number;
  seasonRewards: {
    coins: number;
    materials: Array<{ materialId: string; quantity: number }>;
    title?: string;
  };
}

// Ranks da Arena
export const ARENA_RANKS: Record<ArenaRank, ArenaRankData> = {
  bronze: {
    rankId: 'bronze',
    name: 'Bronze',
    emoji: '🥉',
    minRating: 0,
    maxRating: 999,
    color: 0xCD7F32,
    seasonRewards: {
      coins: 5000,
      materials: [{ materialId: 'arena_token', quantity: 10 }],
    },
  },
  silver: {
    rankId: 'silver',
    name: 'Prata',
    emoji: '🥈',
    minRating: 1000,
    maxRating: 1199,
    color: 0xC0C0C0,
    seasonRewards: {
      coins: 15000,
      materials: [{ materialId: 'arena_token', quantity: 25 }],
    },
  },
  gold: {
    rankId: 'gold',
    name: 'Ouro',
    emoji: '🥇',
    minRating: 1200,
    maxRating: 1399,
    color: 0xFFD700,
    seasonRewards: {
      coins: 30000,
      materials: [
        { materialId: 'arena_token', quantity: 50 },
        { materialId: 'fury_essence', quantity: 5 },
      ],
    },
  },
  platinum: {
    rankId: 'platinum',
    name: 'Platina',
    emoji: '💠',
    minRating: 1400,
    maxRating: 1599,
    color: 0xE5E4E2,
    seasonRewards: {
      coins: 50000,
      materials: [
        { materialId: 'arena_token', quantity: 100 },
        { materialId: 'dragon_scale', quantity: 5 },
      ],
      title: 'Gladiador',
    },
  },
  diamond: {
    rankId: 'diamond',
    name: 'Diamante',
    emoji: '💎',
    minRating: 1600,
    maxRating: 1799,
    color: 0xB9F2FF,
    seasonRewards: {
      coins: 100000,
      materials: [
        { materialId: 'arena_token', quantity: 200 },
        { materialId: 'phoenix_feather', quantity: 3 },
      ],
      title: 'Campeão',
    },
  },
  master: {
    rankId: 'master',
    name: 'Mestre',
    emoji: '👑',
    minRating: 1800,
    maxRating: 1999,
    color: 0x9B59B6,
    seasonRewards: {
      coins: 200000,
      materials: [
        { materialId: 'arena_token', quantity: 350 },
        { materialId: 'chaos_fragment', quantity: 5 },
      ],
      title: 'Mestre de Arena',
    },
  },
  grandmaster: {
    rankId: 'grandmaster',
    name: 'Grão-Mestre',
    emoji: '🏆',
    minRating: 2000,
    maxRating: 2199,
    color: 0xE74C3C,
    seasonRewards: {
      coins: 500000,
      materials: [
        { materialId: 'arena_token', quantity: 500 },
        { materialId: 'phoenix_feather', quantity: 10 },
        { materialId: 'chaos_fragment', quantity: 10 },
      ],
      title: 'Grão-Mestre',
    },
  },
  legend: {
    rankId: 'legend',
    name: 'Lenda',
    emoji: '⭐',
    minRating: 2200,
    maxRating: 9999,
    color: 0xF1C40F,
    seasonRewards: {
      coins: 1000000,
      materials: [
        { materialId: 'arena_token', quantity: 1000 },
        { materialId: 'phoenix_feather', quantity: 20 },
        { materialId: 'chaos_fragment', quantity: 20 },
        { materialId: 'legendary_core', quantity: 1 },
      ],
      title: 'Lenda da Arena',
    },
  },
};

// Configurações do sistema de rating (Elo-like)
export const RATING_CONFIG = {
  baseK: 32, // K-factor base para cálculo de rating
  minK: 16,  // K-factor mínimo para jogadores de alto rating
  maxK: 48,  // K-factor máximo para jogadores novos
  placementMatches: 10, // Partidas de classificação
  placementK: 64, // K-factor durante classificação
  winStreakBonus: 5, // Bônus por win streak (após 3 vitórias seguidas)
  maxWinStreakBonus: 25, // Máximo bônus de win streak
  minRating: 100, // Rating mínimo possível
  initialRating: 1000, // Rating inicial
};

// Configurações de matchmaking
export const MATCHMAKING_CONFIG = {
  maxRatingDifference: 300, // Diferença máxima de rating para match
  expandIntervalMs: 10000, // Intervalo para expandir busca (10s)
  expandAmount: 50, // Quanto expande a cada intervalo
  maxExpandedDifference: 500, // Máxima diferença após expansão
  queueTimeout: 120000, // Timeout da fila (2min)
  matchCooldown: 30000, // Cooldown entre partidas (30s)
};

// Configurações de combate
export const COMBAT_CONFIG = {
  maxRounds: 50, // Máximo de rounds por partida
  baseDamageReduction: 0.15, // Redução base de dano pela defesa
  defenseScaling: 0.003, // Escala da defesa (diminishing returns)
  critMultiplierBase: 1.5, // Multiplicador base de crítico
  evasionCap: 50, // Cap de evasão em %
  lifestealCap: 30, // Cap de lifesteal em %
};

// ==================== FUNÇÕES AUXILIARES ====================

// Obter rank pelo rating
export const getRankByRating = (rating: number): ArenaRankData => {
  for (const rank of Object.values(ARENA_RANKS).reverse()) {
    if (rating >= rank.minRating) {
      return rank;
    }
  }
  return ARENA_RANKS.bronze;
};

// Obter próximo rank
export const getNextRank = (currentRank: ArenaRank): ArenaRankData | null => {
  const ranks = Object.values(ARENA_RANKS);
  const currentIndex = ranks.findIndex(r => r.rankId === currentRank);

  if (currentIndex < ranks.length - 1) {
    return ranks[currentIndex + 1];
  }
  return null;
};

// Calcular K-factor baseado no rating e partidas jogadas
export const calculateKFactor = (rating: number, matchesPlayed: number): number => {
  // Durante placement
  if (matchesPlayed < RATING_CONFIG.placementMatches) {
    return RATING_CONFIG.placementK;
  }

  // Ajustar K baseado no rating
  if (rating >= 2000) {
    return RATING_CONFIG.minK;
  } else if (rating >= 1600) {
    return RATING_CONFIG.baseK - 8;
  } else if (rating >= 1200) {
    return RATING_CONFIG.baseK;
  } else {
    return RATING_CONFIG.maxK;
  }
};

// Calcular mudança de rating (sistema Elo)
export const calculateRatingChange = (
  winnerRating: number,
  loserRating: number,
  winnerK: number,
  winnerStreak: number = 0
): { winnerGain: number; loserLoss: number } => {
  // Probabilidade esperada de vitória
  const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  const expectedLoser = 1 - expectedWinner;

  // Mudança base
  let winnerGain = Math.round(winnerK * (1 - expectedWinner));
  let loserLoss = Math.round(winnerK * expectedLoser);

  // Bônus de win streak
  if (winnerStreak >= 3) {
    const streakBonus = Math.min(
      RATING_CONFIG.winStreakBonus * (winnerStreak - 2),
      RATING_CONFIG.maxWinStreakBonus
    );
    winnerGain += streakBonus;
  }

  // Garantir ganho/perda mínima
  winnerGain = Math.max(winnerGain, 5);
  loserLoss = Math.max(loserLoss, 5);

  return { winnerGain, loserLoss };
};

// Simular combate PvP
export interface CombatantStats {
  discordId: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  critChance: number;
  critDamage: number;
  evasion: number;
  lifesteal: number;
}

export interface CombatRound {
  roundNumber: number;
  attacker: string;
  defender: string;
  damage: number;
  isCrit: boolean;
  wasEvaded: boolean;
  lifestealHealed: number;
  attackerHpAfter: number;
  defenderHpAfter: number;
}

export interface CombatResult {
  winnerId: string;
  loserId: string;
  rounds: CombatRound[];
  totalRounds: number;
}

export const simulateCombat = (
  player1: CombatantStats,
  player2: CombatantStats
): CombatResult => {
  const rounds: CombatRound[] = [];
  let currentAttacker = player1;
  let currentDefender = player2;
  let roundNumber = 0;

  // Clonar HP para não modificar original
  const combatants = {
    [player1.discordId]: { ...player1 },
    [player2.discordId]: { ...player2 },
  };

  // Loop de combate
  while (roundNumber < COMBAT_CONFIG.maxRounds) {
    roundNumber++;

    const attacker = combatants[currentAttacker.discordId];
    const defender = combatants[currentDefender.discordId];

    // Verificar evasão
    const evasionRoll = Math.random() * 100;
    const wasEvaded = evasionRoll < Math.min(defender.evasion, COMBAT_CONFIG.evasionCap);

    let damage = 0;
    let isCrit = false;
    let lifestealHealed = 0;

    if (!wasEvaded) {
      // Calcular dano base
      const rawDamage = attacker.attack;

      // Aplicar defesa (diminishing returns)
      const defenseReduction = COMBAT_CONFIG.baseDamageReduction +
        (defender.defense * COMBAT_CONFIG.defenseScaling) /
        (1 + defender.defense * COMBAT_CONFIG.defenseScaling * 0.01);

      damage = Math.floor(rawDamage * (1 - Math.min(defenseReduction, 0.75)));

      // Verificar crítico
      const critRoll = Math.random() * 100;
      isCrit = critRoll < attacker.critChance;

      if (isCrit) {
        const critMultiplier = COMBAT_CONFIG.critMultiplierBase + (attacker.critDamage / 100);
        damage = Math.floor(damage * critMultiplier);
      }

      // Garantir dano mínimo
      damage = Math.max(damage, 1);

      // Aplicar dano
      defender.hp -= damage;

      // Lifesteal
      if (attacker.lifesteal > 0) {
        const lifestealPercent = Math.min(attacker.lifesteal, COMBAT_CONFIG.lifestealCap);
        lifestealHealed = Math.floor(damage * (lifestealPercent / 100));
        attacker.hp = Math.min(attacker.hp + lifestealHealed, attacker.maxHp);
      }
    }

    // Registrar round
    rounds.push({
      roundNumber,
      attacker: attacker.discordId,
      defender: defender.discordId,
      damage,
      isCrit,
      wasEvaded,
      lifestealHealed,
      attackerHpAfter: attacker.hp,
      defenderHpAfter: defender.hp,
    });

    // Verificar fim de combate
    if (defender.hp <= 0) {
      return {
        winnerId: attacker.discordId,
        loserId: defender.discordId,
        rounds,
        totalRounds: roundNumber,
      };
    }

    // Trocar atacante/defensor
    const temp = currentAttacker;
    currentAttacker = currentDefender;
    currentDefender = temp;
  }

  // Se chegou ao limite de rounds, vencedor é quem tem mais HP percentual
  const p1HpPercent = combatants[player1.discordId].hp / player1.maxHp;
  const p2HpPercent = combatants[player2.discordId].hp / player2.maxHp;

  return {
    winnerId: p1HpPercent >= p2HpPercent ? player1.discordId : player2.discordId,
    loserId: p1HpPercent >= p2HpPercent ? player2.discordId : player1.discordId,
    rounds,
    totalRounds: roundNumber,
  };
};

// Formatar tempo de espera
export const formatQueueTime = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

// Obter todos os ranks
export const getAllRanks = (): ArenaRankData[] => {
  return Object.values(ARENA_RANKS);
};

export default ARENA_RANKS;
