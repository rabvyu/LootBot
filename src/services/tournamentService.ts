import { Tournament, ITournament, TournamentType, TournamentMatch } from '../database/models/Tournament';
import { economyService } from './economyService';
import { userRepository } from '../database/repositories/userRepository';
import { duelService } from './duelService';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

// Tournament configuration
const TOURNAMENT_CONFIG = {
  MAX_DURATION_HOURS: 48,
  MIN_REGISTRATION_MINUTES: 30,
  MATCH_TIMEOUT_MINUTES: 10,
  DEFAULT_ENTRY_FEE: 100,
};

interface CreateTournamentOptions {
  name: string;
  description?: string;
  type: TournamentType;
  guildId: string;
  channelId: string;
  createdBy: string;
  maxParticipants?: number;
  minParticipants?: number;
  entryFee?: number;
  registrationMinutes?: number;
  isBracket?: boolean;
  rewards?: {
    first?: { coins: number; xp: number };
    second?: { coins: number; xp: number };
    third?: { coins: number; xp: number };
  };
}

class TournamentService {
  /**
   * Create a new tournament
   */
  async createTournament(options: CreateTournamentOptions): Promise<{
    success: boolean;
    message: string;
    tournament?: ITournament;
  }> {
    // Check for existing active tournament
    const existing = await Tournament.findOne({
      guildId: options.guildId,
      status: { $in: ['registration', 'in_progress'] },
    });

    if (existing) {
      return {
        success: false,
        message: 'Ja existe um torneio ativo neste servidor!',
      };
    }

    const registrationMinutes = options.registrationMinutes || 60;
    const registrationEndsAt = new Date(Date.now() + registrationMinutes * 60 * 1000);

    const tournament = new Tournament({
      name: options.name,
      description: options.description || '',
      type: options.type,
      guildId: options.guildId,
      channelId: options.channelId,
      createdBy: options.createdBy,
      maxParticipants: options.maxParticipants || 16,
      minParticipants: options.minParticipants || 4,
      entryFee: options.entryFee || 0,
      prizePool: 0,
      isBracket: options.isBracket !== false,
      registrationEndsAt,
      rewards: {
        first: options.rewards?.first || { coins: 5000, xp: 1000 },
        second: options.rewards?.second || { coins: 2500, xp: 500 },
        third: options.rewards?.third || { coins: 1000, xp: 250 },
        participation: { coins: 100, xp: 50 },
      },
    });

    await tournament.save();

    logger.info(`Tournament created: ${tournament.name} in guild ${options.guildId}`);

    return {
      success: true,
      message: `Torneio **${tournament.name}** criado! Inscricoes abertas ate <t:${Math.floor(registrationEndsAt.getTime() / 1000)}:R>`,
      tournament,
    };
  }

  /**
   * Register for a tournament
   */
  async registerParticipant(
    guildId: string,
    discordId: string,
    username: string
  ): Promise<{ success: boolean; message: string; tournament?: ITournament }> {
    const tournament = await Tournament.findOne({
      guildId,
      status: 'registration',
    });

    if (!tournament) {
      return { success: false, message: 'Nao ha nenhum torneio com inscricoes abertas!' };
    }

    // Check if registration is still open
    if (new Date() > tournament.registrationEndsAt) {
      return { success: false, message: 'As inscricoes ja foram encerradas!' };
    }

    // Check if already registered
    const existing = tournament.participants.find(p => p.discordId === discordId);
    if (existing) {
      return { success: false, message: 'Voce ja esta inscrito neste torneio!' };
    }

    // Check max participants
    if (tournament.participants.length >= tournament.maxParticipants) {
      return { success: false, message: 'O torneio esta cheio!' };
    }

    // Check entry fee
    if (tournament.entryFee > 0) {
      const balance = await economyService.getBalance(discordId);
      if (balance < tournament.entryFee) {
        return {
          success: false,
          message: `Voce precisa de ${tournament.entryFee} coins para se inscrever!`,
        };
      }

      // Deduct entry fee
      await economyService.removeCoins(discordId, tournament.entryFee, `Inscricao: ${tournament.name}`);
      tournament.prizePool += tournament.entryFee;
    }

    // Add participant
    tournament.participants.push({
      discordId,
      username,
      seed: tournament.participants.length + 1,
      eliminated: false,
      wins: 0,
      losses: 0,
      score: 0,
      registeredAt: new Date(),
    });

    await tournament.save();

    logger.info(`Player ${discordId} registered for tournament ${tournament._id}`);

    return {
      success: true,
      message: `Voce se inscreveu no torneio **${tournament.name}**! (${tournament.participants.length}/${tournament.maxParticipants})`,
      tournament,
    };
  }

