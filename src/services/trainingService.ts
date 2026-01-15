import { trainingRepository } from '../database/repositories/trainingRepository';
import { userRepository } from '../database/repositories/userRepository';
import { TrainingDocument, TrainingType } from '../database/models/Training';
import { logger } from '../utils/logger';

export interface TrainingInfo {
  id: TrainingType;
  name: string;
  emoji: string;
  description: string;
  xpPerMinute: number;
  category: 'physical' | 'mental' | 'combat';
}

const TRAINING_TYPES: TrainingInfo[] = [
  { id: 'punch_tree', name: 'Socar Arvore', emoji: '🥊', description: 'Treina forca socando arvores', xpPerMinute: 0.5, category: 'combat' },
  { id: 'kick_tree', name: 'Chutar Arvore', emoji: '🦶', description: 'Treina pernas chutando arvores', xpPerMinute: 0.5, category: 'combat' },
  { id: 'chop_tree', name: 'Cortar Arvore', emoji: '🪓', description: 'Treina resistencia cortando arvores', xpPerMinute: 0.6, category: 'physical' },
  { id: 'mine_rock', name: 'Minerar Pedra', emoji: '⛏️', description: 'Treina forca minerando pedras', xpPerMinute: 0.7, category: 'physical' },
  { id: 'meditate', name: 'Meditar', emoji: '🧘', description: 'Treina mente e espirito', xpPerMinute: 0.4, category: 'mental' },
  { id: 'run', name: 'Correr', emoji: '🏃', description: 'Treina velocidade e resistencia', xpPerMinute: 0.5, category: 'physical' },
  { id: 'swim', name: 'Nadar', emoji: '🏊', description: 'Treina corpo inteiro', xpPerMinute: 0.6, category: 'physical' },
  { id: 'climb', name: 'Escalar', emoji: '🧗', description: 'Treina forca e agilidade', xpPerMinute: 0.8, category: 'combat' },
];

class TrainingService {
  getTrainingTypes(): TrainingInfo[] {
    return TRAINING_TYPES;
  }

  getTrainingInfo(type: TrainingType): TrainingInfo | undefined {
    return TRAINING_TYPES.find(t => t.id === type);
  }

  async startTraining(discordId: string, type: TrainingType): Promise<{ success: boolean; message: string }> {
    const info = this.getTrainingInfo(type);
    if (!info) {
      return { success: false, message: 'Tipo de treinamento invalido.' };
    }

    const active = await trainingRepository.getActiveTraining(discordId);
    if (active) {
      const activeInfo = this.getTrainingInfo(active.trainingType);
      return { success: false, message: `Voce ja esta treinando ${activeInfo?.emoji} ${activeInfo?.name}. Pare antes de iniciar outro.` };
    }

    await trainingRepository.startTraining(discordId, type);
    logger.info(`User ${discordId} started training: ${type}`);

    return { success: true, message: `Voce comecou a treinar ${info.emoji} **${info.name}**!\n\nUse \`/treinar coletar\` para coletar XP acumulado.` };
  }

  async stopTraining(discordId: string): Promise<{ success: boolean; message: string; xp?: number }> {
    const active = await trainingRepository.getActiveTraining(discordId);
    if (!active) {
      return { success: false, message: 'Voce nao esta treinando.' };
    }

    // Calculate and collect remaining XP
    const { xp } = await this.calculatePendingXP(active);
    if (xp > 0) {
      await userRepository.addXP(discordId, xp, 'bonus');
    }

    await trainingRepository.stopTraining(discordId);
    const info = this.getTrainingInfo(active.trainingType);

    return {
      success: true,
      message: `Treinamento ${info?.emoji} **${info?.name}** finalizado!\nXP final coletado: **+${xp}**`,
      xp,
    };
  }

  async collectXP(discordId: string): Promise<{ success: boolean; message: string; xp?: number; minutes?: number }> {
    const active = await trainingRepository.getActiveTraining(discordId);
    if (!active) {
      return { success: false, message: 'Voce nao esta treinando. Use `/treinar iniciar` primeiro.' };
    }

    const { xp, minutes } = await this.calculatePendingXP(active);

    if (xp <= 0) {
      return { success: false, message: 'Ainda nao ha XP para coletar. Aguarde alguns minutos.' };
    }

    // Give XP to user
    await userRepository.addXP(discordId, xp, 'bonus');
    await trainingRepository.collectXP(discordId, xp, minutes);

    const info = this.getTrainingInfo(active.trainingType);

    return {
      success: true,
      message: `${info?.emoji} **${info?.name}**\n\nVoce coletou **+${xp} XP** (${minutes} minutos de treino)!`,
      xp,
      minutes,
    };
  }

  async getStatus(discordId: string): Promise<{
    active: TrainingDocument | null;
    info: TrainingInfo | null;
    pendingXP: number;
    pendingMinutes: number;
    totalMinutes: number;
    totalXP: number;
  }> {
    const active = await trainingRepository.getActiveTraining(discordId);
    const totalMinutes = await trainingRepository.getTotalTrainingTime(discordId);

    if (!active) {
      return { active: null, info: null, pendingXP: 0, pendingMinutes: 0, totalMinutes, totalXP: 0 };
    }

    const info = this.getTrainingInfo(active.trainingType) || null;
    const { xp, minutes } = await this.calculatePendingXP(active);

    return {
      active,
      info,
      pendingXP: xp,
      pendingMinutes: minutes,
      totalMinutes,
      totalXP: active.xpEarned,
    };
  }

  private async calculatePendingXP(training: TrainingDocument): Promise<{ xp: number; minutes: number }> {
    const info = this.getTrainingInfo(training.trainingType);
    if (!info) return { xp: 0, minutes: 0 };

    const now = new Date();
    const lastCollected = new Date(training.lastCollected);
    const diffMs = now.getTime() - lastCollected.getTime();
    const minutes = Math.floor(diffMs / (1000 * 60));

    // Cap at 8 hours (480 minutes) to prevent AFK abuse
    const cappedMinutes = Math.min(minutes, 480);
    const xp = Math.floor(cappedMinutes * info.xpPerMinute);

    return { xp, minutes: cappedMinutes };
  }

  async getAllUserTrainings(discordId: string): Promise<TrainingDocument[]> {
    return trainingRepository.getAllTrainings(discordId);
  }
}

export const trainingService = new TrainingService();
export default trainingService;
