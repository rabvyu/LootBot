// Serviço de Eventos Mundiais
import { v4 as uuidv4 } from 'uuid';
import {
  WorldEvent,
  IWorldEvent,
  WorldEventParticipant,
  WorldEventReward,
} from '../database/models/WorldEvent';
import { Character, User, CharacterInventory } from '../database/models';
import {
  WorldEventTemplate,
  getEventTemplate,
  getAllEventTemplates,
  calculateBossDamage,
  calculateContribution,
  WORLD_EVENT_TEMPLATES,
} from '../data/worldEvents';
import { logger } from '../utils/logger';

export interface EventActionResult {
  success: boolean;
  message: string;
  contribution?: number;
  damage?: number;
  rewards?: WorldEventReward[];
  eventCompleted?: boolean;
  objectiveCompleted?: string;
}

export interface EventParticipationResult {
  success: boolean;
  message: string;
  event?: IWorldEvent;
  alreadyParticipating?: boolean;
}

class WorldEventService {
  // Obter evento ativo
  async getActiveEvent(): Promise<IWorldEvent | null> {
    return WorldEvent.findOne({ status: 'active' });
  }

  // Obter eventos agendados
  async getScheduledEvents(): Promise<IWorldEvent[]> {
    return WorldEvent.find({ status: 'scheduled' }).sort({ scheduledStart: 1 });
  }

  // Criar evento a partir de template
  async createEvent(templateId: string, startDate?: Date): Promise<IWorldEvent | null> {
    const template = getEventTemplate(templateId);
    if (!template) return null;

    const start = startDate || new Date();
    const end = new Date(start.getTime() + template.durationHours * 60 * 60 * 1000);

    const event = new WorldEvent({
      eventId: uuidv4(),
      type: template.type,
      name: template.name,
      description: template.description,
      emoji: template.emoji,
      status: startDate ? 'scheduled' : 'active',
      scheduledStart: start,
      actualStart: startDate ? undefined : start,
      scheduledEnd: end,
      minLevel: template.minLevel,
      cooldownHours: template.cooldownHours,
      objectives: template.objectives.map(obj => ({
        ...obj,
        current: 0,
        completed: false,
      })),
      participants: [],
      globalRewards: template.globalRewards,
      topContributors: [],
      stats: {
        totalParticipants: 0,
        totalContribution: 0,
        completionPercentage: 0,
      },
    });

    // Configurar dados específicos por tipo
    if (template.bossConfig) {
      event.boss = {
        name: template.bossConfig.name,
        hp: template.bossConfig.hp,
        maxHp: template.bossConfig.hp,
        attack: template.bossConfig.attack,
        defense: template.bossConfig.defense,
        rewards: template.topContributorRewards.top1 as any,
      };
    }

    if (template.invasionConfig) {
      event.invasion = {
        totalWaves: template.invasionConfig.totalWaves,
        currentWave: 1,
        monstersPerWave: template.invasionConfig.monstersPerWave,
        monstersDefeated: 0,
        monstersRemaining: template.invasionConfig.monstersPerWave,
      };
    }

    if (template.treasureConfig) {
      event.treasureHunt = {
        totalTreasures: template.treasureConfig.totalTreasures,
        foundTreasures: 0,
        clues: template.treasureConfig.clues,
        currentClue: 0,
      };
    }

    await event.save();
    logger.info(`World event created: ${event.name} (${event.eventId})`);

    return event;
  }

