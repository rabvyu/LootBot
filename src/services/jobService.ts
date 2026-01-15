import { jobRepository } from '../database/repositories/jobRepository';
import { economyRepository } from '../database/repositories/economyRepository';
import { JobDocument, JobType } from '../database/models/Job';
import { logger } from '../utils/logger';

export interface JobInfo {
  id: JobType;
  name: string;
  emoji: string;
  description: string;
  coinsPerShift: { min: number; max: number };
  shiftDurationMinutes: number;
  requiredLevel?: number;
}

const JOB_TYPES: JobInfo[] = [
  { id: 'taverneiro', name: 'Taverneiro', emoji: '🍺', description: 'Serve bebidas na taverna', coinsPerShift: { min: 30, max: 50 }, shiftDurationMinutes: 30 },
  { id: 'limpador', name: 'Limpador de Esterco', emoji: '💩', description: 'Limpa os estabalos', coinsPerShift: { min: 40, max: 60 }, shiftDurationMinutes: 20 },
  { id: 'mensageiro', name: 'Mensageiro', emoji: '📬', description: 'Entrega cartas e pacotes', coinsPerShift: { min: 35, max: 55 }, shiftDurationMinutes: 25 },
  { id: 'guarda', name: 'Guarda Noturno', emoji: '🛡️', description: 'Vigia durante a noite', coinsPerShift: { min: 50, max: 80 }, shiftDurationMinutes: 60 },
  { id: 'ferreiro', name: 'Ajudante de Ferreiro', emoji: '⚒️', description: 'Ajuda o ferreiro local', coinsPerShift: { min: 60, max: 100 }, shiftDurationMinutes: 45, requiredLevel: 5 },
  { id: 'pescador', name: 'Pescador', emoji: '🎣', description: 'Pesca no rio', coinsPerShift: { min: 45, max: 75 }, shiftDurationMinutes: 40 },
  { id: 'lenhador', name: 'Lenhador', emoji: '🪓', description: 'Corta arvores na floresta', coinsPerShift: { min: 55, max: 85 }, shiftDurationMinutes: 35, requiredLevel: 3 },
  { id: 'mineiro', name: 'Mineiro', emoji: '⛏️', description: 'Trabalha nas minas', coinsPerShift: { min: 70, max: 120 }, shiftDurationMinutes: 50, requiredLevel: 10 },
  { id: 'fazendeiro', name: 'Fazendeiro', emoji: '🌾', description: 'Cuida da fazenda', coinsPerShift: { min: 50, max: 70 }, shiftDurationMinutes: 45 },
  { id: 'cozinheiro', name: 'Cozinheiro', emoji: '👨‍🍳', description: 'Cozinha na taverna', coinsPerShift: { min: 55, max: 90 }, shiftDurationMinutes: 40, requiredLevel: 5 },
];

class JobService {
  getJobTypes(): JobInfo[] {
    return JOB_TYPES;
  }

  getJobInfo(type: JobType): JobInfo | undefined {
    return JOB_TYPES.find(j => j.id === type);
  }

  async startJob(discordId: string, type: JobType, userLevel: number = 1): Promise<{ success: boolean; message: string }> {
    const info = this.getJobInfo(type);
    if (!info) {
      return { success: false, message: 'Trabalho invalido.' };
    }

    if (info.requiredLevel && userLevel < info.requiredLevel) {
      return { success: false, message: `Voce precisa ser nivel ${info.requiredLevel} para este trabalho.` };
    }

    const current = await jobRepository.getJob(discordId);
    if (current?.currentJob) {
      const currentInfo = this.getJobInfo(current.currentJob);
      return { success: false, message: `Voce ja trabalha como ${currentInfo?.emoji} ${currentInfo?.name}. Saia primeiro com \`/trabalho sair\`.` };
    }

    await jobRepository.startJob(discordId, type);
    logger.info(`User ${discordId} started job: ${type}`);

    return {
      success: true,
      message: `Voce comecou a trabalhar como ${info.emoji} **${info.name}**!\n\n` +
        `Turno: ${info.shiftDurationMinutes} minutos\n` +
        `Pagamento: ${info.coinsPerShift.min}-${info.coinsPerShift.max} coins\n\n` +
        `Use \`/trabalho turno\` para completar seu turno.`,
    };
  }

  async completeShift(discordId: string): Promise<{ success: boolean; message: string; coins?: number }> {
    const job = await jobRepository.getJob(discordId);
    if (!job?.currentJob) {
      return { success: false, message: 'Voce nao tem um trabalho. Use `/trabalho lista` para ver opcoes.' };
    }

    const info = this.getJobInfo(job.currentJob);
    if (!info) {
      return { success: false, message: 'Trabalho invalido.' };
    }

    // Check cooldown
    if (job.lastShiftEnd) {
      const cooldownMs = info.shiftDurationMinutes * 60 * 1000;
      const timeSinceLastShift = Date.now() - new Date(job.lastShiftEnd).getTime();

      if (timeSinceLastShift < cooldownMs) {
        const remainingMs = cooldownMs - timeSinceLastShift;
        const remainingMins = Math.ceil(remainingMs / (60 * 1000));
        return { success: false, message: `Seu turno ainda nao terminou. Aguarde ${remainingMins} minutos.` };
      }
    }

    // Calculate earnings
    const coins = this.randomBetween(info.coinsPerShift.min, info.coinsPerShift.max);

    // Give coins
    await economyRepository.addCoins(discordId, coins, 'job', `Trabalho: ${info.name}`);
    await jobRepository.endShift(discordId, coins);

    return {
      success: true,
      message: `${info.emoji} **Turno Completo!**\n\nVoce ganhou **${coins} coins** trabalhando como ${info.name}!\n\nTurnos hoje: ${job.shiftsCompleted + 1}`,
      coins,
    };
  }

  async quitJob(discordId: string): Promise<{ success: boolean; message: string }> {
    const job = await jobRepository.getJob(discordId);
    if (!job?.currentJob) {
      return { success: false, message: 'Voce nao tem um trabalho.' };
    }

    const info = this.getJobInfo(job.currentJob);
    await jobRepository.quitJob(discordId);

    return {
      success: true,
      message: `Voce saiu do trabalho de ${info?.emoji} **${info?.name}**.\nTurnos completados: ${job.shiftsCompleted}\nTotal ganho: ${job.totalEarned} coins`,
    };
  }

  async getStatus(discordId: string): Promise<{
    job: JobDocument | null;
    info: JobInfo | null;
    canWork: boolean;
    timeUntilNextShift: number;
  }> {
    const job = await jobRepository.getJob(discordId);
    if (!job?.currentJob) {
      return { job: null, info: null, canWork: false, timeUntilNextShift: 0 };
    }

    const info = this.getJobInfo(job.currentJob) || null;
    let canWork = true;
    let timeUntilNextShift = 0;

    if (job.lastShiftEnd && info) {
      const cooldownMs = info.shiftDurationMinutes * 60 * 1000;
      const timeSinceLastShift = Date.now() - new Date(job.lastShiftEnd).getTime();

      if (timeSinceLastShift < cooldownMs) {
        canWork = false;
        timeUntilNextShift = Math.ceil((cooldownMs - timeSinceLastShift) / (60 * 1000));
      }
    }

    return { job, info, canWork, timeUntilNextShift };
  }

  private randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

export const jobService = new JobService();
export default jobService;