  /**
   * Unregister from a tournament
   */
  async unregisterParticipant(
    guildId: string,
    discordId: string
  ): Promise<{ success: boolean; message: string }> {
    const tournament = await Tournament.findOne({
      guildId,
      status: 'registration',
    });

    if (!tournament) {
      return { success: false, message: 'Nao ha nenhum torneio com inscricoes abertas!' };
    }

    const participantIndex = tournament.participants.findIndex(p => p.discordId === discordId);
    if (participantIndex === -1) {
      return { success: false, message: 'Voce nao esta inscrito neste torneio!' };
    }

    // Refund entry fee
    if (tournament.entryFee > 0) {
      await economyService.addCoins(discordId, tournament.entryFee, `Reembolso: ${tournament.name}`);
      tournament.prizePool -= tournament.entryFee;
    }

    // Remove participant
    tournament.participants.splice(participantIndex, 1);

    // Update seeds
    tournament.participants.forEach((p, i) => {
      p.seed = i + 1;
    });

    await tournament.save();

    return {
      success: true,
      message: `Voce saiu do torneio **${tournament.name}**.${tournament.entryFee > 0 ? ` Taxa reembolsada: ${tournament.entryFee} coins.` : ''}`,
    };
  }

  /**
   * Start a tournament (close registration and generate bracket)
   */
  async startTournament(guildId: string): Promise<{
    success: boolean;
    message: string;
    tournament?: ITournament;
  }> {
    const tournament = await Tournament.findOne({
      guildId,
      status: 'registration',
    });

    if (!tournament) {
      return { success: false, message: 'Nao ha nenhum torneio em fase de inscricao!' };
    }

    if (tournament.participants.length < tournament.minParticipants) {
      return {
        success: false,
        message: `Precisa de pelo menos ${tournament.minParticipants} participantes! (Atual: ${tournament.participants.length})`,
      };
    }

    // Shuffle participants for random seeding
    this.shuffleArray(tournament.participants);
    tournament.participants.forEach((p, i) => {
      p.seed = i + 1;
    });

    // Generate bracket matches
    if (tournament.isBracket) {
      this.generateBracket(tournament);
    }

    tournament.status = 'in_progress';
    tournament.startedAt = new Date();
    tournament.currentRound = 1;

    // Add prize pool bonus from entry fees
    const basePrize = tournament.rewards.first.coins + tournament.rewards.second.coins + tournament.rewards.third.coins;
    const entryPoolBonus = Math.floor(tournament.prizePool * 0.9); // 90% of entry fees go to prizes

    if (entryPoolBonus > 0) {
      // Distribute bonus proportionally
      tournament.rewards.first.coins += Math.floor(entryPoolBonus * 0.5);
      tournament.rewards.second.coins += Math.floor(entryPoolBonus * 0.3);
      tournament.rewards.third.coins += Math.floor(entryPoolBonus * 0.2);
    }

    await tournament.save();

    logger.info(`Tournament ${tournament._id} started with ${tournament.participants.length} participants`);

    return {
      success: true,
      message: `O torneio **${tournament.name}** comecou com ${tournament.participants.length} participantes!`,
      tournament,
    };
  }