  // Participar de evento
  async joinEvent(discordId: string): Promise<EventParticipationResult> {
    const event = await this.getActiveEvent();
    if (!event) {
      return { success: false, message: 'Não há evento ativo no momento.' };
    }

    // Verificar nível
    const character = await Character.findOne({ discordId });
    if (!character) {
      return { success: false, message: 'Você precisa criar um personagem primeiro.' };
    }

    if (character.level < event.minLevel) {
      return {
        success: false,
        message: `Nível insuficiente. Necessário: ${event.minLevel}. Seu nível: ${character.level}`,
      };
    }

    // Verificar se já participa
    const existingParticipant = event.participants.find(p => p.discordId === discordId);
    if (existingParticipant) {
      return { success: true, message: 'Você já está participando!', event, alreadyParticipating: true };
    }

    // Verificar cooldown
    const user = await User.findOne({ discordId });
    if (!user) {
      return { success: false, message: 'Usuário não encontrado.' };
    }

    // Adicionar participante
    event.participants.push({
      discordId,
      username: user.username,
      contribution: 0,
      damage: 0,
      kills: 0,
      itemsFound: 0,
      joinedAt: new Date(),
      lastActionAt: new Date(),
    });

    event.stats.totalParticipants = event.participants.length;
    await event.save();

    logger.info(`${user.username} joined world event: ${event.name}`);

    return {
      success: true,
      message: `Você entrou no evento **${event.name}**!`,
      event,
    };
  }

  // Realizar ação no evento
  async performAction(discordId: string, actionType: 'attack' | 'search' | 'collect'): Promise<EventActionResult> {
    const event = await this.getActiveEvent();
    if (!event) {
      return { success: false, message: 'Não há evento ativo.' };
    }

    // Verificar se participa
    const participant = event.participants.find(p => p.discordId === discordId);
    if (!participant) {
      return { success: false, message: 'Você não está participando do evento. Use `/evento entrar`.' };
    }

    // Cooldown de ação (30 segundos)
    const cooldownMs = 30000;
    const timeSinceLastAction = Date.now() - participant.lastActionAt.getTime();
    if (timeSinceLastAction < cooldownMs) {
      const remaining = Math.ceil((cooldownMs - timeSinceLastAction) / 1000);
      return { success: false, message: `Aguarde ${remaining} segundos para a próxima ação.` };
    }

    const character = await Character.findOne({ discordId });
    if (!character) {
      return { success: false, message: 'Personagem não encontrado.' };
    }

    let result: EventActionResult;

    switch (event.type) {
      case 'boss_world':
        result = await this.attackBoss(event, participant, character);
        break;
      case 'invasion':
        result = await this.fightInvasion(event, participant, character);
        break;
      case 'treasure_hunt':
        result = await this.searchTreasure(event, participant, character);
        break;
      case 'meteor_shower':
        result = await this.collectMeteor(event, participant, character);
        break;
      case 'double_xp':
        result = await this.contributeXP(event, participant, character);
        break;
      default:
        result = { success: false, message: 'Tipo de evento não suportado.' };
    }

    if (result.success) {
      participant.lastActionAt = new Date();
      await event.save();
    }

    return result;
  }

  // Atacar boss mundial
  private async attackBoss(
    event: IWorldEvent,
    participant: WorldEventParticipant,
    character: any
  ): Promise<EventActionResult> {
    if (!event.boss || event.boss.hp <= 0) {
      return { success: false, message: 'O boss já foi derrotado!' };
    }

    // Calcular dano
    const damage = calculateBossDamage(
      character.stats.attack,
      character.level,
      event.boss.defense
    );

    // Aplicar dano
    event.boss.hp = Math.max(0, event.boss.hp - damage);

    // Atualizar participante
    participant.damage = (participant.damage || 0) + damage;
    participant.contribution += calculateContribution('attack', damage);

    // Atualizar objetivo
    const objective = event.objectives.find(o => o.objectiveId.includes('damage'));
    if (objective) {
      objective.current += damage;
      if (objective.current >= objective.target && !objective.completed) {
        objective.completed = true;
      }
    }

    // Atualizar stats
    event.stats.totalContribution += damage;
    event.stats.completionPercentage = Math.floor(
      ((event.boss.maxHp - event.boss.hp) / event.boss.maxHp) * 100
    );

    let eventCompleted = false;
    let message = `⚔️ Você causou **${damage.toLocaleString()}** de dano ao **${event.boss.name}**!\nHP restante: ${event.boss.hp.toLocaleString()}/${event.boss.maxHp.toLocaleString()}`;

    // Verificar se boss morreu
    if (event.boss.hp <= 0) {
      eventCompleted = true;
      message += '\n\n🎉 **O BOSS FOI DERROTADO!**';
      event.status = 'completed';
      event.actualEnd = new Date();
      await this.distributeRewards(event);
    }

    await event.save();

    return {
      success: true,
      message,
      damage,
      contribution: calculateContribution('attack', damage),
      eventCompleted,
    };
  }

