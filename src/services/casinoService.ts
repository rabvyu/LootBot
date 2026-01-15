import { economyRepository } from '../database/repositories/economyRepository';
import { logger } from '../utils/logger';

export interface GameResult {
  success: boolean;
  message: string;
  won: boolean;
  betAmount: number;
  winAmount: number;
  netGain: number;
  details?: string;
}

// Slot machine symbols
const SLOT_SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '🔔', '⭐', '7️⃣', '💎'];
const SLOT_PAYOUTS: Record<string, number> = {
  '💎💎💎': 10,
  '7️⃣7️⃣7️⃣': 7,
  '⭐⭐⭐': 5,
  '🔔🔔🔔': 4,
  '🍇🍇🍇': 3,
  '🍊🍊🍊': 2.5,
  '🍋🍋🍋': 2,
  '🍒🍒🍒': 1.5,
};

// Blackjack card values
const CARD_SUITS = ['♠️', '♥️', '♦️', '♣️'];
const CARD_VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

class CasinoService {
  private minBet = 10;
  private maxBet = 50000;

  // Coinflip - 50/50 chance, 1.9x payout
  async coinflip(
    discordId: string,
    betAmount: number,
    choice: 'cara' | 'coroa'
  ): Promise<GameResult> {
    const validation = await this.validateBet(discordId, betAmount);
    if (!validation.valid) {
      return { success: false, message: validation.message, won: false, betAmount, winAmount: 0, netGain: 0 };
    }

    // Deduct bet
    await economyRepository.removeCoins(discordId, betAmount, 'spend', 'Cassino: Coinflip');

    const result = Math.random() < 0.5 ? 'cara' : 'coroa';
    const won = result === choice;
    const winAmount = won ? Math.floor(betAmount * 1.9) : 0;
    const netGain = winAmount - betAmount;

    if (won) {
      await economyRepository.addCoins(discordId, winAmount, 'earn', 'Cassino: Coinflip (vitória)');
    }

    const emoji = result === 'cara' ? '🪙' : '👑';

    return {
      success: true,
      message: won ? '🎉 Você ganhou!' : '😢 Você perdeu!',
      won,
      betAmount,
      winAmount,
      netGain,
      details: `A moeda caiu em **${emoji} ${result.charAt(0).toUpperCase() + result.slice(1)}**!`,
    };
  }

  // Dice - roll higher than dealer, 1.9x payout
  async dice(discordId: string, betAmount: number): Promise<GameResult> {
    const validation = await this.validateBet(discordId, betAmount);
    if (!validation.valid) {
      return { success: false, message: validation.message, won: false, betAmount, winAmount: 0, netGain: 0 };
    }

    await economyRepository.removeCoins(discordId, betAmount, 'spend', 'Cassino: Dados');

    const playerRoll = this.rollDice();
    const dealerRoll = this.rollDice();
    const won = playerRoll > dealerRoll;
    const tie = playerRoll === dealerRoll;

    let winAmount = 0;
    let netGain = -betAmount;
    let message = '';

    if (tie) {
      // Return bet on tie
      winAmount = betAmount;
      netGain = 0;
      message = '🤝 Empate! Aposta devolvida.';
      await economyRepository.addCoins(discordId, betAmount, 'earn', 'Cassino: Dados (empate)');
    } else if (won) {
      winAmount = Math.floor(betAmount * 1.9);
      netGain = winAmount - betAmount;
      message = '🎉 Você ganhou!';
      await economyRepository.addCoins(discordId, winAmount, 'earn', 'Cassino: Dados (vitória)');
    } else {
      message = '😢 Você perdeu!';
    }

    return {
      success: true,
      message,
      won,
      betAmount,
      winAmount,
      netGain,
      details: `🎲 Você: **${playerRoll}** | 🎰 Casa: **${dealerRoll}**`,
    };
  }