  /**
   * Generate bracket matches for elimination tournament
   */
  private generateBracket(tournament: ITournament): void {
    const participantCount = tournament.participants.length;

    // Find next power of 2
    let bracketSize = 1;
    while (bracketSize < participantCount) {
      bracketSize *= 2;
    }

    // Calculate total rounds
    tournament.totalRounds = Math.log2(bracketSize);

    // Calculate byes needed
    const byesNeeded = bracketSize - participantCount;

    // Generate first round matches
    const matches: TournamentMatch[] = [];
    const firstRoundMatches = bracketSize / 2;

    let participantIndex = 0;
    let byesAssigned = 0;

    for (let i = 0; i < firstRoundMatches; i++) {
      const match: TournamentMatch = {
        matchId: uuidv4(),
        round: 1,
        bracketPosition: i,
        player1Score: 0,
        player2Score: 0,
        status: 'pending',
      };

      // Assign player 1
      if (participantIndex < participantCount) {
        match.player1Id = tournament.participants[participantIndex].discordId;
        participantIndex++;
      }

      // Assign player 2 or give bye
      if (byesAssigned < byesNeeded && participantIndex >= participantCount - byesNeeded + byesAssigned) {
        // This match gets a bye
        match.status = 'bye';
        match.winnerId = match.player1Id;
        byesAssigned++;
      } else if (participantIndex < participantCount) {
        match.player2Id = tournament.participants[participantIndex].discordId;
        participantIndex++;
      }

      matches.push(match);
    }

    // Generate placeholder matches for future rounds
    let matchesInRound = firstRoundMatches / 2;
    for (let round = 2; round <= tournament.totalRounds; round++) {
      for (let i = 0; i < matchesInRound; i++) {
        matches.push({
          matchId: uuidv4(),
          round,
          bracketPosition: i,
          player1Score: 0,
          player2Score: 0,
          status: 'pending',
        });
      }
      matchesInRound /= 2;
    }

    tournament.matches = matches;
  }

  /**
   * Record match result
   */
  async recordMatchResult(
    tournamentId: string,
    matchId: string,
    winnerId: string
  ): Promise<{ success: boolean; message: string; tournament?: ITournament }> {
    const tournament = await Tournament.findById(tournamentId);

    if (!tournament || tournament.status !== 'in_progress') {
      return { success: false, message: 'Torneio nao encontrado ou nao esta em andamento!' };
    }

    const match = tournament.matches.find(m => m.matchId === matchId);
    if (!match) {
      return { success: false, message: 'Partida nao encontrada!' };
    }

    if (match.status === 'completed') {
      return { success: false, message: 'Esta partida ja foi concluida!' };
    }

    // Validate winner
    if (winnerId !== match.player1Id && winnerId !== match.player2Id) {
      return { success: false, message: 'Vencedor invalido para esta partida!' };
    }

    // Update match
    match.winnerId = winnerId;
    match.status = 'completed';
    match.completedAt = new Date();

    // Update winner/loser stats
    const loserId = winnerId === match.player1Id ? match.player2Id : match.player1Id;

    const winner = tournament.participants.find(p => p.discordId === winnerId);
    const loser = tournament.participants.find(p => p.discordId === loserId);

    if (winner) winner.wins++;
    if (loser) {
      loser.losses++;
      loser.eliminated = true;
      loser.eliminatedRound = match.round;
    }

    // Advance winner to next round
    if (match.round < tournament.totalRounds) {
      const nextRoundPosition = Math.floor(match.bracketPosition / 2);
      const nextMatch = tournament.matches.find(
        m => m.round === match.round + 1 && m.bracketPosition === nextRoundPosition
      );

      if (nextMatch) {
        if (match.bracketPosition % 2 === 0) {
          nextMatch.player1Id = winnerId;
        } else {
          nextMatch.player2Id = winnerId;
        }
      }
    }

    // Check if round is complete
    const currentRoundMatches = tournament.matches.filter(m => m.round === tournament.currentRound);
    const allComplete = currentRoundMatches.every(m => m.status === 'completed' || m.status === 'bye');

    if (allComplete && tournament.currentRound < tournament.totalRounds) {
      tournament.currentRound++;
    }

    // Check if tournament is complete
    if (match.round === tournament.totalRounds) {
      await this.completeTournament(tournament, winnerId);
    }

    await tournament.save();

    return {
      success: true,
      message: `Partida registrada! Vencedor: ${winner?.username}`,
      tournament,
    };
  }

