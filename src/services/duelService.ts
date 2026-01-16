import { Duel, IDuel } from '../database/models/Duel';
import { PvpStats, IPvpStats, RANK_INFO } from '../database/models/PvpStats';
import { rpgRepository } from '../database/repositories/rpgRepository';
import { equipmentService } from './equipmentService';
import { economyService } from './economyService';
import { userRepository } from '../database/repositories/userRepository';
import { CharacterStats } from '../database/models/Character';
import { logger } from '../utils/logger';

interface DuelChallenge {
  success: boolean;
  message: string;
  duel?: IDuel;
}

interface DuelResult {
  success: boolean;
  message: string;
  winner?: string;
  winnerName?: string;
  loser?: string;
  loserName?: string;
  rounds?: string[];
  challengerDamage?: number;
  opponentDamage?: number;
  xpWinner?: number;
  xpLoser?: number;
  coinsWon?: number;
  eloChange?: number;
}

interface FullStats {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  critChance: number;
  critDamage: number;
}

// Duel configuration
const DUEL_CONFIG = {
  CHALLENGE_EXPIRE_MINUTES: 5,
  COOLDOWN_SAME_OPPONENT_MINUTES: 10,
  MIN_LEVEL: 5,
  MIN_BET: 0,
  MAX_BET: 50000,
  BASE_XP_WINNER: 50,
  BASE_XP_LOSER: 15,
  ELO_K_FACTOR: 32,
  MAX_ROUNDS: 50,
};

class DuelService {
  // Get full stats including equipment
  private async getFullStats(discordId: string): Promise<FullStats | null> {
    const character = await rpgRepository.getCharacter(discordId);
    if (!character) return null;

    const { stats: eqStats } = await equipmentService.calculateTotalStats(discordId);

    return {
      hp: character.stats.hp + (eqStats.hp || 0),
      maxHp: character.stats.maxHp + (eqStats.hp || 0),
      attack: character.stats.attack + (eqStats.attack || 0),
      defense: character.stats.defense + (eqStats.defense || 0),
      critChance: character.stats.critChance + (eqStats.critChance || 0),
      critDamage: character.stats.critDamage + (eqStats.critDamage || 0),
    };
  }