  // Combater invasão
  private async fightInvasion(
    event: IWorldEvent,
    participant: WorldEventParticipant,
    character: any
  ): Promise<EventActionResult> {
    if (!event.invasion) {
      return { success: false, message: 'Evento de invasão inválido.' };
    }

    if (event.invasion.monstersRemaining <= 0 && event.invasion.currentWave >= event.invasion.totalWaves) {
      return { success: false, message: 'A invasão foi repelida!' };
    }

    // Calcular kills baseado no ataque
    const baseKills = Math.floor(character.stats.attack / 100) + 1;
    const kills = Math.min(baseKills, event.invasion.monstersRemaining);

    // Atualizar invasão
    event.invasion.monstersRemaining -= kills;
    event.invasion.monstersDefeated += kills;

    // Verificar próxima wave
    let waveCompleted = false;
    if (event.invasion.monstersRemaining <= 0 && event.invasion.currentWave < event.invasion.totalWaves) {
      event.invasion.currentWave += 1;
      event.invasion.monstersRemaining = event.invasion.monstersPerWave;
      waveCompleted = true;
    }

    // Atualizar participante
    participant.kills = (participant.kills || 0) + kills;
    participant.contribution += calculateContribution('kill', kills);

    // Atualizar objetivo
    const objective = event.objectives.find(o => o.objectiveId.includes('kill'));
    if (objective) {
      objective.current += kills;
      if (objective.current >= objective.target && !objective.completed) {
        objective.completed = true;
      }
    }

    // Atualizar stats
    event.stats.totalContribution += kills * 100;
    const totalMonsters = event.invasion.totalWaves * event.invasion.monstersPerWave;
    event.stats.completionPercentage = Math.floor((event.invasion.monstersDefeated / totalMonsters) * 100);

    let message = `⚔️ Você derrotou **${kills}** monstros!`;
    if (waveCompleted) {
      message += `\n🌊 **Wave ${event.invasion.currentWave}/${event.invasion.totalWaves} iniciada!**`;
    }

    // Verificar fim do evento
    let eventCompleted = false;
    if (event.invasion.monstersDefeated >= totalMonsters) {
      eventCompleted = true;
      message += '\n\n🎉 **A INVASÃO FOI REPELIDA!**';
      event.status = 'completed';
      event.actualEnd = new Date();
      await this.distributeRewards(event);
    }

    await event.save();

    return {
      success: true,
      message,
      contribution: calculateContribution('kill', kills),
      eventCompleted,
    };
  }

  // Procurar tesouro
  private async searchTreasure(
    event: IWorldEvent,
    participant: WorldEventParticipant,
    character: any
  ): Promise<EventActionResult> {
    if (!event.treasureHunt) {
      return { success: false, message: 'Evento de caça ao tesouro inválido.' };
    }

    if (event.treasureHunt.foundTreasures >= event.treasureHunt.totalTreasures) {
      return { success: false, message: 'Todos os tesouros foram encontrados!' };
    }

    // Chance de encontrar baseada no nível
    const baseChance = 30 + character.level;
    const found = Math.random() * 100 < baseChance;

    if (!found) {
      return {
        success: true,
        message: '🔍 Você procurou mas não encontrou nada desta vez...',
        contribution: 10,
      };
    }

    // Encontrou tesouro!
    event.treasureHunt.foundTreasures += 1;
    participant.itemsFound = (participant.itemsFound || 0) + 1;
    participant.contribution += calculateContribution('collect', 1);

    // Atualizar objetivo
    const objective = event.objectives.find(o => o.objectiveId.includes('find'));
    if (objective) {
      objective.current += 1;
      if (objective.current >= objective.target && !objective.completed) {
        objective.completed = true;
      }
    }

    // Atualizar stats
    event.stats.totalContribution += 50;
    event.stats.completionPercentage = Math.floor(
      (event.treasureHunt.foundTreasures / event.treasureHunt.totalTreasures) * 100
    );

    // Próxima pista
    if (event.treasureHunt.foundTreasures % 20 === 0 &&
        event.treasureHunt.currentClue < event.treasureHunt.clues.length - 1) {
      event.treasureHunt.currentClue += 1;
    }

    let message = `🎁 Você encontrou um tesouro!\nTesouros encontrados: ${event.treasureHunt.foundTreasures}/${event.treasureHunt.totalTreasures}`;

    // Verificar fim do evento
    let eventCompleted = false;
    if (event.treasureHunt.foundTreasures >= event.treasureHunt.totalTreasures) {
      eventCompleted = true;
      message += '\n\n🎉 **TODOS OS TESOUROS FORAM ENCONTRADOS!**';
      event.status = 'completed';
      event.actualEnd = new Date();
      await this.distributeRewards(event);
    }

    await event.save();

    return {
      success: true,
      message,
      contribution: calculateContribution('collect', 1),
      eventCompleted,
    };
  }

