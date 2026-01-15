import { eventRepository } from '../database/repositories/eventRepository';
import { userRepository } from '../database/repositories/userRepository';
import { economyRepository } from '../database/repositories/economyRepository';
import { badgeService } from './badgeService';
import { EventDocument, EventType, IEvent } from '../database/models/Event';
import { EventParticipationDocument } from '../database/models/EventParticipation';
import { logger } from '../utils/logger';

class EventService {
  // Get current active multipliers
  async getXPMultiplier(): Promise<number> {
    const boostEvents = await eventRepository.getActiveEventsByType('xp_boost');
    if (boostEvents.length === 0) return 1;

    // Stack multipliers multiplicatively
    return boostEvents.reduce((mult, event) => mult * (event.multiplier || 1), 1);
  }

  async getCoinsMultiplier(): Promise<number> {
    const boostEvents = await eventRepository.getActiveEventsByType('coins_boost');
    if (boostEvents.length === 0) return 1;

    return boostEvents.reduce((mult, event) => mult * (event.multiplier || 1), 1);
  }

  async getDailyMultiplier(): Promise<number> {
    const events = await eventRepository.getActiveEventsByType('double_daily');
    if (events.length === 0) return 1;
    return 2; // Double daily
  }

  // Check for active events
  async getActiveEvents(): Promise<EventDocument[]> {
    return eventRepository.getActiveEvents();
  }

  async getActiveEventsByType(type: EventType): Promise<EventDocument[]> {
    return eventRepository.getActiveEventsByType(type);
  }

  async hasActiveEvent(type: EventType): Promise<boolean> {
    const events = await eventRepository.getActiveEventsByType(type);
    return events.length > 0;
  }

  // Create new event
  async createEvent(data: {
    id: string;
    name: string;
    description: string;
    type: EventType;
    startDate: Date;
    endDate: Date;
    multiplier?: number;
    badgeId?: string;
    goalType?: 'messages' | 'voice_minutes' | 'reactions' | 'total_xp';
    goalTarget?: number;
    goalReward?: { xp?: number; coins?: number; badgeId?: string };
    seasonalTheme?: string;
    createdBy: string;
  }): Promise<EventDocument> {
    return eventRepository.createEvent({
      ...data,
      active: true,
      goalProgress: 0,
      participants: [],
    });
  }

  // Manage events
  async toggleEvent(id: string): Promise<EventDocument | null> {
    return eventRepository.toggleEvent(id);
  }

  async endEvent(id: string): Promise<EventDocument | null> {
    return eventRepository.updateEvent(id, { active: false });
  }

  async deleteEvent(id: string): Promise<boolean> {
    return eventRepository.deleteEvent(id);
  }

  async getEvent(id: string): Promise<EventDocument | null> {
    return eventRepository.getEventById(id);
  }

  async getAllEvents(): Promise<EventDocument[]> {
    return eventRepository.getAllEvents();
  }

  // Community goal contributions
  async addContribution(
    eventId: string,
    discordId: string,
    amount: number,
    type: 'messages' | 'voice_minutes' | 'reactions' | 'total_xp'
  ): Promise<{ goalComplete: boolean; event: EventDocument | null }> {
    const event = await eventRepository.getEventById(eventId);
    if (!event || event.type !== 'community_goal' || event.goalType !== type) {
      return { goalComplete: false, event: null };
    }

    // Auto-join event if not already participating
    await eventRepository.joinEvent(eventId, discordId);

    // Add individual contribution
    await eventRepository.addContribution(eventId, discordId, amount);

    // Add to global goal progress
    const updatedEvent = await eventRepository.addGoalProgress(eventId, amount);

    // Check if goal is complete
    const goalComplete = await eventRepository.isGoalComplete(eventId);

    return { goalComplete, event: updatedEvent };
  }