  // Create a duel challenge
  async challengePlayer(
    challengerId: string,
    challengerName: string,
    opponentId: string,
    opponentName: string,
    betAmount: number = 0
  ): Promise<DuelChallenge> {
    try {
      // Can't duel yourself
      if (challengerId === opponentId) {
        return { success: false, message: 'Voce nao pode desafiar a si mesmo!' };
      }

      // Check if both have characters
      const challengerChar = await rpgRepository.getCharacter(challengerId);
      const opponentChar = await rpgRepository.getCharacter(opponentId);

      if (!challengerChar) {
        return { success: false, message: 'Voce precisa criar um personagem primeiro! Use `/rpg criar`' };
      }

      if (!opponentChar) {
        return { success: false, message: 'O oponente nao possui um personagem!' };
      }

      // Check minimum level
      if (challengerChar.level < DUEL_CONFIG.MIN_LEVEL) {
        return { success: false, message: `Voce precisa ser pelo menos nivel ${DUEL_CONFIG.MIN_LEVEL} para duelar!` };
      }

      if (opponentChar.level < DUEL_CONFIG.MIN_LEVEL) {
        return { success: false, message: `O oponente precisa ser pelo menos nivel ${DUEL_CONFIG.MIN_LEVEL} para duelar!` };
      }

      // Check for existing pending duel
      const existingDuel = await Duel.findOne({
        $or: [
          { challengerId, status: 'pending' },
          { opponentId: challengerId, status: 'pending' },
          { challengerId, opponentId, status: 'in_progress' },
        ]
      });

      if (existingDuel) {
        return { success: false, message: 'Voce ja tem um duelo pendente ou em andamento!' };
      }

      // Check cooldown with same opponent
      const recentDuel = await Duel.findOne({
        $or: [
          { challengerId, opponentId },
          { challengerId: opponentId, opponentId: challengerId }
        ],
        completedAt: { $gte: new Date(Date.now() - DUEL_CONFIG.COOLDOWN_SAME_OPPONENT_MINUTES * 60 * 1000) }
      });

      if (recentDuel) {
        const cooldownEnd = new Date(recentDuel.completedAt!.getTime() + DUEL_CONFIG.COOLDOWN_SAME_OPPONENT_MINUTES * 60 * 1000);
        const remaining = Math.ceil((cooldownEnd.getTime() - Date.now()) / 60000);
        return { success: false, message: `Aguarde ${remaining} minutos para duelar com este jogador novamente!` };
      }

      // Validate bet
      if (betAmount < DUEL_CONFIG.MIN_BET || betAmount > DUEL_CONFIG.MAX_BET) {
        return { success: false, message: `Aposta deve ser entre ${DUEL_CONFIG.MIN_BET} e ${DUEL_CONFIG.MAX_BET} coins!` };
      }

      // Check if both have enough coins for bet
      if (betAmount > 0) {
        const challengerBalance = await economyService.getBalance(challengerId);
        const opponentBalance = await economyService.getBalance(opponentId);

        if (challengerBalance < betAmount) {
          return { success: false, message: 'Voce nao tem coins suficientes para esta aposta!' };
        }

        if (opponentBalance < betAmount) {
          return { success: false, message: 'O oponente nao tem coins suficientes para esta aposta!' };
        }
      }

      // Create duel challenge
      const expiresAt = new Date(Date.now() + DUEL_CONFIG.CHALLENGE_EXPIRE_MINUTES * 60 * 1000);

      const duel = await Duel.create({
        challengerId,
        challengerName,
        opponentId,
        opponentName,
        betAmount,
        status: 'pending',
        expiresAt,
      });

      return {
        success: true,
        message: `Desafio enviado para **${opponentName}**!`,
        duel
      };
    } catch (error) {
      logger.error('Error creating duel challenge:', error);
      return { success: false, message: 'Erro ao criar desafio. Tente novamente.' };
    }
  }

  // Accept a duel challenge
  async acceptDuel(opponentId: string): Promise<DuelResult> {
    try {
      const duel = await Duel.findOne({
        opponentId,
        status: 'pending',
        expiresAt: { $gt: new Date() }
      });

      if (!duel) {
        return { success: false, message: 'Voce nao tem nenhum desafio pendente!' };
      }

      // Lock coins for bet
      if (duel.betAmount > 0) {
        const challengerBalance = await economyService.getBalance(duel.challengerId);
        const opponentBalance = await economyService.getBalance(duel.opponentId);

        if (challengerBalance < duel.betAmount) {
          await duel.deleteOne();
          return { success: false, message: 'O desafiante nao tem mais coins suficientes!' };
        }

        if (opponentBalance < duel.betAmount) {
          return { success: false, message: 'Voce nao tem coins suficientes para a aposta!' };
        }
      }

      // Update status
      duel.status = 'in_progress';
      await duel.save();

      // Execute the duel
      return await this.executeDuel(duel);
    } catch (error) {
      logger.error('Error accepting duel:', error);
      return { success: false, message: 'Erro ao aceitar duelo. Tente novamente.' };
    }
  }

  // Decline a duel
  async declineDuel(opponentId: string): Promise<{ success: boolean; message: string }> {
    try {
      const duel = await Duel.findOne({
        opponentId,
        status: 'pending'
      });

      if (!duel) {
        return { success: false, message: 'Voce nao tem nenhum desafio pendente!' };
      }

      duel.status = 'declined';
      await duel.save();

      return { success: true, message: `Voce recusou o desafio de **${duel.challengerName}**!` };
    } catch (error) {
      logger.error('Error declining duel:', error);
      return { success: false, message: 'Erro ao recusar duelo.' };
    }
  }

