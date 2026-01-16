// Serviço de Arena PvP Ranqueada
import { v4 as uuidv4 } from 'uuid';
import {
  ArenaSeason,
  ArenaPlayer,
  ArenaMatch,
  IArenaPlayer,
  IArenaMatch,
} from '../database/models/Arena';
import { Character, User, Equipment, CharacterInventory } from '../database/models';
import {
  ArenaRank,
  getRankByRating,
  calculateKFactor,
  calculateRatingChange,
  simulateCombat,
  CombatantStats,
  CombatResult,
  RATING_CONFIG,
  MATCHMAKING_CONFIG,
  ARENA_RANKS,
} from '../data/arena';
import { logger } from '../utils/logger';

// Fila de matchmaking em memória
interface QueueEntry {
  discordId: string;
  username: string;
  rating: number;
  joinedAt: number;
  expandedRange: number;
}

const matchmakingQueue: Map<string, QueueEntry> = new Map();

export interface ArenaProfileData {
  player: IArenaPlayer | null;
  rank: typeof ARENA_RANKS[ArenaRank];
  position: number;
  seasonName: string;
  winRate: number;
  matchesToNextRank: number | null;
  isPlacement: boolean;
  placementMatchesLeft: number;
}

export interface MatchResult {
  success: boolean;
  message: string;
  match?: IArenaMatch;
  combatLog?: string[];
  ratingChange?: {
    winner: { before: number; after: number; change: number };
    loser: { before: number; after: number; change: number };
  };
  rankUp?: { player: string; newRank: string };
  rankDown?: { player: string; newRank: string };
}

export interface QueueResult {
  success: boolean;
  message: string;
  status?: 'queued' | 'matched' | 'already_in_queue';
  opponent?: {
    discordId: string;
    username: string;
    rating: number;
  };
  estimatedWait?: number;
}

class ArenaService {
  // Obter ou criar season atual
  async getCurrentSeason(): Promise<{ seasonId: string; name: string } | null> {
    let season = await ArenaSeason.findOne({ isActive: true });

    if (!season) {
      // Criar season padrão se não existir
      const seasonNumber = await ArenaSeason.countDocuments() + 1;
      const now = new Date();
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 1); // Season de 1 mês

      season = new ArenaSeason({
        seasonId: `season_${seasonNumber}`,
        seasonNumber,
        name: `Temporada ${seasonNumber}`,
        startDate: now,
        endDate,
        isActive: true,
        rewards: Object.values(ARENA_RANKS).map(rank => ({
          rank: rank.rankId,
          minRating: rank.minRating,
          coins: rank.seasonRewards.coins,
          materials: rank.seasonRewards.materials,
          title: rank.seasonRewards.title,
        })),
        topPlayers: [],
      });

      await season.save();
      logger.info(`Created new arena season: ${season.name}`);
    }