  // Process goal completion and award rewards
  async processGoalCompletion(eventId: string): Promise<void> {
    const event = await eventRepository.getEventById(eventId);
    if (!event || event.type !== 'community_goal') return;

    const participants = await eventRepository.getEventParticipants(eventId);
    const reward = event.goalReward;

    if (!reward) return;

    for (const participant of participants) {
      if (participant.rewardsClaimed) continue;

      try {
        // Award XP reward
        if (reward.xp) {
          await userRepository.addXP(participant.discordId, reward.xp, 'bonus');
        }

        // Award coins reward
        if (reward.coins) {
          await economyRepository.addCoins(
            participant.discordId,
            reward.coins,
            'earn',
            `Event reward: ${eventId}`
          );
        }

        // Award badge reward (need to get the user first)
        if (reward.badgeId) {
          const user = await userRepository.findByDiscordId(participant.discordId);
          if (user) {
            await userRepository.addBadge(participant.discordId, reward.badgeId);
          }
        }

        // Mark as claimed
        await eventRepository.claimReward(eventId, participant.discordId);

        logger.info(`Awarded community goal reward to ${participant.discordId} for event ${eventId}`);
      } catch (error) {
        logger.error(`Error awarding reward to ${participant.discordId}:`, error);
      }
    }

    // End the event
    await eventRepository.updateEvent(eventId, { active: false });
    logger.info(`Community goal event ${eventId} completed!`);
  }

  // Track XP/Coins earned during event
  async trackEventGains(
    discordId: string,
    xp: number,
    coins: number
  ): Promise<void> {
    const activeEvents = await eventRepository.getActiveEvents();

    for (const event of activeEvents) {
      // Auto-join boost events
      if (['xp_boost', 'coins_boost', 'double_daily'].includes(event.type)) {
        await eventRepository.joinEvent(event.id, discordId);
      }

      if (xp > 0) {
        await eventRepository.trackEventXP(event.id, discordId, xp);
      }
      if (coins > 0) {
        await eventRepository.trackEventCoins(event.id, discordId, coins);
      }
    }
  }

  // Get user's participation in active events
  async getUserEventParticipations(
    discordId: string
  ): Promise<Array<{ event: EventDocument; participation: EventParticipationDocument | null }>> {
    const activeEvents = await eventRepository.getActiveEvents();
    const result: Array<{ event: EventDocument; participation: EventParticipationDocument | null }> = [];

    for (const event of activeEvents) {
      const participation = await eventRepository.getParticipation(event.id, discordId);
      result.push({ event, participation });
    }

    return result;
  }

  // Get top contributors for an event
  async getTopContributors(eventId: string, limit: number = 10): Promise<EventParticipationDocument[]> {
    return eventRepository.getTopContributors(eventId, limit);
  }

  // Join an event manually
  async joinEvent(eventId: string, discordId: string): Promise<EventParticipationDocument | null> {
    const event = await eventRepository.getEventById(eventId);
    if (!event || !event.active) return null;

    return eventRepository.joinEvent(eventId, discordId);
  }

  // Check for badge hunt events and award badge
  async checkBadgeHunt(discordId: string): Promise<{ awarded: boolean; badgeId?: string }> {
    const badgeHuntEvents = await eventRepository.getActiveEventsByType('badge_hunt');

    for (const event of badgeHuntEvents) {
      if (!event.badgeId) continue;

      // Check if user already has this badge
      const user = await userRepository.findByDiscordId(discordId);
      if (!user) continue;

      const hasBadge = user.badges.some(b => b.badgeId === event.badgeId);
      if (hasBadge) continue;

      // Award the badge (badge hunt badges have random chance or specific criteria)
      // For now, we'll use a simple 5% chance on any activity during the event
      const chance = Math.random();
      if (chance < 0.05) {
        await userRepository.addBadge(discordId, event.badgeId);
        await eventRepository.joinEvent(event.id, discordId);
        return { awarded: true, badgeId: event.badgeId };
      }
    }

    return { awarded: false };
  }

  // Schedule event check (run periodically to auto-end expired events)
  async checkExpiredEvents(): Promise<void> {
    const now = new Date();
    const allEvents = await eventRepository.getAllEvents();

    for (const event of allEvents) {
      if (event.active && event.endDate < now) {
        await eventRepository.updateEvent(event.id, { active: false });
        logger.info(`Event ${event.id} (${event.name}) has ended automatically`);
      }
    }
  }
}

export const eventService = new EventService();
