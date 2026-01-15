import { Mission, MissionDocument } from '../models';
import { MissionPeriod, MissionType } from '../../types';

export class MissionRepository {
  /**
   * Create a new mission
   */
  async create(data: {
    id: string;
    name: string;
    description: string;
    type: MissionType;
    period: MissionPeriod;
    target: number;
    xpReward?: number;
    coinsReward?: number;
  }): Promise<MissionDocument> {
    return Mission.create(data);
  }

  /**
   * Find mission by ID
   */
  async findById(id: string): Promise<MissionDocument | null> {
    return Mission.findOne({ id });
  }

  /**
   * Find all active missions by period
   */
  async findByPeriod(period: MissionPeriod): Promise<MissionDocument[]> {
    return Mission.find({ period, active: true });
  }

  /**
   * Find random missions by period
   */
  async findRandomByPeriod(period: MissionPeriod, count: number): Promise<MissionDocument[]> {
    return Mission.aggregate([
      { $match: { period, active: true } },
      { $sample: { size: count } },
    ]);
  }

  /**
   * Find all missions
   */
  async findAll(): Promise<MissionDocument[]> {
    return Mission.find().sort({ period: 1, name: 1 });
  }

  /**
   * Update mission
   */
  async update(id: string, updates: Partial<{
    name: string;
    description: string;
    target: number;
    xpReward: number;
    coinsReward: number;
    active: boolean;
  }>): Promise<MissionDocument | null> {
    return Mission.findOneAndUpdate({ id }, updates, { new: true });
  }

  /**
   * Delete mission
   */
  async delete(id: string): Promise<boolean> {
    const result = await Mission.deleteOne({ id });
    return result.deletedCount > 0;
  }