  // Coletar meteoro
  private async collectMeteor(
    event: IWorldEvent,
    participant: WorldEventParticipant,
    character: any
  ): Promise<EventActionResult> {
    // Chance baseada no nível
    const baseChance = 40 + character.level * 0.5;
    const found = Math.random() * 100 < baseChance;

    const contribution = found ? calculateContribution('collect', 1) : 5;
    participant.contribution += contribution;

    if (!found) {
      return {
        success: true,
        message: '☄️ Você tentou pegar um fragmento mas ele se desintegrou...',
        contribution: 5,
      };
    }

    participant.itemsFound = (participant.itemsFound || 0) + 1;

    // Atualizar objetivo
    const objective = event.objectives.find(o => o.objectiveId.includes('collect'));
    if (objective) {
      objective.current += 1;
      if (objective.current >= objective.target && !objective.completed) {
        objective.completed = true;
      }
    }

    event.stats.totalContribution += 50;
    event.stats.completionPercentage = objective
      ? Math.floor((objective.current / objective.target) * 100)
      : 0;

    await event.save();

    return {
      success: true,
      message: `☄️ Você coletou um **Fragmento de Meteoro**!\nFragmentos coletados no evento: ${participant.itemsFound}`,
      contribution,
    };
  }

  // Contribuir XP (para evento de XP dobrado)
  private async contributeXP(
    event: IWorldEvent,
    participant: WorldEventParticipant,
    character: any
  ): Promise<EventActionResult> {
    const xpContribution = 100 + character.level * 10;
    participant.contribution += xpContribution;

    const objective = event.objectives.find(o => o.objectiveId.includes('xp'));
    if (objective) {
      objective.current += xpContribution;
      if (objective.current >= objective.target && !objective.completed) {
        objective.completed = true;
      }
    }

    event.stats.totalContribution += xpContribution;
    event.stats.completionPercentage = objective
      ? Math.min(100, Math.floor((objective.current / objective.target) * 100))
      : 0;

    await event.save();

    return {
      success: true,
      message: `⚡ Você contribuiu com **${xpContribution}** XP para a comunidade!\nXP total da comunidade: ${objective?.current.toLocaleString() || 0}`,
      contribution: xpContribution,
    };
  }

  // Distribuir recompensas no fim do evento
  private async distributeRewards(event: IWorldEvent): Promise<void> {
    // Ordenar participantes por contribuição
    const sortedParticipants = [...event.participants].sort(
      (a, b) => b.contribution - a.contribution
    );

    // Obter template para recompensas
    const templateId = Object.keys(WORLD_EVENT_TEMPLATES).find(
      key => WORLD_EVENT_TEMPLATES[key].name === event.name
    );
    const template = templateId ? (getEventTemplate(templateId) ?? null) : null;

    // Atribuir top contributors
    event.topContributors = sortedParticipants.slice(0, 10).map((p, index) => ({
      discordId: p.discordId,
      username: p.username,
      contribution: p.contribution,
      rank: index + 1,
      bonusRewards: this.getTopRewards(index + 1, template) as any,
    }));

    // Distribuir recompensas para todos os participantes
    for (const participant of event.participants) {
      await this.giveRewardsToPlayer(participant.discordId, event.globalRewards);

      // Bonus para top 10
      const topEntry = event.topContributors.find(t => t.discordId === participant.discordId);
      if (topEntry && topEntry.bonusRewards.length > 0) {
        await this.giveRewardsToPlayer(participant.discordId, topEntry.bonusRewards);
      }
    }

    await event.save();
    logger.info(`World event ${event.name} completed. Rewards distributed to ${event.participants.length} players.`);
  }

