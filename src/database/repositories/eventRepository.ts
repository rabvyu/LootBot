import { Event, EventDocument, IEvent, EventType } from '../models/Event';
import { EventParticipation, EventParticipationDocument } from '../models/EventParticipation';

class EventRepository {
  // Event CRUD
  async createEvent(data: Omit<IEvent, 'createdAt' | 'updatedAt'>): Promise<EventDocument> {
    return Event.create(data);
  }

  async getEventById(id: string): Promise<EventDocument | null> {
    return Event.findOne({ id });
  }

  async getActiveEvents(): Promise<EventDocument[]> {
    const now = new Date();
    return Event.find({
      active: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    });
  }

  async getActiveEventsByType(type: EventType): Promise<EventDocument[]> {
    const now = new Date();
    return Event.find({
      active: true,
      type,
      startDate: { $lte: now },
      endDate: { $gte: now },
    });
  }

  async getAllEvents(): Promise<EventDocument[]> {
    return Event.find().sort({ createdAt: -1 });
  }

  async getUpcomingEvents(): Promise<EventDocument[]> {
    const now = new Date();
    return Event.find({
      active: true,
      startDate: { $gt: now },
    }).sort({ startDate: 1 });
  }

  async updateEvent(id: string, data: Partial<IEvent>): Promise<EventDocument | null> {
    return Event.findOneAndUpdate({ id }, data, { new: true });
  }

  async deleteEvent(id: string): Promise<boolean> {
    const result = await Event.deleteOne({ id });
    return result.deletedCount > 0;
  }

  async toggleEvent(id: string): Promise<EventDocument | null> {
    const event = await Event.findOne({ id });
    if (!event) return null;

    event.active = !event.active;
    await event.save();
    return event;
  }

  // Community goal progress
  async addGoalProgress(id: string, amount: number): Promise<EventDocument | null> {
    return Event.findOneAndUpdate(
      { id },
      { $inc: { goalProgress: amount } },
      { new: true }
    );
  }

  async isGoalComplete(id: string): Promise<boolean> {
    const event = await Event.findOne({ id });
    if (!event || event.type !== 'community_goal') return false;
    return (event.goalProgress || 0) >= (event.goalTarget || 0);
  }

  // Participation
  async getParticipation(eventId: string, discordId: string): Promise<EventParticipationDocument | null> {
    return EventParticipation.findOne({ eventId, discordId });
  }

  async joinEvent(eventId: string, discordId: string): Promise<EventParticipationDocument> {
    const existing = await EventParticipation.findOne({ eventId, discordId });
    if (existing) return existing;

    const participation = await EventParticipation.create({
      eventId,
      discordId,
      contribution: 0,
      xpEarned: 0,
      coinsEarned: 0,
      rewardsClaimed: false,
    });

    // Add to event participants array
    await Event.updateOne(
      { id: eventId },
      { $addToSet: { participants: discordId } }
    );

    return participation;
  }

  async addContribution(
    eventId: string,
    discordId: string,
    amount: number
  ): Promise<EventParticipationDocument | null> {
    return EventParticipation.findOneAndUpdate(
      { eventId, discordId },
      {
        $inc: { contribution: amount },
        $set: { lastContribution: new Date() }
      },
      { new: true, upsert: true }
    );
  }

  async trackEventXP(
    eventId: string,
    discordId: string,
    xp: number
  ): Promise<void> {
    await EventParticipation.updateOne(
      { eventId, discordId },
      { $inc: { xpEarned: xp } },
      { upsert: true }
    );
  }

  async trackEventCoins(
    eventId: string,
    discordId: string,
    coins: number
  ): Promise<void> {
    await EventParticipation.updateOne(
      { eventId, discordId },
      { $inc: { coinsEarned: coins } },
      { upsert: true }
    );
  }

  async getEventParticipants(eventId: string): Promise<EventParticipationDocument[]> {
    return EventParticipation.find({ eventId }).sort({ contribution: -1 });
  }

  async getTopContributors(eventId: string, limit: number = 10): Promise<EventParticipationDocument[]> {
    return EventParticipation.find({ eventId })
      .sort({ contribution: -1 })
      .limit(limit);
  }

  async claimReward(eventId: string, discordId: string): Promise<boolean> {
    const result = await EventParticipation.updateOne(
      { eventId, discordId, rewardsClaimed: false },
      { $set: { rewardsClaimed: true } }
    );
    return result.modifiedCount > 0;
  }

  async getParticipantCount(eventId: string): Promise<number> {
    return EventParticipation.countDocuments({ eventId });
  }

  async getUserActiveEvents(discordId: string): Promise<EventDocument[]> {
    const now = new Date();
    const participations = await EventParticipation.find({ discordId });
    const eventIds = participations.map(p => p.eventId);

    return Event.find({
      id: { $in: eventIds },
      active: true,
      endDate: { $gte: now },
    });
  }
}

export const eventRepository = new EventRepository();