  // Execute the actual duel battle
  private async executeDuel(duel: IDuel): Promise<DuelResult> {
    try {
      const challengerChar = await rpgRepository.getCharacter(duel.challengerId);
      const opponentChar = await rpgRepository.getCharacter(duel.opponentId);

      if (!challengerChar || !opponentChar) {
        duel.status = 'expired';
        await duel.save();
        return { success: false, message: 'Um dos jogadores nao possui personagem!' };
      }

      // Get full stats (with equipment)
      const challengerStats = await this.getFullStats(duel.challengerId);
      const opponentStats = await this.getFullStats(duel.opponentId);

      if (!challengerStats || !opponentStats) {
        duel.status = 'expired';
        await duel.save();
        return { success: false, message: 'Erro ao calcular stats!' };
      }

      // Battle simulation
      let challengerHp = challengerStats.hp;
      let opponentHp = opponentStats.hp;
      let challengerDamage = 0;
      let opponentDamage = 0;
      const rounds: string[] = [];
      let turn = Math.random() > 0.5 ? 'challenger' : 'opponent';
      let roundNum = 0;

      while (challengerHp > 0 && opponentHp > 0 && roundNum < DUEL_CONFIG.MAX_ROUNDS) {
        roundNum++;

        if (turn === 'challenger') {
          // Challenger attacks
          const isCrit = Math.random() * 100 < challengerStats.critChance;
          let damage = challengerStats.attack - Math.floor(opponentStats.defense * 0.5);
          damage = Math.max(1, damage);

          if (isCrit) {
            damage = Math.floor(damage * (1 + challengerStats.critDamage / 100));
            rounds.push(`⚔️ **${duel.challengerName}** ataca com CRITICO! **${damage}** de dano!`);
          } else {
            rounds.push(`⚔️ **${duel.challengerName}** ataca! **${damage}** de dano.`);
          }

          opponentHp -= damage;
          challengerDamage += damage;
          turn = 'opponent';
        } else {
          // Opponent attacks
          const isCrit = Math.random() * 100 < opponentStats.critChance;
          let damage = opponentStats.attack - Math.floor(challengerStats.defense * 0.5);
          damage = Math.max(1, damage);

          if (isCrit) {
            damage = Math.floor(damage * (1 + opponentStats.critDamage / 100));
            rounds.push(`⚔️ **${duel.opponentName}** ataca com CRITICO! **${damage}** de dano!`);
          } else {
            rounds.push(`⚔️ **${duel.opponentName}** ataca! **${damage}** de dano.`);
          }

          challengerHp -= damage;
          opponentDamage += damage;
          turn = 'challenger';
        }

        // Add HP status every 5 rounds
        if (roundNum % 5 === 0 && challengerHp > 0 && opponentHp > 0) {
          rounds.push(`📊 HP: ${duel.challengerName}: ${Math.max(0, challengerHp)} | ${duel.opponentName}: ${Math.max(0, opponentHp)}`);
        }
      }

      // Determine winner
      let winnerId: string;
      let winnerName: string;
      let loserId: string;
      let loserName: string;

      if (challengerHp <= 0) {
        winnerId = duel.opponentId;
        winnerName = duel.opponentName;
        loserId = duel.challengerId;
        loserName = duel.challengerName;
        rounds.push(`\n🏆 **${duel.opponentName}** venceu o duelo!`);
      } else if (opponentHp <= 0) {
        winnerId = duel.challengerId;
        winnerName = duel.challengerName;
        loserId = duel.opponentId;
        loserName = duel.opponentName;
        rounds.push(`\n🏆 **${duel.challengerName}** venceu o duelo!`);
      } else {
        // Draw (max rounds reached) - higher HP wins
        if (challengerHp > opponentHp) {
          winnerId = duel.challengerId;
          winnerName = duel.challengerName;
          loserId = duel.opponentId;
          loserName = duel.opponentName;
        } else if (opponentHp > challengerHp) {
          winnerId = duel.opponentId;
          winnerName = duel.opponentName;
          loserId = duel.challengerId;
          loserName = duel.challengerName;
        } else {
          // True draw
          winnerId = '';
          winnerName = '';
          loserId = '';
          loserName = '';
          rounds.push(`\n🤝 **Empate!** Ambos com ${challengerHp} HP.`);
        }
        if (winnerId) {
          rounds.push(`\n🏆 **${winnerName}** venceu por ter mais HP!`);
        }
      }

      // Calculate rewards
      const levelDiff = Math.abs(challengerChar.level - opponentChar.level);
      const xpWinner = DUEL_CONFIG.BASE_XP_WINNER + Math.floor(levelDiff * 5);
      const xpLoser = DUEL_CONFIG.BASE_XP_LOSER;

      // Update duel record
      duel.status = 'completed';
      duel.winnerId = winnerId || undefined;
      duel.winnerName = winnerName || undefined;
      duel.rounds = rounds;
      duel.challengerDamage = challengerDamage;
      duel.opponentDamage = opponentDamage;
      duel.challengerFinalHp = Math.max(0, challengerHp);
      duel.opponentFinalHp = Math.max(0, opponentHp);
      duel.xpRewardWinner = winnerId ? xpWinner : 0;
      duel.xpRewardLoser = loserId ? xpLoser : 0;
      duel.completedAt = new Date();
      await duel.save();

      // Handle rewards
      let coinsWon = 0;
      if (winnerId) {
        // Transfer bet
        if (duel.betAmount > 0) {
          await economyService.addCoins(winnerId, duel.betAmount, 'duel_win');
          await economyService.removeCoins(loserId, duel.betAmount, 'duel_loss');
          coinsWon = duel.betAmount;
        }

        // Award character XP
        challengerChar.experience += winnerId === duel.challengerId ? xpWinner : xpLoser;
        opponentChar.experience += winnerId === duel.opponentId ? xpWinner : xpLoser;
        await challengerChar.save();
        await opponentChar.save();

        // Update PvP stats
        await this.updatePvpStats(winnerId, winnerName, loserId, loserName, duel.betAmount);

        // Check for badges
        await this.checkPvpBadges(winnerId);
      }

      return {
        success: true,
        message: 'Duelo concluido!',
        winner: winnerId,
        winnerName,
        loser: loserId,
        loserName,
        rounds,
        challengerDamage,
        opponentDamage,
        xpWinner: winnerId ? xpWinner : 0,
        xpLoser: loserId ? xpLoser : 0,
        coinsWon,
      };
    } catch (error) {
      logger.error('Error executing duel:', error);
      duel.status = 'expired';
      await duel.save();
      return { success: false, message: 'Erro durante o duelo!' };
    }
  }