  // Obter recompensas por posição
  private getTopRewards(position: number, template: WorldEventTemplate | null): any[] {
    if (!template) return [];

    if (position === 1) return template.topContributorRewards.top1;
    if (position <= 3) return template.topContributorRewards.top3;
    if (position <= 10) return template.topContributorRewards.top10;
    return [];
  }

  // Dar recompensas ao jogador
  private async giveRewardsToPlayer(discordId: string, rewards: WorldEventReward[]): Promise<void> {
    const user = await User.findOne({ discordId });
    let inventory = await CharacterInventory.findOne({ discordId });

    if (!user) return;

    if (!inventory) {
      inventory = new CharacterInventory({ discordId, consumables: [], materials: [] });
    }

    for (const reward of rewards) {
      switch (reward.type) {
        case 'coins':
          user.coins += reward.quantity;
          break;
        case 'xp':
          user.xp += reward.quantity;
          break;
        case 'material':
          if (reward.itemId) {
            const existing = inventory.materials.find(m => m.itemId === reward.itemId);
            if (existing) {
              existing.quantity += reward.quantity;
            } else {
              inventory.materials.push({
                itemId: reward.itemId,
                quantity: reward.quantity,
                acquiredAt: new Date(),
              });
            }
          }
          break;
      }
    }

    await user.save();
    await inventory.save();
  }

  // Obter ranking do evento
  async getEventRanking(limit: number = 10): Promise<Array<{
    position: number;
    username: string;
    contribution: number;
  }>> {
    const event = await this.getActiveEvent();
    if (!event) return [];

    const sorted = [...event.participants]
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, limit);

    return sorted.map((p, index) => ({
      position: index + 1,
      username: p.username,
      contribution: p.contribution,
    }));
  }

  // Iniciar eventos agendados
  async checkAndStartScheduledEvents(): Promise<void> {
    const now = new Date();
    const scheduledEvents = await WorldEvent.find({
      status: 'scheduled',
      scheduledStart: { $lte: now },
    });

    for (const event of scheduledEvents) {
      event.status = 'active';
      event.actualStart = now;
      await event.save();
      logger.info(`World event started: ${event.name}`);
    }
  }

  // Encerrar eventos expirados
  async checkAndEndExpiredEvents(): Promise<void> {
    const now = new Date();
    const activeEvents = await WorldEvent.find({
      status: 'active',
      scheduledEnd: { $lte: now },
    });

    for (const event of activeEvents) {
      event.status = 'completed';
      event.actualEnd = now;
      await this.distributeRewards(event);
      logger.info(`World event ended: ${event.name}`);
    }
  }

  // Obter histórico de eventos
  async getEventHistory(limit: number = 5): Promise<IWorldEvent[]> {
    return WorldEvent.find({ status: 'completed' })
      .sort({ actualEnd: -1 })
      .limit(limit);
  }

  // Admin: Criar evento imediato
  async adminCreateEvent(templateId: string): Promise<IWorldEvent | null> {
    // Encerrar evento ativo se houver
    const activeEvent = await this.getActiveEvent();
    if (activeEvent) {
      activeEvent.status = 'completed';
      activeEvent.actualEnd = new Date();
      await activeEvent.save();
    }

    return this.createEvent(templateId);
  }

  // Admin: Encerrar evento
  async adminEndEvent(): Promise<boolean> {
    const event = await this.getActiveEvent();
    if (!event) return false;

    event.status = 'completed';
    event.actualEnd = new Date();
    await this.distributeRewards(event);

    return true;
  }
}

export const worldEventService = new WorldEventService();
export default worldEventService;
