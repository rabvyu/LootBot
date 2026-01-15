import { clanRepository } from '../database/repositories/clanRepository';
import { economyRepository } from '../database/repositories/economyRepository';
import { ClanDocument } from '../database/models/Clan';
import { ClanMemberDocument, ClanRole } from '../database/models/ClanMember';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

// Clan level requirements
const CLAN_XP_FOR_LEVEL = (level: number) => Math.floor(500 * Math.pow(level, 1.8));
const CLAN_MEMBERS_FOR_LEVEL: Record<number, number> = {
  1: 10,
  2: 15,
  3: 20,
  4: 25,
  5: 30,
  6: 35,
  7: 40,
  8: 45,
  9: 50,
  10: 60,
};

const CLAN_CREATION_COST = 5000;

const ROLE_HIERARCHY: Record<ClanRole, number> = {
  leader: 0,
  'co-leader': 1,
  elder: 2,
  member: 3,
};

const ROLE_NAMES: Record<ClanRole, string> = {
  leader: 'Líder',
  'co-leader': 'Vice-Líder',
  elder: 'Ancião',
  member: 'Membro',
};

export interface ClanActionResult {
  success: boolean;
  message: string;
  clan?: ClanDocument;
  member?: ClanMemberDocument;
}

class ClanService {
  async createClan(
    discordId: string,
    name: string,
    tag: string,
    emoji: string = '⚔️'
  ): Promise<ClanActionResult> {
    // Check if user already in a clan
    const existingMember = await clanRepository.getMember(discordId);
    if (existingMember) {
      return { success: false, message: 'Você já faz parte de um clã!' };
    }

    // Validate name
    if (name.length < 3 || name.length > 25) {
      return { success: false, message: 'Nome do clã deve ter entre 3 e 25 caracteres.' };
    }

    // Validate tag
    if (tag.length < 2 || tag.length > 5) {
      return { success: false, message: 'Tag do clã deve ter entre 2 e 5 caracteres.' };
    }

    // Check if name exists
    const existingName = await clanRepository.getClanByName(name);
    if (existingName) {
      return { success: false, message: 'Já existe um clã com esse nome!' };
    }

    // Check if tag exists
    const existingTag = await clanRepository.getClanByTag(tag);
    if (existingTag) {
      return { success: false, message: 'Já existe um clã com essa tag!' };
    }

    // Check if user has enough coins
    const balance = await economyRepository.getBalance(discordId);
    if (balance < CLAN_CREATION_COST) {
      return {
        success: false,
        message: `Você precisa de ${CLAN_CREATION_COST} coins para criar um clã. (Saldo: ${balance})`,
      };
    }

    // Deduct coins
    await economyRepository.removeCoins(discordId, CLAN_CREATION_COST, 'spend', 'Criação de clã');

    // Create clan
    const clanId = uuidv4().substring(0, 8);
    const clan = await clanRepository.createClan({
      id: clanId,
      name,
      tag: tag.toUpperCase(),
      emoji,
      leaderId: discordId,
      coLeaderIds: [],
      level: 1,
      experience: 0,
      totalXPContributed: 0,
      coins: 0,
      maxMembers: CLAN_MEMBERS_FOR_LEVEL[1],
      memberCount: 1,
    });

    // Create leader member
    await clanRepository.createMember({
      discordId,
      clanId,
      role: 'leader',
    });

    logger.info(`Clan created: ${name} [${tag}] by ${discordId}`);

    return {
      success: true,
      message: `Clã **${emoji} ${name}** [${tag}] criado com sucesso!`,
      clan,
    };
  }

  async joinClan(discordId: string, clanId: string): Promise<ClanActionResult> {
    // Check if user already in a clan
    const existingMember = await clanRepository.getMember(discordId);
    if (existingMember) {
      return { success: false, message: 'Você já faz parte de um clã!' };
    }

    // Get clan
    const clan = await clanRepository.getClanById(clanId);
    if (!clan) {
      return { success: false, message: 'Clã não encontrado.' };
    }

    // Check if clan is public
    if (!clan.isPublic) {
      return { success: false, message: 'Este clã é privado. Peça um convite ao líder.' };
    }

    // Check member limit
    if (clan.memberCount >= clan.maxMembers) {
      return { success: false, message: 'Este clã está cheio!' };
    }

    // Add member
    const member = await clanRepository.createMember({
      discordId,
      clanId,
      role: 'member',
    });

    // Update member count
    await clanRepository.incrementMemberCount(clanId);

    logger.info(`User ${discordId} joined clan ${clan.name}`);

    return {
      success: true,
      message: `Você entrou no clã **${clan.emoji} ${clan.name}**!`,
      clan,
      member,
    };
  }