  /**
   * Complete the tournament and distribute rewards
   */
  private async completeTournament(tournament: ITournament, winnerId: string): Promise<void> {
    tournament.status = 'completed';
    tournament.completedAt = new Date();
    tournament.winnerId = winnerId;

    // Find 2nd and 3rd place
    const finalists = tournament.participants
      .filter(p => p.eliminatedRound === tournament.totalRounds || p.discordId === winnerId)
      .sort((a, b) => {
        if (a.discordId === winnerId) return -1;
        if (b.discordId === winnerId) return 1;
        return b.wins - a.wins;
      });

    if (finalists.length > 1) tournament.secondPlaceId = finalists[1].discordId;
    if (finalists.length > 2) tournament.thirdPlaceId = finalists[2].discordId;

    // Distribute rewards
    const { rewards } = tournament;

    // First place
    await economyService.addCoins(winnerId, rewards.first.coins, `1o lugar: ${tournament.name}`);
    await userRepository.addXP(winnerId, rewards.first.xp, 'bonus');
    await this.checkTournamentBadges(winnerId, 1);

    // Second place
    if (tournament.secondPlaceId) {
      await economyService.addCoins(tournament.secondPlaceId, rewards.second.coins, `2o lugar: ${tournament.name}`);
      await userRepository.addXP(tournament.secondPlaceId, rewards.second.xp, 'bonus');
      await this.checkTournamentBadges(tournament.secondPlaceId, 2);
    }

    // Third place
    if (tournament.thirdPlaceId) {
      await economyService.addCoins(tournament.thirdPlaceId, rewards.third.coins, `3o lugar: ${tournament.name}`);
      await userRepository.addXP(tournament.thirdPlaceId, rewards.third.xp, 'bonus');
      await this.checkTournamentBadges(tournament.thirdPlaceId, 3);
    }

    // Participation rewards
    for (const participant of tournament.participants) {
      if (![winnerId, tournament.secondPlaceId, tournament.thirdPlaceId].includes(participant.discordId)) {
        await economyService.addCoins(participant.discordId, rewards.participation.coins, `Participacao: ${tournament.name}`);
        await userRepository.addXP(participant.discordId, rewards.participation.xp, 'bonus');
      }
      await this.checkTournamentBadges(participant.discordId, 0);
    }

    logger.info(`Tournament ${tournament._id} completed. Winner: ${winnerId}`);
  }

  /**
   * Check and award tournament badges
   */
  private async checkTournamentBadges(discordId: string, placement: number): Promise<void> {
    // Get tournament stats
    const stats = await this.getPlayerTournamentStats(discordId);

    // Participation badges
    if (stats.totalTournaments >= 1) await userRepository.addBadge(discordId, 'tournament_rookie');
    if (stats.totalTournaments >= 10) await userRepository.addBadge(discordId, 'tournament_regular');
    if (stats.totalTournaments >= 50) await userRepository.addBadge(discordId, 'tournament_veteran');

    // Victory badges
    if (stats.firstPlaces >= 1) await userRepository.addBadge(discordId, 'tournament_winner');
    if (stats.firstPlaces >= 5) await userRepository.addBadge(discordId, 'tournament_champion');
    if (stats.firstPlaces >= 10) await userRepository.addBadge(discordId, 'tournament_legend');

    // Podium badges
    if (stats.podiums >= 10) await userRepository.addBadge(discordId, 'podium_collector');
  }

  /**
   * Get player tournament stats
   */
  async getPlayerTournamentStats(discordId: string): Promise<{
    totalTournaments: number;
    firstPlaces: number;
    secondPlaces: number;
    thirdPlaces: number;
    podiums: number;
    totalWins: number;
    totalLosses: number;
    winRate: number;
  }> {
    const tournaments = await Tournament.find({
      'participants.discordId': discordId,
      status: 'completed',
    });

    let firstPlaces = 0;
    let secondPlaces = 0;
    let thirdPlaces = 0;
    let totalWins = 0;
    let totalLosses = 0;

    for (const t of tournaments) {
      if (t.winnerId === discordId) firstPlaces++;
      if (t.secondPlaceId === discordId) secondPlaces++;
      if (t.thirdPlaceId === discordId) thirdPlaces++;

      const participant = t.participants.find(p => p.discordId === discordId);
      if (participant) {
        totalWins += participant.wins;
        totalLosses += participant.losses;
      }
    }

    const totalMatches = totalWins + totalLosses;

    return {
      totalTournaments: tournaments.length,
      firstPlaces,
      secondPlaces,
      thirdPlaces,
      podiums: firstPlaces + secondPlaces + thirdPlaces,
      totalWins,
      totalLosses,
      winRate: totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0,
    };
  }