  // Slots - variable payouts
  async slots(discordId: string, betAmount: number): Promise<GameResult> {
    const validation = await this.validateBet(discordId, betAmount);
    if (!validation.valid) {
      return { success: false, message: validation.message, won: false, betAmount, winAmount: 0, netGain: 0 };
    }

    await economyRepository.removeCoins(discordId, betAmount, 'spend', 'Cassino: Slots');

    const reel1 = this.spinSlot();
    const reel2 = this.spinSlot();
    const reel3 = this.spinSlot();
    const combo = `${reel1}${reel2}${reel3}`;

    let multiplier = 0;

    // Check for three of a kind
    if (reel1 === reel2 && reel2 === reel3) {
      multiplier = SLOT_PAYOUTS[combo] || 1.5;
    }
    // Check for two of a kind
    else if (reel1 === reel2 || reel2 === reel3 || reel1 === reel3) {
      multiplier = 0.5; // Return half on two matches
    }

    const won = multiplier > 0;
    const winAmount = Math.floor(betAmount * multiplier);
    const netGain = winAmount - betAmount;

    if (won) {
      await economyRepository.addCoins(discordId, winAmount, 'earn', 'Cassino: Slots (vitória)');
    }

    let message = '';
    if (multiplier >= 5) {
      message = '🎰 JACKPOT!!! 🎰';
    } else if (multiplier >= 2) {
      message = '🎉 Grande vitória!';
    } else if (multiplier > 0) {
      message = '✨ Você ganhou algo!';
    } else {
      message = '😢 Tente novamente!';
    }

    return {
      success: true,
      message,
      won,
      betAmount,
      winAmount,
      netGain,
      details: `[ ${reel1} | ${reel2} | ${reel3} ]${multiplier >= 1 ? `\nMultiplicador: **${multiplier}x**` : ''}`,
    };
  }

  // Roulette - various betting options
  async roulette(
    discordId: string,
    betAmount: number,
    betType: 'vermelho' | 'preto' | 'par' | 'impar' | 'numero',
    number?: number
  ): Promise<GameResult> {
    const validation = await this.validateBet(discordId, betAmount);
    if (!validation.valid) {
      return { success: false, message: validation.message, won: false, betAmount, winAmount: 0, netGain: 0 };
    }

    if (betType === 'numero' && (number === undefined || number < 0 || number > 36)) {
      return {
        success: false,
        message: 'Número deve estar entre 0 e 36.',
        won: false,
        betAmount,
        winAmount: 0,
        netGain: 0,
      };
    }

    await economyRepository.removeCoins(discordId, betAmount, 'spend', 'Cassino: Roleta');

    const result = Math.floor(Math.random() * 37); // 0-36
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    const isRed = redNumbers.includes(result);
    const isBlack = result !== 0 && !isRed;
    const isEven = result !== 0 && result % 2 === 0;
    const isOdd = result !== 0 && result % 2 !== 0;

    let won = false;
    let multiplier = 0;

    switch (betType) {
      case 'vermelho':
        won = isRed;
        multiplier = won ? 2 : 0;
        break;
      case 'preto':
        won = isBlack;
        multiplier = won ? 2 : 0;
        break;
      case 'par':
        won = isEven;
        multiplier = won ? 2 : 0;
        break;
      case 'impar':
        won = isOdd;
        multiplier = won ? 2 : 0;
        break;
      case 'numero':
        won = result === number;
        multiplier = won ? 35 : 0;
        break;
    }

    const winAmount = Math.floor(betAmount * multiplier);
    const netGain = winAmount - betAmount;

    if (won) {
      await economyRepository.addCoins(discordId, winAmount, 'earn', 'Cassino: Roleta (vitória)');
    }

    const colorEmoji = result === 0 ? '🟢' : isRed ? '🔴' : '⚫';

    return {
      success: true,
      message: won ? '🎉 Você ganhou!' : '😢 Você perdeu!',
      won,
      betAmount,
      winAmount,
      netGain,
      details: `A roleta parou em ${colorEmoji} **${result}**!`,
    };
  }

  // Crash game - multiplier increases until crash
  async crash(discordId: string, betAmount: number, cashoutAt: number): Promise<GameResult> {
    const validation = await this.validateBet(discordId, betAmount);
    if (!validation.valid) {
      return { success: false, message: validation.message, won: false, betAmount, winAmount: 0, netGain: 0 };
    }

    if (cashoutAt < 1.1 || cashoutAt > 10) {
      return {
        success: false,
        message: 'Multiplicador de saída deve estar entre 1.1x e 10x.',
        won: false,
        betAmount,
        winAmount: 0,
        netGain: 0,
      };
    }

    await economyRepository.removeCoins(discordId, betAmount, 'spend', 'Cassino: Crash');

    // Generate crash point (house edge ~4%)
    const crashPoint = this.generateCrashPoint();
    const won = cashoutAt <= crashPoint;
    const winAmount = won ? Math.floor(betAmount * cashoutAt) : 0;
    const netGain = winAmount - betAmount;

    if (won) {
      await economyRepository.addCoins(discordId, winAmount, 'earn', 'Cassino: Crash (vitória)');
    }

    return {
      success: true,
      message: won ? '🎉 Você escapou a tempo!' : '💥 CRASH!',
      won,
      betAmount,
      winAmount,
      netGain,
      details: `📈 Seu alvo: **${cashoutAt}x**\n💥 Crash em: **${crashPoint.toFixed(2)}x**`,
    };
  }