  async leaveClan(discordId: string): Promise<ClanActionResult> {
    const member = await clanRepository.getMember(discordId);
    if (!member) {
      return { success: false, message: 'Você não faz parte de um clã.' };
    }

    const clan = await clanRepository.getClanById(member.clanId);
    if (!clan) {
      await clanRepository.removeMember(discordId);
      return { success: false, message: 'Clã não encontrado.' };
    }

    // Leader cannot leave, must transfer or disband
    if (member.role === 'leader') {
      return {
        success: false,
        message: 'Você é o líder! Transfira a liderança ou disbande o clã.',
      };
    }

    // Remove member
    await clanRepository.removeMember(discordId);
    await clanRepository.decrementMemberCount(member.clanId);

    // Remove from co-leaders if applicable
    if (member.role === 'co-leader') {
      await clanRepository.removeCoLeader(member.clanId, discordId);
    }

    logger.info(`User ${discordId} left clan ${clan.name}`);

    return {
      success: true,
      message: `Você saiu do clã **${clan.emoji} ${clan.name}**.`,
    };
  }

  async disbandClan(discordId: string): Promise<ClanActionResult> {
    const member = await clanRepository.getMember(discordId);
    if (!member) {
      return { success: false, message: 'Você não faz parte de um clã.' };
    }

    if (member.role !== 'leader') {
      return { success: false, message: 'Apenas o líder pode dissolver o clã.' };
    }

    const clan = await clanRepository.getClanById(member.clanId);
    if (!clan) {
      return { success: false, message: 'Clã não encontrado.' };
    }

    // Remove all members
    await clanRepository.removeAllClanMembers(member.clanId);

    // Delete clan
    await clanRepository.deleteClan(member.clanId);

    logger.info(`Clan ${clan.name} was disbanded by ${discordId}`);

    return {
      success: true,
      message: `Clã **${clan.emoji} ${clan.name}** foi dissolvido.`,
    };
  }

  async promoteMember(
    leaderId: string,
    targetId: string
  ): Promise<ClanActionResult> {
    const leaderMember = await clanRepository.getMember(leaderId);
    if (!leaderMember) {
      return { success: false, message: 'Você não faz parte de um clã.' };
    }

    if (leaderMember.role !== 'leader' && leaderMember.role !== 'co-leader') {
      return { success: false, message: 'Você não tem permissão para promover membros.' };
    }

    const targetMember = await clanRepository.getMember(targetId);
    if (!targetMember || targetMember.clanId !== leaderMember.clanId) {
      return { success: false, message: 'Membro não encontrado no seu clã.' };
    }

    // Cannot promote yourself or someone higher rank
    if (ROLE_HIERARCHY[targetMember.role] <= ROLE_HIERARCHY[leaderMember.role]) {
      return { success: false, message: 'Você não pode promover este membro.' };
    }

    // Determine new role
    let newRole: ClanRole;
    switch (targetMember.role) {
      case 'member':
        newRole = 'elder';
        break;
      case 'elder':
        newRole = 'co-leader';
        break;
      default:
        return { success: false, message: 'Este membro já está no cargo máximo.' };
    }

    // Co-leader only leader can promote
    if (newRole === 'co-leader' && leaderMember.role !== 'leader') {
      return { success: false, message: 'Apenas o líder pode promover a Vice-Líder.' };
    }

    await clanRepository.updateMemberRole(targetId, newRole);

    if (newRole === 'co-leader') {
      await clanRepository.addCoLeader(leaderMember.clanId, targetId);
    }

    return {
      success: true,
      message: `Membro promovido para **${ROLE_NAMES[newRole]}**!`,
    };
  }

  async demoteMember(
    leaderId: string,
    targetId: string
  ): Promise<ClanActionResult> {
    const leaderMember = await clanRepository.getMember(leaderId);
    if (!leaderMember) {
      return { success: false, message: 'Você não faz parte de um clã.' };
    }

    if (leaderMember.role !== 'leader' && leaderMember.role !== 'co-leader') {
      return { success: false, message: 'Você não tem permissão para rebaixar membros.' };
    }

    const targetMember = await clanRepository.getMember(targetId);
    if (!targetMember || targetMember.clanId !== leaderMember.clanId) {
      return { success: false, message: 'Membro não encontrado no seu clã.' };
    }

    // Cannot demote yourself or someone of same/higher rank
    if (ROLE_HIERARCHY[targetMember.role] <= ROLE_HIERARCHY[leaderMember.role]) {
      return { success: false, message: 'Você não pode rebaixar este membro.' };
    }

    // Determine new role
    let newRole: ClanRole;
    switch (targetMember.role) {
      case 'co-leader':
        newRole = 'elder';
        await clanRepository.removeCoLeader(leaderMember.clanId, targetId);
        break;
      case 'elder':
        newRole = 'member';
        break;
      default:
        return { success: false, message: 'Este membro já está no cargo mínimo.' };
    }

    // Only leader can demote co-leaders
    if (targetMember.role === 'co-leader' && leaderMember.role !== 'leader') {
      return { success: false, message: 'Apenas o líder pode rebaixar Vice-Líderes.' };
    }

    await clanRepository.updateMemberRole(targetId, newRole);

    return {
      success: true,
      message: `Membro rebaixado para **${ROLE_NAMES[newRole]}**.`,
    };
  }