  /**
   * Get active tournament for a guild
   */
  async getActiveTournament(guildId: string): Promise<ITournament | null> {
    return Tournament.findOne({
      guildId,
      status: { $in: ['registration', 'in_progress'] },
    });
  }

  /**
   * Get tournament by ID
   */
  async getTournamentById(tournamentId: string): Promise<ITournament | null> {
    return Tournament.findById(tournamentId);
  }

  /**
   * Get pending matches for a player
   */
  async getPendingMatches(guildId: string, discordId: string): Promise<TournamentMatch[]> {
    const tournament = await this.getActiveTournament(guildId);
    if (!tournament) return [];

    return tournament.matches.filter(
      m => (m.player1Id === discordId || m.player2Id === discordId) &&
           m.status === 'pending' &&
           m.player1Id && m.player2Id
    );
  }

  /**
   * Get current round matches
   */
  async getCurrentRoundMatches(guildId: string): Promise<TournamentMatch[]> {
    const tournament = await this.getActiveTournament(guildId);
    if (!tournament) return [];

    return tournament.matches.filter(m => m.round === tournament.currentRound);
  }

  /**
   * Cancel a tournament
   */
  async cancelTournament(guildId: string): Promise<{ success: boolean; message: string }> {
    const tournament = await Tournament.findOne({
      guildId,
      status: { $in: ['registration', 'in_progress'] },
    });

    if (!tournament) {
      return { success: false, message: 'Nao ha torneio ativo para cancelar.' };
    }

    // Refund entry fees
    if (tournament.entryFee > 0) {
      for (const participant of tournament.participants) {
        await economyService.addCoins(
          participant.discordId,
          tournament.entryFee,
          `Reembolso cancelamento: ${tournament.name}`
        );
      }
    }

    tournament.status = 'cancelled';
    tournament.completedAt = new Date();
    await tournament.save();

    return {
      success: true,
      message: `Torneio **${tournament.name}** cancelado.${tournament.entryFee > 0 ? ' Taxas reembolsadas.' : ''}`,
    };
  }

  /**
   * Get tournament history
   */
  async getTournamentHistory(guildId: string, limit: number = 10): Promise<ITournament[]> {
    return Tournament.find({
      guildId,
      status: { $in: ['completed', 'cancelled'] },
    })
      .sort({ completedAt: -1 })
      .limit(limit);
  }

  /**
   * Shuffle array in place
   */
  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  /**
   * Get bracket visualization
   */
  getBracketVisualization(tournament: ITournament): string {
    const lines: string[] = [];

    for (let round = 1; round <= tournament.totalRounds; round++) {
      lines.push(`\n**Round ${round}${round === tournament.totalRounds ? ' (Final)' : ''}:**`);

      const roundMatches = tournament.matches
        .filter(m => m.round === round)
        .sort((a, b) => a.bracketPosition - b.bracketPosition);

      for (const match of roundMatches) {
        const p1 = tournament.participants.find(p => p.discordId === match.player1Id);
        const p2 = tournament.participants.find(p => p.discordId === match.player2Id);

        const p1Name = p1?.username || 'TBD';
        const p2Name = p2?.username || (match.status === 'bye' ? 'BYE' : 'TBD');

        let statusIcon = '⏳';
        if (match.status === 'completed') statusIcon = '✅';
        if (match.status === 'bye') statusIcon = '🔄';
        if (match.status === 'in_progress') statusIcon = '⚔️';

        const winner = match.winnerId ? (p1?.discordId === match.winnerId ? p1Name : p2Name) : '';

        lines.push(`${statusIcon} ${p1Name} vs ${p2Name}${winner ? ` → **${winner}**` : ''}`);
      }
    }

    return lines.join('\n');
  }
}

export const tournamentService = new TournamentService();
export default tournamentService;
