// Serviço de Casino
import { CasinoProfile, ICasinoProfile, CasinoGame } from '../../database/models/Minigames';

// Configurações do casino
const CASINO_CONFIG = {
  minBet: 10,
  maxBet: 100000,
  dailyLossLimit: 50000,
  selfExcludeDays: 7,
};

// Tipos de jogos
type GameType = 'roulette' | 'blackjack' | 'slots' | 'dice';

// Obter ou criar perfil do casino
export async function getOrCreateCasinoProfile(odiscordId: string): Promise<ICasinoProfile> {
  let profile = await CasinoProfile.findOne({ odiscordId });

  if (!profile) {
    profile = new CasinoProfile({
      odiscordId,
      totalGamesPlayed: 0,
      totalWins: 0,
      totalLosses: 0,
      totalBet: 0,
      totalWon: 0,
      totalLost: 0,
      netProfit: 0,
      biggestWin: 0,
      currentStreak: 0,
      longestWinStreak: 0,
      longestLoseStreak: 0,
      dailyLossToday: 0,
      lastDailyReset: new Date(),
      recentGames: [],
      isSelfExcluded: false,
    });
    await profile.save();
  }

  return profile.toObject();
}

// Validar aposta
async function validateBet(
  profile: any,
  betAmount: number
): Promise<{ valid: boolean; message: string }> {
  // Verificar autoexclusão
  if (profile.isSelfExcluded) {
    if (profile.selfExcludeUntil && new Date() < profile.selfExcludeUntil) {
      return { valid: false, message: 'Você está em período de autoexclusão.' };
    }
    profile.isSelfExcluded = false;
    profile.selfExcludeUntil = undefined;
    await profile.save();
  }

  // Verificar valores
  if (betAmount < CASINO_CONFIG.minBet) {
    return { valid: false, message: `Aposta mínima: ${CASINO_CONFIG.minBet} moedas.` };
  }

  if (betAmount > CASINO_CONFIG.maxBet) {
    return { valid: false, message: `Aposta máxima: ${CASINO_CONFIG.maxBet} moedas.` };
  }

  // Resetar diário se necessário
  const now = new Date();
  if (profile.lastDailyReset.toDateString() !== now.toDateString()) {
    profile.dailyLossToday = 0;
    profile.lastDailyReset = now;
    await profile.save();
  }

  // Verificar limite diário
  const limit = profile.personalDailyLimit || CASINO_CONFIG.dailyLossLimit;
  if (profile.dailyLossToday >= limit) {
    return { valid: false, message: 'Você atingiu seu limite diário de perdas.' };
  }

  return { valid: true, message: '' };
}

// Registrar resultado do jogo
async function recordGameResult(
  profile: any,
  gameType: GameType,
  betAmount: number,
  won: boolean,
  payout: number,
  details: any
): Promise<void> {
  const game: CasinoGame = {
    gameType,
    betAmount,
    won,
    payout,
    playedAt: new Date(),
    details,
  };

  profile.recentGames.push(game);
  if (profile.recentGames.length > 20) {
    profile.recentGames.shift();
  }

  profile.totalGamesPlayed++;
  profile.totalBet += betAmount;

  if (won) {
    profile.totalWins++;
    profile.totalWon += payout;
    profile.netProfit += payout - betAmount;
    profile.biggestWin = Math.max(profile.biggestWin, payout - betAmount);

    if (profile.currentStreak >= 0) {
      profile.currentStreak++;
    } else {
      profile.currentStreak = 1;
    }
    profile.longestWinStreak = Math.max(profile.longestWinStreak, profile.currentStreak);
  } else {
    profile.totalLosses++;
    profile.totalLost += betAmount;
    profile.netProfit -= betAmount;
    profile.dailyLossToday += betAmount;

    if (profile.currentStreak <= 0) {
      profile.currentStreak--;
    } else {
      profile.currentStreak = -1;
    }
    profile.longestLoseStreak = Math.max(profile.longestLoseStreak, Math.abs(profile.currentStreak));
  }

  await profile.save();
}

// ==================== ROLETA ====================