  async kickMember(
    leaderId: string,
    targetId: string
  ): Promise<ClanActionResult> {
    const leaderMember = await clanRepository.getMember(leaderId);
    if (!leaderMember) {
      return { success: false, message: 'Você não faz parte de um clã.' };
    }

    if (leaderMember.role !== 'leader' && leaderMember.role !== 'co-leader') {
      return { success: false, message: 'Você não tem permissão para expulsar membros.' };
    }

    const targetMember = await clanRepository.getMember(targetId);
    if (!targetMember || targetMember.clanId !== leaderMember.clanId) {
      return { success: false, message: 'Membro não encontrado no seu clã.' };
    }

    // Cannot kick yourself or someone of same/higher rank
    if (ROLE_HIERARCHY[targetMember.role] <= ROLE_HIERARCHY[leaderMember.role]) {
      return { success: false, message: 'Você não pode expulsar este membro.' };
    }

    // Remove member
    await clanRepository.removeMember(targetId);
    await clanRepository.decrementMemberCount(leaderMember.clanId);

    if (targetMember.role === 'co-leader') {
      await clanRepository.removeCoLeader(leaderMember.clanId, targetId);
    }

    return {
      success: true,
      message: 'Membro expulso do clã.',
    };
  }

  async transferLeadership(
    currentLeaderId: string,
    newLeaderId: string
  ): Promise<ClanActionResult> {
    const leaderMember = await clanRepository.getMember(currentLeaderId);
    if (!leaderMember || leaderMember.role !== 'leader') {
      return { success: false, message: 'Você não é o líder do clã.' };
    }

    const newLeaderMember = await clanRepository.getMember(newLeaderId);
    if (!newLeaderMember || newLeaderMember.clanId !== leaderMember.clanId) {
      return { success: false, message: 'Membro não encontrado no seu clã.' };
    }

    if (newLeaderMember.discordId === currentLeaderId) {
      return { success: false, message: 'Você já é o líder!' };
    }

    // Update clan leader
    await clanRepository.updateClan(leaderMember.clanId, { leaderId: newLeaderId });

    // Update roles
    await clanRepository.updateMemberRole(currentLeaderId, 'co-leader');
    await clanRepository.updateMemberRole(newLeaderId, 'leader');

    // Update co-leaders list
    await clanRepository.addCoLeader(leaderMember.clanId, currentLeaderId);
    await clanRepository.removeCoLeader(leaderMember.clanId, newLeaderId);

    return {
      success: true,
      message: 'Liderança transferida com sucesso!',
    };
  }

  async contributeCoins(
    discordId: string,
    amount: number
  ): Promise<ClanActionResult> {
    if (amount <= 0) {
      return { success: false, message: 'Valor inválido.' };
    }

    const member = await clanRepository.getMember(discordId);
    if (!member) {
      return { success: false, message: 'Você não faz parte de um clã.' };
    }

    const balance = await economyRepository.getBalance(discordId);
    if (balance < amount) {
      return { success: false, message: `Saldo insuficiente. (Saldo: ${balance})` };
    }

    // Transfer coins
    await economyRepository.removeCoins(discordId, amount, 'spend', 'Contribuição ao clã');
    await clanRepository.addClanCoins(member.clanId, amount);
    await clanRepository.addMemberContribution(discordId, 0, amount);

    // Check for level up
    await this.checkClanLevelUp(member.clanId);

    const clan = await clanRepository.getClanById(member.clanId);

    return {
      success: true,
      message: `Você contribuiu **${amount}** coins para o clã!`,
      clan: clan || undefined,
    };
  }

  async getUserClan(discordId: string): Promise<{
    clan: ClanDocument | null;
    member: ClanMemberDocument | null;
  }> {
    const member = await clanRepository.getMember(discordId);
    if (!member) {
      return { clan: null, member: null };
    }

    const clan = await clanRepository.getClanById(member.clanId);
    return { clan, member };
  }

  async getClanMembers(clanId: string): Promise<ClanMemberDocument[]> {
    return clanRepository.getClanMembers(clanId);
  }

  async getPublicClans(): Promise<ClanDocument[]> {
    return clanRepository.getPublicClans(20);
  }

  async getClanLeaderboard(): Promise<ClanDocument[]> {
    return clanRepository.getClanLeaderboard(10);
  }

  async checkClanLevelUp(clanId: string): Promise<boolean> {
    const clan = await clanRepository.getClanById(clanId);
    if (!clan || clan.level >= 10) return false;

    const xpNeeded = CLAN_XP_FOR_LEVEL(clan.level);
    if (clan.experience < xpNeeded) return false;

    const newLevel = clan.level + 1;
    const newMaxMembers = CLAN_MEMBERS_FOR_LEVEL[newLevel] || clan.maxMembers + 5;

    await clanRepository.levelUpClan(clanId, newLevel, newMaxMembers);
    logger.info(`Clan ${clan.name} leveled up to ${newLevel}`);

    return true;
  }

  getXpForLevel(level: number): number {
    return CLAN_XP_FOR_LEVEL(level);
  }

  getRoleName(role: ClanRole): string {
    return ROLE_NAMES[role];
  }

  getCreationCost(): number {
    return CLAN_CREATION_COST;
  }
}

export const clanService = new ClanService();
export default clanService;