  // Higher or Lower - guess if next number is higher or lower
  async higherLower(
    discordId: string,
    betAmount: number,
    guess: 'maior' | 'menor'
  ): Promise<GameResult> {
    const validation = await this.validateBet(discordId, betAmount);
    if (!validation.valid) {
      return { success: false, message: validation.message, won: false, betAmount, winAmount: 0, netGain: 0 };
    }

    await economyRepository.removeCoins(discordId, betAmount, 'spend', 'Cassino: Maior/Menor');

    const firstNumber = Math.floor(Math.random() * 99) + 1; // 1-99
    const secondNumber = Math.floor(Math.random() * 99) + 1;

    let won = false;
    if (guess === 'maior') {
      won = secondNumber > firstNumber;
    } else {
      won = secondNumber < firstNumber;
    }

    // Tie = loss
    if (firstNumber === secondNumber) {
      won = false;
    }

    // Payout based on probability
    let multiplier = 1.9;
    if (firstNumber <= 10 && guess === 'menor') multiplier = 5;
    else if (firstNumber >= 90 && guess === 'maior') multiplier = 5;
    else if (firstNumber <= 25 && guess === 'menor') multiplier = 2.5;
    else if (firstNumber >= 75 && guess === 'maior') multiplier = 2.5;

    const winAmount = won ? Math.floor(betAmount * multiplier) : 0;
    const netGain = winAmount - betAmount;

    if (won) {
      await economyRepository.addCoins(discordId, winAmount, 'earn', 'Cassino: Maior/Menor (vitória)');
    }

    const arrow = secondNumber > firstNumber ? '⬆️' : secondNumber < firstNumber ? '⬇️' : '➡️';

    return {
      success: true,
      message: won ? '🎉 Você acertou!' : '😢 Você errou!',
      won,
      betAmount,
      winAmount,
      netGain,
      details: `Primeiro: **${firstNumber}** ${arrow} Segundo: **${secondNumber}**${won && multiplier > 2 ? `\n🔥 Bônus: **${multiplier}x**` : ''}`,
    };
  }

  private async validateBet(
    discordId: string,
    betAmount: number
  ): Promise<{ valid: boolean; message: string }> {
    if (betAmount < this.minBet) {
      return { valid: false, message: `Aposta mínima: ${this.minBet} coins.` };
    }

    if (betAmount > this.maxBet) {
      return { valid: false, message: `Aposta máxima: ${this.maxBet} coins.` };
    }

    const balance = await economyRepository.getBalance(discordId);
    if (balance < betAmount) {
      return { valid: false, message: `Saldo insuficiente. (Saldo: ${balance} coins)` };
    }

    return { valid: true, message: '' };
  }

  private rollDice(): number {
    return Math.floor(Math.random() * 6) + 1;
  }

  private spinSlot(): string {
    // Weighted selection - rarer symbols less likely
    const weights = [20, 18, 16, 14, 12, 10, 6, 4]; // Cherry most common, diamond rarest
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < SLOT_SYMBOLS.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return SLOT_SYMBOLS[i];
      }
    }

    return SLOT_SYMBOLS[0];
  }

  private generateCrashPoint(): number {
    // House edge ~4%
    const houseEdge = 0.04;
    const random = Math.random();
    if (random < houseEdge) {
      return 1.0; // Instant crash
    }
    // Exponential distribution
    return Math.max(1.0, parseFloat((1 / (1 - random * (1 - houseEdge))).toFixed(2)));
  }

  getMinBet(): number {
    return this.minBet;
  }

  getMaxBet(): number {
    return this.maxBet;
  }
}

export const casinoService = new CasinoService();
export default casinoService;