const ROULETTE_NUMBERS = [
  { number: 0, color: 'green' },
  ...Array.from({ length: 36 }, (_, i) => ({
    number: i + 1,
    color: i % 2 === 0 ? 'red' : 'black',
  })),
];

export async function playRoulette(
  odiscordId: string,
  betAmount: number,
  betType: 'red' | 'black' | 'green' | 'odd' | 'even' | number
): Promise<{
  success: boolean;
  won: boolean;
  result?: number;
  resultColor?: string;
  payout: number;
  message: string;
}> {
  let profile = await CasinoProfile.findOne({ odiscordId });
  if (!profile) {
    await getOrCreateCasinoProfile(odiscordId);
    profile = await CasinoProfile.findOne({ odiscordId });
  }

  const validation = await validateBet(profile, betAmount);
  if (!validation.valid) {
    return { success: false, won: false, payout: 0, message: validation.message };
  }

  // Girar a roleta
  const resultIndex = Math.floor(Math.random() * ROULETTE_NUMBERS.length);
  const result = ROULETTE_NUMBERS[resultIndex];

  // Verificar vitória
  let won = false;
  let multiplier = 0;

  if (typeof betType === 'number') {
    won = result.number === betType;
    multiplier = 35; // 35:1 para número específico
  } else {
    switch (betType) {
      case 'red':
        won = result.color === 'red';
        multiplier = 2;
        break;
      case 'black':
        won = result.color === 'black';
        multiplier = 2;
        break;
      case 'green':
        won = result.number === 0;
        multiplier = 14;
        break;
      case 'odd':
        won = result.number !== 0 && result.number % 2 === 1;
        multiplier = 2;
        break;
      case 'even':
        won = result.number !== 0 && result.number % 2 === 0;
        multiplier = 2;
        break;
    }
  }

  const payout = won ? betAmount * multiplier : 0;

  await recordGameResult(profile, 'roulette', betAmount, won, payout, {
    betType,
    result: result.number,
    resultColor: result.color,
  });

  return {
    success: true,
    won,
    result: result.number,
    resultColor: result.color,
    payout,
    message: won
      ? `🎰 ${result.number} ${result.color}! Você ganhou ${payout} moedas!`
      : `🎰 ${result.number} ${result.color}! Você perdeu ${betAmount} moedas.`,
  };
}

// ==================== DADOS ====================

export async function playDice(
  odiscordId: string,
  betAmount: number,
  prediction: 'high' | 'low' | 'exact',
  exactNumber?: number
): Promise<{
  success: boolean;
  won: boolean;
  dice1: number;
  dice2: number;
  total: number;
  payout: number;
  message: string;
}> {
  let profile = await CasinoProfile.findOne({ odiscordId });
  if (!profile) {
    await getOrCreateCasinoProfile(odiscordId);
    profile = await CasinoProfile.findOne({ odiscordId });
  }

  const validation = await validateBet(profile, betAmount);
  if (!validation.valid) {
    return { success: false, won: false, dice1: 0, dice2: 0, total: 0, payout: 0, message: validation.message };
  }

  // Rolar dados
  const dice1 = Math.floor(Math.random() * 6) + 1;
  const dice2 = Math.floor(Math.random() * 6) + 1;
  const total = dice1 + dice2;

  // Verificar vitória
  let won = false;
  let multiplier = 0;

  switch (prediction) {
    case 'high':
      won = total >= 8;
      multiplier = 2;
      break;
    case 'low':
      won = total <= 6;
      multiplier = 2;
      break;
    case 'exact':
      if (exactNumber !== undefined) {
        won = total === exactNumber;
        multiplier = 6;
      }
      break;
  }

  const payout = won ? betAmount * multiplier : 0;

  await recordGameResult(profile, 'dice', betAmount, won, payout, {
    prediction,
    exactNumber,
    dice1,
    dice2,
    total,
  });

  return {
    success: true,
    won,
    dice1,
    dice2,
    total,
    payout,
    message: won
      ? `🎲 [${dice1}][${dice2}] = ${total}! Você ganhou ${payout} moedas!`
      : `🎲 [${dice1}][${dice2}] = ${total}! Você perdeu ${betAmount} moedas.`,
  };
}