  // Update PvP statistics and ELO
  private async updatePvpStats(
    winnerId: string,
    winnerName: string,
    loserId: string,
    loserName: string,
    betAmount: number
  ): Promise<void> {
    // Get or create stats
    let winnerStats = await PvpStats.findOne({ discordId: winnerId });
    let loserStats = await PvpStats.findOne({ discordId: loserId });

    if (!winnerStats) {
      winnerStats = await PvpStats.create({ discordId: winnerId, username: winnerName });
    }
    if (!loserStats) {
      loserStats = await PvpStats.create({ discordId: loserId, username: loserName });
    }

    // Calculate ELO change
    const expectedWinner = 1 / (1 + Math.pow(10, (loserStats.elo - winnerStats.elo) / 400));
    const eloChange = Math.round(DUEL_CONFIG.ELO_K_FACTOR * (1 - expectedWinner));

    // Update winner
    winnerStats.elo += eloChange;
    winnerStats.seasonElo += eloChange;
    winnerStats.wins += 1;
    winnerStats.seasonWins += 1;
    winnerStats.winStreak += 1;
    if (winnerStats.winStreak > winnerStats.bestWinStreak) {
      winnerStats.bestWinStreak = winnerStats.winStreak;
    }
    winnerStats.totalBetsWon += betAmount;
    winnerStats.lastDuelAt = new Date();
    winnerStats.username = winnerName;
    winnerStats.rank = this.calculateRank(winnerStats.elo);
    winnerStats.updatedAt = new Date();

    // Update loser
    loserStats.elo = Math.max(100, loserStats.elo - eloChange);
    loserStats.seasonElo = Math.max(100, loserStats.seasonElo - eloChange);
    loserStats.losses += 1;
    loserStats.seasonLosses += 1;
    loserStats.winStreak = 0;
    loserStats.totalBetsLost += betAmount;
    loserStats.lastDuelAt = new Date();
    loserStats.username = loserName;
    loserStats.rank = this.calculateRank(loserStats.elo);
    loserStats.updatedAt = new Date();

    await winnerStats.save();
    await loserStats.save();
  }