  /**
   * Initialize default missions
   */
  async initializeDefaults(): Promise<void> {
    const defaultMissions = [
      // Daily missions
      {
        id: 'daily_messages_20',
        name: 'Mensageiro',
        description: 'Envie 20 mensagens',
        type: 'send_messages' as MissionType,
        period: 'daily' as MissionPeriod,
        target: 20,
        xpReward: 50,
        coinsReward: 25,
      },
      {
        id: 'daily_messages_50',
        name: 'Comunicador',
        description: 'Envie 50 mensagens',
        type: 'send_messages' as MissionType,
        period: 'daily' as MissionPeriod,
        target: 50,
        xpReward: 100,
        coinsReward: 50,
      },
      {
        id: 'daily_voice_15',
        name: 'Presenca',
        description: 'Fique 15 minutos em call',
        type: 'voice_minutes' as MissionType,
        period: 'daily' as MissionPeriod,
        target: 15,
        xpReward: 50,
        coinsReward: 25,
      },
      {
        id: 'daily_voice_30',
        name: 'Social',
        description: 'Fique 30 minutos em call',
        type: 'voice_minutes' as MissionType,
        period: 'daily' as MissionPeriod,
        target: 30,
        xpReward: 100,
        coinsReward: 50,
      },
      {
        id: 'daily_reactions_10',
        name: 'Reativo',
        description: 'De 10 reacoes',
        type: 'give_reactions' as MissionType,
        period: 'daily' as MissionPeriod,
        target: 10,
        xpReward: 30,
        coinsReward: 15,
      },
      {
        id: 'daily_reactions_20',
        name: 'Expressivo',
        description: 'De 20 reacoes',
        type: 'give_reactions' as MissionType,
        period: 'daily' as MissionPeriod,
        target: 20,
        xpReward: 60,
        coinsReward: 30,
      },
      {
        id: 'daily_reply_5',
        name: 'Colaborador',
        description: 'Responda 5 mensagens',
        type: 'reply_messages' as MissionType,
        period: 'daily' as MissionPeriod,
        target: 5,
        xpReward: 40,
        coinsReward: 20,
      },
      {
        id: 'daily_command',
        name: 'Interativo',
        description: 'Use um comando do bot',
        type: 'use_command' as MissionType,
        period: 'daily' as MissionPeriod,
        target: 1,
        xpReward: 20,
        coinsReward: 10,
      },
      // Weekly missions
      {
        id: 'weekly_messages_300',
        name: 'Tagarela',
        description: 'Envie 300 mensagens esta semana',
        type: 'send_messages' as MissionType,
        period: 'weekly' as MissionPeriod,
        target: 300,
        xpReward: 300,
        coinsReward: 150,
      },
      {
        id: 'weekly_messages_500',
        name: 'Influencer',
        description: 'Envie 500 mensagens esta semana',
        type: 'send_messages' as MissionType,
        period: 'weekly' as MissionPeriod,
        target: 500,
        xpReward: 500,
        coinsReward: 250,
      },
      {
        id: 'weekly_voice_180',
        name: 'Habitante',
        description: 'Fique 3 horas em call esta semana',
        type: 'voice_minutes' as MissionType,
        period: 'weekly' as MissionPeriod,
        target: 180,
        xpReward: 300,
        coinsReward: 150,
      },
      {
        id: 'weekly_voice_300',
        name: 'Morador',
        description: 'Fique 5 horas em call esta semana',
        type: 'voice_minutes' as MissionType,
        period: 'weekly' as MissionPeriod,
        target: 300,
        xpReward: 500,
        coinsReward: 250,
      },
      {
        id: 'weekly_reactions_100',
        name: 'Apoiador',
        description: 'De 100 reacoes esta semana',
        type: 'give_reactions' as MissionType,
        period: 'weekly' as MissionPeriod,
        target: 100,
        xpReward: 200,
        coinsReward: 100,
      },
      {
        id: 'weekly_daily_5',
        name: 'Consistente',
        description: 'Colete daily 5 dias seguidos',
        type: 'collect_daily' as MissionType,
        period: 'weekly' as MissionPeriod,
        target: 5,
        xpReward: 400,
        coinsReward: 200,
      },
      {
        id: 'weekly_daily_7',
        name: 'Dedicado',
        description: 'Colete daily todos os dias da semana',
        type: 'collect_daily' as MissionType,
        period: 'weekly' as MissionPeriod,
        target: 7,
        xpReward: 600,
        coinsReward: 300,
      },
      {
        id: 'weekly_leaderboard_10',
        name: 'Competidor',
        description: 'Alcance top 10 do leaderboard diario',
        type: 'reach_leaderboard' as MissionType,
        period: 'weekly' as MissionPeriod,
        target: 10,
        xpReward: 400,
        coinsReward: 200,
      },
      // Achievement missions (one-time)
      {
        id: 'achievement_first_message',
        name: 'Primeiro Oi',
        description: 'Envie sua primeira mensagem',
        type: 'send_messages' as MissionType,
        period: 'achievement' as MissionPeriod,
        target: 1,
        xpReward: 50,
        coinsReward: 25,
      },
      {
        id: 'achievement_first_hour_voice',
        name: 'Primeira Hora',
        description: 'Fique 1 hora em call',
        type: 'voice_minutes' as MissionType,
        period: 'achievement' as MissionPeriod,
        target: 60,
        xpReward: 100,
        coinsReward: 50,
      },
      {
        id: 'achievement_100_messages',
        name: 'Centenario',
        description: 'Envie 100 mensagens no total',
        type: 'send_messages' as MissionType,
        period: 'achievement' as MissionPeriod,
        target: 100,
        xpReward: 150,
        coinsReward: 75,
      },
      {
        id: 'achievement_1000_messages',
        name: 'Milionario de Palavras',
        description: 'Envie 1000 mensagens no total',
        type: 'send_messages' as MissionType,
        period: 'achievement' as MissionPeriod,
        target: 1000,
        xpReward: 500,
        coinsReward: 250,
      },
    ];

    for (const mission of defaultMissions) {
      const exists = await this.findById(mission.id);
      if (!exists) {
        await this.create(mission);
      }
    }
  }
}

export const missionRepository = new MissionRepository();
export default missionRepository;
