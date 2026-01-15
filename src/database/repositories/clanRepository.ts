import { Clan, ClanDocument } from '../models/Clan';
import { ClanMember, ClanMemberDocument, ClanRole } from '../models/ClanMember';

class ClanRepository {
  // Clan operations
  async getClanById(clanId: string): Promise<ClanDocument | null> {
    return Clan.findOne({ id: clanId });
  }

  async getClanByName(name: string): Promise<ClanDocument | null> {
    return Clan.findOne({ name: new RegExp(`^${name}$`, 'i') });
  }

  async getClanByTag(tag: string): Promise<ClanDocument | null> {
    return Clan.findOne({ tag: new RegExp(`^${tag}$`, 'i') });
  }

  async getClanByLeader(leaderId: string): Promise<ClanDocument | null> {
    return Clan.findOne({ leaderId });
  }

  async createClan(data: Partial<ClanDocument>): Promise<ClanDocument> {
    return Clan.create(data);
  }

  async updateClan(
    clanId: string,
    update: Partial<ClanDocument>
  ): Promise<ClanDocument | null> {
    return Clan.findOneAndUpdate({ id: clanId }, update, { new: true });
  }

  async deleteClan(clanId: string): Promise<boolean> {
    const result = await Clan.deleteOne({ id: clanId });
    return result.deletedCount > 0;
  }

  async addClanXP(clanId: string, xp: number): Promise<ClanDocument | null> {
    return Clan.findOneAndUpdate(
      { id: clanId },
      { $inc: { experience: xp, totalXPContributed: xp } },
      { new: true }
    );
  }

  async addClanCoins(clanId: string, coins: number): Promise<ClanDocument | null> {
    return Clan.findOneAndUpdate(
      { id: clanId },
      { $inc: { coins } },
      { new: true }
    );
  }

  async removeClanCoins(clanId: string, coins: number): Promise<ClanDocument | null> {
    return Clan.findOneAndUpdate(
      { id: clanId },
      { $inc: { coins: -coins } },
      { new: true }
    );
  }

  async levelUpClan(
    clanId: string,
    newLevel: number,
    newMaxMembers: number
  ): Promise<ClanDocument | null> {
    return Clan.findOneAndUpdate(
      { id: clanId },
      { level: newLevel, maxMembers: newMaxMembers },
      { new: true }
    );
  }

  async incrementMemberCount(clanId: string): Promise<void> {
    await Clan.updateOne({ id: clanId }, { $inc: { memberCount: 1 } });
  }

  async decrementMemberCount(clanId: string): Promise<void> {
    await Clan.updateOne({ id: clanId }, { $inc: { memberCount: -1 } });
  }

  async getPublicClans(limit: number = 20): Promise<ClanDocument[]> {
    return Clan.find({ isPublic: true }).sort({ level: -1, memberCount: -1 }).limit(limit);
  }

  async getClanLeaderboard(limit: number = 10): Promise<ClanDocument[]> {
    return Clan.find().sort({ level: -1, totalXPContributed: -1 }).limit(limit);
  }

  async addCoLeader(clanId: string, discordId: string): Promise<ClanDocument | null> {
    return Clan.findOneAndUpdate(
      { id: clanId },
      { $addToSet: { coLeaderIds: discordId } },
      { new: true }
    );
  }

  async removeCoLeader(clanId: string, discordId: string): Promise<ClanDocument | null> {
    return Clan.findOneAndUpdate(
      { id: clanId },
      { $pull: { coLeaderIds: discordId } },
      { new: true }
    );
  }

  async recordClanWin(clanId: string): Promise<void> {
    await Clan.updateOne({ id: clanId }, { $inc: { wins: 1 } });
  }

  async recordClanLoss(clanId: string): Promise<void> {
    await Clan.updateOne({ id: clanId }, { $inc: { losses: 1 } });
  }

  async recordWarWin(clanId: string): Promise<void> {
    await Clan.updateOne({ id: clanId }, { $inc: { warWins: 1 } });
  }

  // Member operations
  async getMember(discordId: string): Promise<ClanMemberDocument | null> {
    return ClanMember.findOne({ discordId });
  }

  async getClanMembers(clanId: string): Promise<ClanMemberDocument[]> {
    return ClanMember.find({ clanId }).sort({ role: 1, xpContributed: -1 });
  }

  async createMember(data: Partial<ClanMemberDocument>): Promise<ClanMemberDocument> {
    return ClanMember.create(data);
  }

  async updateMemberRole(
    discordId: string,
    role: ClanRole
  ): Promise<ClanMemberDocument | null> {
    return ClanMember.findOneAndUpdate({ discordId }, { role }, { new: true });
  }

  async addMemberContribution(
    discordId: string,
    xp: number,
    coins: number
  ): Promise<ClanMemberDocument | null> {
    return ClanMember.findOneAndUpdate(
      { discordId },
      { $inc: { xpContributed: xp, coinsContributed: coins } },
      { new: true }
    );
  }

  async removeMember(discordId: string): Promise<boolean> {
    const result = await ClanMember.deleteOne({ discordId });
    return result.deletedCount > 0;
  }

  async removeAllClanMembers(clanId: string): Promise<void> {
    await ClanMember.deleteMany({ clanId });
  }

  async getMemberCount(clanId: string): Promise<number> {
    return ClanMember.countDocuments({ clanId });
  }

  async getTopContributors(clanId: string, limit: number = 10): Promise<ClanMemberDocument[]> {
    return ClanMember.find({ clanId }).sort({ xpContributed: -1 }).limit(limit);
  }

  async recordMemberWarParticipation(discordId: string, won: boolean): Promise<void> {
    const inc: Record<string, number> = { warParticipations: 1 };
    if (won) inc.warWins = 1;
    await ClanMember.updateOne({ discordId }, { $inc: inc });
  }
}

export const clanRepository = new ClanRepository();
export default clanRepository;