// ==================== SLOTS ====================

const SLOT_SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣', '⭐'];
const SLOT_PAYOUTS: Record<string, number> = {
  '🍒🍒🍒': 5,
  '🍋🍋🍋': 8,
  '🍊🍊🍊': 10,
  '🍇🍇🍇': 15,
  '💎💎💎': 25,
  '7️⃣7️⃣7️⃣': 50,
  '⭐⭐⭐': 100,
};

export async function playSlots(
  odiscordId: string,
  betAmount: number
): Promise<{
  success: boolean;
  won: boolean;
  slots: string[];
  payout: number;
  message: string;
}> {
  let profile = await CasinoProfile.findOne({ odiscordId });
  if (!profile) {
    await getOrCreateCasinoProfile(odiscordId);
    profile = await CasinoProfile.findOne({ odiscordId });
  }

  const validation = await validateBet(profile, betAmount);
  if (!validation.valid) {
    return { success: false, won: false, slots: [], payout: 0, message: validation.message };
  }

  // Girar slots
  const slots = [
    SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
    SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
    SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
  ];

  const combination = slots.join('');
  const multiplier = SLOT_PAYOUTS[combination] || 0;
  const won = multiplier > 0;
  const payout = won ? betAmount * multiplier : 0;

  // Verificar se dois símbolos iguais (pequeno prêmio)
  let smallWin = false;
  if (!won && slots[0] === slots[1]) {
    smallWin = true;
  }

  const finalPayout = smallWin ? Math.floor(betAmount * 0.5) : payout;
  const finalWon = won || smallWin;

  await recordGameResult(profile, 'slots', betAmount, finalWon, finalPayout, {
    slots,
    multiplier: won ? multiplier : (smallWin ? 0.5 : 0),
  });

  return {
    success: true,
    won: finalWon,
    slots,
    payout: finalPayout,
    message: finalWon
      ? `🎰 ${slots.join(' | ')} - Você ganhou ${finalPayout} moedas!`
      : `🎰 ${slots.join(' | ')} - Você perdeu ${betAmount} moedas.`,
  };
}

// ==================== UTILITÁRIOS ====================

// Autoexclusão
export async function selfExclude(
  odiscordId: string,
  days: number = CASINO_CONFIG.selfExcludeDays
): Promise<{ success: boolean; message: string }> {
  await CasinoProfile.updateOne(
    { odiscordId },
    {
      isSelfExcluded: true,
      selfExcludeUntil: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
    },
    { upsert: true }
  );

  return { success: true, message: `Você se excluiu do casino por ${days} dias.` };
}

// Definir limite pessoal
export async function setPersonalLimit(
  odiscordId: string,
  limit: number
): Promise<{ success: boolean; message: string }> {
  if (limit < 1000 || limit > CASINO_CONFIG.dailyLossLimit) {
    return { success: false, message: `Limite deve estar entre 1000 e ${CASINO_CONFIG.dailyLossLimit}.` };
  }

  await CasinoProfile.updateOne(
    { odiscordId },
    { personalDailyLimit: limit },
    { upsert: true }
  );

  return { success: true, message: `Limite diário definido para ${limit} moedas.` };
}

// Obter estatísticas
export async function getCasinoStats(odiscordId: string): Promise<ICasinoProfile | null> {
  return await CasinoProfile.findOne({ odiscordId }).lean();
}

// Obter ranking do casino
export async function getCasinoLeaderboard(
  type: 'profit' | 'wins' | 'games',
  limit: number = 10
): Promise<Array<{ odiscordId: string; value: number }>> {
  const sortField = type === 'profit' ? 'netProfit' : type === 'wins' ? 'totalWins' : 'totalGamesPlayed';

  const profiles = await CasinoProfile.find()
    .sort({ [sortField]: -1 })
    .limit(limit)
    .lean();

  return profiles.map(p => ({
    odiscordId: p.odiscordId,
    value: type === 'profit' ? p.netProfit : type === 'wins' ? p.totalWins : p.totalGamesPlayed,
  }));
}