    return { seasonId: season.seasonId, name: season.name };
  }

  // Obter ou criar perfil de arena do jogador
  async getOrCreateArenaPlayer(discordId: string): Promise<IArenaPlayer> {
    const season = await this.getCurrentSeason();
    if (!season) {
      throw new Error('Nenhuma temporada ativa');
    }

    let player = await ArenaPlayer.findOne({ discordId, seasonId: season.seasonId });

    if (!player) {
      player = new ArenaPlayer({
        discordId,
        seasonId: season.seasonId,
        rating: RATING_CONFIG.initialRating,
        rank: 'silver', // Começa em prata (1000 rating)
        wins: 0,
        losses: 0,
        winStreak: 0,
        bestWinStreak: 0,
        matchesPlayed: 0,
        peakRating: RATING_CONFIG.initialRating,
      });
      await player.save();
    }

    return player;
  }

  // Obter perfil completo de arena
  async getArenaProfile(discordId: string): Promise<ArenaProfileData | null> {
    const season = await this.getCurrentSeason();
    if (!season) return null;

    const player = await this.getOrCreateArenaPlayer(discordId);
    const rank = getRankByRating(player.rating);

    // Calcular posição no ranking
    const position = await ArenaPlayer.countDocuments({
      seasonId: season.seasonId,
      rating: { $gt: player.rating },
    }) + 1;

    // Calcular win rate
    const winRate = player.matchesPlayed > 0
      ? Math.round((player.wins / player.matchesPlayed) * 100)
      : 0;

    // Verificar se está em placement
    const isPlacement = player.matchesPlayed < RATING_CONFIG.placementMatches;
    const placementMatchesLeft = Math.max(0, RATING_CONFIG.placementMatches - player.matchesPlayed);

    // Calcular partidas para próximo rank
    const nextRank = this.getNextRank(rank.rankId);
    let matchesToNextRank: number | null = null;
    if (nextRank) {
      const ratingNeeded = nextRank.minRating - player.rating;
      // Assumindo ganho médio de 25 rating por vitória
      matchesToNextRank = Math.ceil(ratingNeeded / 25);
    }

    return {
      player,
      rank,
      position,
      seasonName: season.name,
      winRate,
      matchesToNextRank,
      isPlacement,
      placementMatchesLeft,
    };
  }

  // Entrar na fila de matchmaking
  async joinQueue(discordId: string, username: string): Promise<QueueResult> {
    // Verificar se já está na fila
    if (matchmakingQueue.has(discordId)) {
      return {
        success: false,
        message: 'Você já está na fila de matchmaking.',
        status: 'already_in_queue',
      };
    }

    // Verificar cooldown
    const player = await this.getOrCreateArenaPlayer(discordId);
    if (player.lastMatchAt) {
      const timeSinceLastMatch = Date.now() - player.lastMatchAt.getTime();
      if (timeSinceLastMatch < MATCHMAKING_CONFIG.matchCooldown) {
        const remaining = MATCHMAKING_CONFIG.matchCooldown - timeSinceLastMatch;
        return {
          success: false,
          message: `Aguarde ${Math.ceil(remaining / 1000)} segundos antes de entrar na fila novamente.`,
        };
      }
    }

    // Verificar se tem personagem válido
    const character = await Character.findOne({ discordId });
    if (!character || character.level < 10) {
      return {
        success: false,
        message: 'Você precisa de um personagem nível 10+ para participar da arena.',
      };
    }

    // Adicionar à fila
    const queueEntry: QueueEntry = {
      discordId,
      username,
      rating: player.rating,
      joinedAt: Date.now(),
      expandedRange: 0,
    };

    matchmakingQueue.set(discordId, queueEntry);

    // Tentar encontrar oponente
    const opponent = this.findOpponent(discordId, player.rating);

    if (opponent) {
      // Match encontrado!
      matchmakingQueue.delete(discordId);
      matchmakingQueue.delete(opponent.discordId);

      return {
        success: true,
        message: 'Oponente encontrado!',
        status: 'matched',
        opponent: {
          discordId: opponent.discordId,
          username: opponent.username,
          rating: opponent.rating,
        },
      };
    }

    return {
      success: true,
      message: 'Você entrou na fila de matchmaking. Aguardando oponente...',
      status: 'queued',
      estimatedWait: 30000, // 30s estimado
    };
  }

  // Sair da fila
  leaveQueue(discordId: string): boolean {
    return matchmakingQueue.delete(discordId);
  }

  // Verificar se está na fila
  isInQueue(discordId: string): boolean {
    return matchmakingQueue.has(discordId);
  }

  // Encontrar oponente na fila
  private findOpponent(discordId: string, rating: number): QueueEntry | null {
    const myEntry = matchmakingQueue.get(discordId);
    if (!myEntry) return null;

    let bestMatch: QueueEntry | null = null;
    let smallestDiff = Infinity;

    for (const [opponentId, entry] of matchmakingQueue.entries()) {
      if (opponentId === discordId) continue;

      const ratingDiff = Math.abs(rating - entry.rating);
      const maxDiff = MATCHMAKING_CONFIG.maxRatingDifference +
        Math.max(myEntry.expandedRange, entry.expandedRange);

      if (ratingDiff <= maxDiff && ratingDiff < smallestDiff) {
        smallestDiff = ratingDiff;
        bestMatch = entry;
      }
    }

    return bestMatch;
  }

  // Expandir range de busca
  expandQueueRange(discordId: string): void {
    const entry = matchmakingQueue.get(discordId);
    if (entry) {
      entry.expandedRange = Math.min(
        entry.expandedRange + MATCHMAKING_CONFIG.expandAmount,
        MATCHMAKING_CONFIG.maxExpandedDifference - MATCHMAKING_CONFIG.maxRatingDifference
      );
    }
  }

  // Iniciar partida
  async startMatch(player1Id: string, player2Id: string): Promise<MatchResult> {
    const season = await this.getCurrentSeason();
    if (!season) {
      return { success: false, message: 'Nenhuma temporada ativa.' };
    }

    // Obter dados dos jogadores
    const [player1Data, player2Data] = await Promise.all([
      this.getPlayerCombatData(player1Id),
      this.getPlayerCombatData(player2Id),
    ]);

    if (!player1Data || !player2Data) {
      return { success: false, message: 'Erro ao carregar dados dos jogadores.' };
    }

    const [arenaPlayer1, arenaPlayer2] = await Promise.all([
      this.getOrCreateArenaPlayer(player1Id),
      this.getOrCreateArenaPlayer(player2Id),
    ]);

    // Simular combate
    const combatResult = simulateCombat(player1Data.stats, player2Data.stats);

    // Calcular mudança de rating
    const winnerArenaPlayer = combatResult.winnerId === player1Id ? arenaPlayer1 : arenaPlayer2;
    const loserArenaPlayer = combatResult.winnerId === player1Id ? arenaPlayer2 : arenaPlayer1;

    const winnerK = calculateKFactor(winnerArenaPlayer.rating, winnerArenaPlayer.matchesPlayed);
    const { winnerGain, loserLoss } = calculateRatingChange(
      winnerArenaPlayer.rating,
      loserArenaPlayer.rating,
      winnerK,
      winnerArenaPlayer.winStreak
    );

    // Atualizar ratings
    const winnerOldRating = winnerArenaPlayer.rating;
    const loserOldRating = loserArenaPlayer.rating;

    winnerArenaPlayer.rating += winnerGain;
    winnerArenaPlayer.wins += 1;
    winnerArenaPlayer.winStreak += 1;
    winnerArenaPlayer.bestWinStreak = Math.max(winnerArenaPlayer.bestWinStreak, winnerArenaPlayer.winStreak);
    winnerArenaPlayer.matchesPlayed += 1;
    winnerArenaPlayer.lastMatchAt = new Date();
    winnerArenaPlayer.peakRating = Math.max(winnerArenaPlayer.peakRating, winnerArenaPlayer.rating);

    loserArenaPlayer.rating = Math.max(RATING_CONFIG.minRating, loserArenaPlayer.rating - loserLoss);
    loserArenaPlayer.losses += 1;
    loserArenaPlayer.winStreak = 0;
    loserArenaPlayer.matchesPlayed += 1;
    loserArenaPlayer.lastMatchAt = new Date();

    // Atualizar ranks
    const winnerNewRank = getRankByRating(winnerArenaPlayer.rating);
    const loserNewRank = getRankByRating(loserArenaPlayer.rating);

    const winnerOldRank = winnerArenaPlayer.rank;
    const loserOldRank = loserArenaPlayer.rank;

    winnerArenaPlayer.rank = winnerNewRank.rankId;
    loserArenaPlayer.rank = loserNewRank.rankId;

    await Promise.all([winnerArenaPlayer.save(), loserArenaPlayer.save()]);

    // Criar registro de partida
    const matchId = uuidv4();
    const match = new ArenaMatch({
      matchId,
      seasonId: season.seasonId,
      player1: {
        discordId: player1Id,
        username: player1Data.username,
        ratingBefore: player1Id === combatResult.winnerId ? winnerOldRating : loserOldRating,
        ratingAfter: player1Id === combatResult.winnerId ? winnerArenaPlayer.rating : loserArenaPlayer.rating,
        character: {
          class: player1Data.className,
          level: player1Data.level,
          totalStats: player1Data.stats,
        },
      },
      player2: {
        discordId: player2Id,
        username: player2Data.username,
        ratingBefore: player2Id === combatResult.winnerId ? winnerOldRating : loserOldRating,
        ratingAfter: player2Id === combatResult.winnerId ? winnerArenaPlayer.rating : loserArenaPlayer.rating,
        character: {
          class: player2Data.className,
          level: player2Data.level,
          totalStats: player2Data.stats,
        },
      },
      winnerId: combatResult.winnerId,
      loserId: combatResult.loserId,
      rounds: combatResult.rounds,
      totalRounds: combatResult.totalRounds,
      ratingChange: winnerGain,
    });

    await match.save();

    // Gerar log de combate simplificado
    const combatLog = this.generateCombatLog(combatResult, player1Data, player2Data);

    logger.info(`Arena match completed: ${player1Data.username} vs ${player2Data.username}, winner: ${combatResult.winnerId}`);

    // Verificar rank up/down
    let rankUp: { player: string; newRank: string } | undefined;
    let rankDown: { player: string; newRank: string } | undefined;

    if (winnerNewRank.rankId !== winnerOldRank) {
      rankUp = {
        player: combatResult.winnerId === player1Id ? player1Data.username : player2Data.username,
        newRank: winnerNewRank.name,
      };
    }

    if (loserNewRank.rankId !== loserOldRank) {
      rankDown = {
        player: combatResult.loserId === player1Id ? player1Data.username : player2Data.username,
        newRank: loserNewRank.name,
      };
    }

    return {
      success: true,
      message: 'Partida concluída!',
      match,
      combatLog,
      ratingChange: {
        winner: {
          before: winnerOldRating,
          after: winnerArenaPlayer.rating,
          change: winnerGain,
        },
        loser: {
          before: loserOldRating,
          after: loserArenaPlayer.rating,
          change: -loserLoss,
        },
      },
      rankUp,
      rankDown,
    };
  }

  // Obter dados de combate do jogador
  private async getPlayerCombatData(discordId: string): Promise<{
    username: string;
    className: string;
    level: number;
    stats: CombatantStats;
  } | null> {
    const character = await Character.findOne({ discordId });
    const user = await User.findOne({ discordId });

    if (!character || !user) return null;

    // Obter equipamentos equipados
    const equipments = await Equipment.find({ discordId, equipped: true });

    // Calcular stats totais
    let totalAttack = character.stats.attack;
    let totalDefense = character.stats.defense;
    let totalHp = character.stats.hp;
    let totalCritChance = 5; // Base
    let totalCritDamage = 50; // Base 50%
    let totalEvasion = 0;
    let totalLifesteal = 0;

    for (const eq of equipments) {
      totalAttack += eq.stats.attack || 0;
      totalDefense += eq.stats.defense || 0;
      totalHp += eq.stats.hp || 0;
      totalCritChance += eq.stats.critChance || 0;
      totalCritDamage += eq.stats.critDamage || 0;
      totalEvasion += eq.stats.evasion || 0;
      totalLifesteal += eq.stats.lifesteal || 0;
    }

    return {
      username: user.username,
      className: character.class,
      level: character.level,
      stats: {
        discordId,
        hp: totalHp,
        maxHp: totalHp,
        attack: totalAttack,
        defense: totalDefense,
        critChance: totalCritChance,
        critDamage: totalCritDamage,
        evasion: totalEvasion,
        lifesteal: totalLifesteal,
      },
    };
  }

  // Gerar log de combate
  private generateCombatLog(
    result: CombatResult,
    player1Data: { username: string; stats: CombatantStats },
    player2Data: { username: string; stats: CombatantStats }
  ): string[] {
    const log: string[] = [];
    const getName = (id: string) =>
      id === player1Data.stats.discordId ? player1Data.username : player2Data.username;

    // Mostrar apenas últimos 5 rounds
    const displayRounds = result.rounds.slice(-5);

    for (const round of displayRounds) {
      const attackerName = getName(round.attacker);
      const defenderName = getName(round.defender);

      if (round.wasEvaded) {
        log.push(`Round ${round.roundNumber}: ${defenderName} desviou do ataque de ${attackerName}!`);
      } else {
        let text = `Round ${round.roundNumber}: ${attackerName} causou **${round.damage}** de dano`;
        if (round.isCrit) text += ' ⚡CRÍTICO!';
        if (round.lifestealHealed > 0) text += ` (+${round.lifestealHealed} HP roubado)`;
        log.push(text);
      }
    }

    log.push(`---`);
    log.push(`**${getName(result.winnerId)}** venceu em ${result.totalRounds} rounds!`);

    return log;
  }

  // Obter ranking
  async getLeaderboard(limit: number = 10): Promise<Array<{
    position: number;
    discordId: string;
    rating: number;
    rank: string;
    wins: number;
    losses: number;
    winRate: number;
  }>> {
    const season = await this.getCurrentSeason();
    if (!season) return [];

    const players = await ArenaPlayer.find({ seasonId: season.seasonId })
      .sort({ rating: -1 })
      .limit(limit);

    return players.map((p, index) => ({
      position: index + 1,
      discordId: p.discordId,
      rating: p.rating,
      rank: getRankByRating(p.rating).name,
      wins: p.wins,
      losses: p.losses,
      winRate: p.matchesPlayed > 0 ? Math.round((p.wins / p.matchesPlayed) * 100) : 0,
    }));
  }

  // Obter histórico de partidas
  async getMatchHistory(discordId: string, limit: number = 10): Promise<IArenaMatch[]> {
    const season = await this.getCurrentSeason();
    if (!season) return [];

    return ArenaMatch.find({
      seasonId: season.seasonId,
      $or: [
        { 'player1.discordId': discordId },
        { 'player2.discordId': discordId },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  // Obter próximo rank
  private getNextRank(currentRank: ArenaRank): typeof ARENA_RANKS[ArenaRank] | null {
    const ranks = Object.values(ARENA_RANKS);
    const currentIndex = ranks.findIndex(r => r.rankId === currentRank);

    if (currentIndex < ranks.length - 1) {
      return ranks[currentIndex + 1];
    }
    return null;
  }

  // Obter tamanho da fila
  getQueueSize(): number {
    return matchmakingQueue.size;
  }

  // Limpar fila (para manutenção)
  clearQueue(): void {
    matchmakingQueue.clear();
  }
}

export const arenaService = new ArenaService();
export default arenaService;
