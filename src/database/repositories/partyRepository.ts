import { Party, PartyDocument, PartyMember } from '../models/Party';

class PartyRepository {
  async getPartyByLeader(leaderId: string): Promise<PartyDocument | null> {
    return Party.findOne({ leaderId, isActive: true });
  }

  async getPartyByMember(discordId: string): Promise<PartyDocument | null> {
    return Party.findOne({
      $or: [
        { leaderId: discordId },
        { 'members.odiscordId': discordId }
      ],
      isActive: true
    });
  }

  async createParty(leaderId: string, leaderName: string): Promise<PartyDocument> {
    const party = new Party({
      leaderId,
      leaderName,
      members: [{
        odiscordId: leaderId,
        username: leaderName,
        joinedAt: new Date(),
        contribution: 0,
        damageDealt: 0,
      }],
    });
    return party.save();
  }

  async addMember(partyId: string, member: PartyMember): Promise<void> {
    await Party.findByIdAndUpdate(partyId, {
      $push: { members: member }
    });
  }

  async removeMember(partyId: string, discordId: string): Promise<void> {
    await Party.findByIdAndUpdate(partyId, {
      $pull: { members: { odiscordId: discordId } }
    });
  }

  async disbandParty(partyId: string): Promise<void> {
    await Party.findByIdAndUpdate(partyId, { isActive: false });
  }

  async startBattle(partyId: string, battleId: string): Promise<void> {
    await Party.findByIdAndUpdate(partyId, {
      inBattle: true,
      currentBattleId: battleId,
      $inc: { totalBattles: 1 }
    });
  }

  async endBattle(partyId: string, won: boolean): Promise<void> {
    const update: Record<string, unknown> = {
      inBattle: false,
      currentBattleId: null,
    };
    if (won) {
      update.$inc = { totalWins: 1 };
    }
    await Party.findByIdAndUpdate(partyId, update);
  }

  async updateMemberContribution(partyId: string, discordId: string, damage: number): Promise<void> {
    await Party.findOneAndUpdate(
      { _id: partyId, 'members.odiscordId': discordId },
      {
        $inc: {
          'members.$.contribution': 1,
          'members.$.damageDealt': damage
        }
      }
    );
  }

  async resetContributions(partyId: string): Promise<void> {
    await Party.updateOne(
      { _id: partyId },
      { $set: { 'members.$[].damageDealt': 0 } }
    );
  }

  async transferLeadership(partyId: string, newLeaderId: string, newLeaderName: string): Promise<void> {
    await Party.findByIdAndUpdate(partyId, {
      leaderId: newLeaderId,
      leaderName: newLeaderName,
    });
  }
}

export const partyRepository = new PartyRepository();
export default partyRepository;