  private calculateRank(elo: number): 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master' | 'grandmaster' {
    if (elo >= 2400) return 'grandmaster';
    if (elo >= 2100) return 'master';
    if (elo >= 1800) return 'diamond';
    if (elo >= 1500) return 'platinum';
    if (elo >= 1200) return 'gold';
    if (elo >= 900) return 'silver';
    return 'bronze';
  }

  // Check for PvP badges
  private async checkPvpBadges(discordId: string): Promise<void> {
    const stats = await PvpStats.findOne({ discordId });
    if (!stats) return;

    // Helper to award badge by ID
    const awardBadge = async (badgeId: string) => {
      const exists = await userRepository.hasBadge(discordId, badgeId);
      if (!exists) {
        await userRepository.addBadge(discordId, badgeId);
      }
    };

    // Duelist badges
    if (stats.wins >= 1) await awardBadge('pvp_duelist');
    if (stats.wins >= 10) await awardBadge('pvp_fighter');
    if (stats.wins >= 50) await awardBadge('pvp_warrior');
    if (stats.wins >= 100) await awardBadge('pvp_champion');
    if (stats.wins >= 500) await awardBadge('pvp_legend');

    // Streak badges
    if (stats.bestWinStreak >= 5) await awardBadge('pvp_streak_5');
    if (stats.bestWinStreak >= 10) await awardBadge('pvp_streak_10');

    // Rank badges
    if (stats.rank === 'gold' || stats.elo >= 1200) await awardBadge('pvp_gold');
    if (stats.rank === 'diamond' || stats.elo >= 1800) await awardBadge('pvp_diamond');
    if (stats.rank === 'master' || stats.elo >= 2100) await awardBadge('pvp_master');
    if (stats.rank === 'grandmaster' || stats.elo >= 2400) await awardBadge('pvp_grandmaster');
  }

  // Get pending duel for a user
  async getPendingDuel(discordId: string): Promise<IDuel | null> {
    // Expire old duels first
    await Duel.updateMany(
      { status: 'pending', expiresAt: { $lt: new Date() } },
      { status: 'expired' }
    );

    return Duel.findOne({
      $or: [
        { challengerId: discordId, status: 'pending' },
        { opponentId: discordId, status: 'pending' }
      ]
    });
  }

  // Get PvP leaderboard
  async getLeaderboard(limit: number = 10): Promise<IPvpStats[]> {
    return PvpStats.find().sort({ elo: -1 }).limit(limit);
  }

  // Get user PvP stats
  async getStats(discordId: string): Promise<IPvpStats | null> {
    return PvpStats.findOne({ discordId });
  }

  // Get duel history for a user
  async getHistory(discordId: string, limit: number = 10): Promise<IDuel[]> {
    return Duel.find({
      $or: [{ challengerId: discordId }, { opponentId: discordId }],
      status: 'completed'
    })
      .sort({ completedAt: -1 })
      .limit(limit);
  }

  // Get rank info
  getRankInfo(rank: string) {
    return RANK_INFO[rank] || RANK_INFO.bronze;
  }
}

export const duelService = new DuelService();
