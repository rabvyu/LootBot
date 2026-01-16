// Serviço de Guildas
import { v4 as uuidv4 } from 'uuid';
import {
  Guild,
  GuildDocument,
  GuildRole,
  GuildMember,
  GuildActivityLog,
  GuildInvite,
  GuildInviteDocument,
  User,
  Character,
} from '../database/models';
import { logger } from '../utils/logger';

// Constantes
const GUILD_CREATE_COST = 50000;
const MAX_GUILD_MEMBERS_BASE = 20;
const MEMBERS_PER_LEVEL = 5;
const INVITE_EXPIRY_HOURS = 48;
const XP_PER_LEVEL = 1000;

// Permissões por cargo
const ROLE_PERMISSIONS: Record<GuildRole, string[]> = {
  leader: ['all'],
  vice_leader: ['invite', 'kick', 'promote_officer', 'demote', 'bank_withdraw', 'bank_deposit', 'start_dungeon'],
  officer: ['invite', 'bank_deposit', 'start_dungeon'],
  member: ['bank_deposit'],
};

// Hierarquia de cargos
const ROLE_HIERARCHY: Record<GuildRole, number> = {
  leader: 4,
  vice_leader: 3,
  officer: 2,
  member: 1,
};

export interface GuildResult {
  success: boolean;
  message: string;
  guild?: GuildDocument;
  invite?: GuildInviteDocument;
}

export interface GuildInfoView {
  guild: GuildDocument;
  memberCount: number;
  maxMembers: number;
  xpToNextLevel: number;
  onlineMembers: number;
}

class GuildService {
  // ==================== CRIAÇÃO E INFO ====================

  // Criar nova guilda
  async createGuild(
    leaderId: string,
    leaderUsername: string,
    name: string,
    tag: string,
    description?: string,
    emoji?: string
  ): Promise<GuildResult> {
    // Verificar se já está em uma guilda
    const existingGuild = await this.getPlayerGuild(leaderId);
    if (existingGuild) {
      return { success: false, message: 'Você já faz parte de uma guilda. Saia primeiro para criar uma nova.' };
    }

    // Verificar coins
    const user = await User.findOne({ discordId: leaderId });
    if (!user || user.coins < GUILD_CREATE_COST) {
      return { success: false, message: `Você precisa de ${GUILD_CREATE_COST.toLocaleString()} coins para criar uma guilda.` };
    }

    // Verificar nome único
    const nameExists = await Guild.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (nameExists) {
      return { success: false, message: 'Já existe uma guilda com esse nome.' };
    }

    // Verificar tag única
    const tagExists = await Guild.findOne({ tag: { $regex: new RegExp(`^${tag}$`, 'i') } });
    if (tagExists) {
      return { success: false, message: 'Já existe uma guilda com essa tag.' };
    }

    // Validar tag
    if (tag.length < 2 || tag.length > 5) {
      return { success: false, message: 'A tag deve ter entre 2 e 5 caracteres.' };
    }

    // Validar nome
    if (name.length < 3 || name.length > 32) {
      return { success: false, message: 'O nome deve ter entre 3 e 32 caracteres.' };
    }

    // Cobrar coins
    user.coins -= GUILD_CREATE_COST;
    await user.save();

    // Criar guilda
    const guild = new Guild({
      guildId: uuidv4(),
      name,
      tag: tag.toUpperCase(),
      description: description || '',
      emoji: emoji || '⚔️',
      leaderId,
      members: [{
        discordId: leaderId,
        username: leaderUsername,
        role: 'leader' as GuildRole,
        joinedAt: new Date(),
        contributionXP: 0,
        contributionCoins: 0,
        weeklyActivity: 0,
        lastActive: new Date(),
      }],
      level: 1,
      experience: 0,
      status: 'active',
      bank: { coins: 0, resources: [] },
      upgrades: [],
      settings: {
        isPublic: false,
        minLevelToJoin: 1,
        autoAcceptInvites: false,
        bankWithdrawRole: 'vice_leader',
      },
      stats: {
        totalXPEarned: 0,
        totalCoinsEarned: 0,
        dungeonsCompleted: 0,
        bossesKilled: 0,
        warsWon: 0,
        warsLost: 0,
        membersRecruited: 0,
      },
      activityLogs: [{
        type: 'level_up',
        actorId: leaderId,
        details: 'Guilda criada!',
        timestamp: new Date(),
      }],
    });

    await guild.save();

    logger.info(`Guild created: ${name} [${tag}] by ${leaderUsername}`);

    return {
      success: true,
      message: `Guilda **${name}** [${tag}] criada com sucesso! 🎉`,
      guild,
    };
  }

  // Obter guilda do jogador
  async getPlayerGuild(discordId: string): Promise<GuildDocument | null> {
    return Guild.findOne({ 'members.discordId': discordId });
  }

  // Obter guilda por ID
  async getGuildById(guildId: string): Promise<GuildDocument | null> {
    return Guild.findOne({ guildId });
  }

  // Obter guilda por nome
  async getGuildByName(name: string): Promise<GuildDocument | null> {
    return Guild.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
  }

  // Obter info completa da guilda
  async getGuildInfo(guildId: string): Promise<GuildInfoView | null> {
    const guild = await this.getGuildById(guildId);
    if (!guild) return null;

    const maxMembers = MAX_GUILD_MEMBERS_BASE + (guild.level - 1) * MEMBERS_PER_LEVEL;
    const xpToNextLevel = Math.floor(XP_PER_LEVEL * Math.pow(guild.level, 1.5));

    // Contar membros online (ativos nas últimas 24h)
    const onlineThreshold = new Date();
    onlineThreshold.setHours(onlineThreshold.getHours() - 24);
    const onlineMembers = guild.members.filter(m => m.lastActive >= onlineThreshold).length;

    return {
      guild,
      memberCount: guild.members.length,
      maxMembers,
      xpToNextLevel,
      onlineMembers,
    };
  }

  // ==================== CONVITES ====================

  // Convidar membro
  async inviteMember(
    inviterId: string,
    inviterUsername: string,
    inviteeId: string,
    inviteeUsername: string
  ): Promise<GuildResult> {
    // Verificar se quem convida está em uma guilda
    const guild = await this.getPlayerGuild(inviterId);
    if (!guild) {
      return { success: false, message: 'Você não faz parte de nenhuma guilda.' };
    }

    // Verificar permissão
    const inviterMember = guild.members.find(m => m.discordId === inviterId);
    if (!inviterMember || !this.hasPermission(inviterMember.role, 'invite')) {
      return { success: false, message: 'Você não tem permissão para convidar membros.' };
    }

    // Verificar se o convidado já está em uma guilda
    const inviteeGuild = await this.getPlayerGuild(inviteeId);
    if (inviteeGuild) {
      return { success: false, message: 'Este jogador já faz parte de uma guilda.' };
    }

    // Verificar limite de membros
    const maxMembers = MAX_GUILD_MEMBERS_BASE + (guild.level - 1) * MEMBERS_PER_LEVEL;
    if (guild.members.length >= maxMembers) {
      return { success: false, message: `A guilda atingiu o limite de ${maxMembers} membros.` };
    }

    // Verificar nível mínimo
    const inviteeChar = await Character.findOne({ discordId: inviteeId });
    if (inviteeChar && inviteeChar.level < guild.settings.minLevelToJoin) {
      return { success: false, message: `O jogador precisa ser nível ${guild.settings.minLevelToJoin}+ para entrar.` };
    }

    // Verificar convite pendente
    const existingInvite = await GuildInvite.findOne({
      guildId: guild.guildId,
      inviteeId,
      status: 'pending',
    });
    if (existingInvite) {
      return { success: false, message: 'Já existe um convite pendente para este jogador.' };
    }

    // Criar convite
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + INVITE_EXPIRY_HOURS);

    const invite = new GuildInvite({
      inviteId: uuidv4(),
      guildId: guild.guildId,
      guildName: guild.name,
      inviterId,
      inviterUsername,
      inviteeId,
      inviteeUsername,
      status: 'pending',
      expiresAt,
    });

    await invite.save();

    // Log
    this.addActivityLog(guild, {
      type: 'join',
      actorId: inviterId,
      targetId: inviteeId,
      details: `${inviterUsername} convidou ${inviteeUsername}`,
      timestamp: new Date(),
    });

    logger.info(`Guild invite: ${inviterUsername} invited ${inviteeUsername} to ${guild.name}`);

    return {
      success: true,
      message: `Convite enviado para **${inviteeUsername}**! Expira em ${INVITE_EXPIRY_HOURS}h.`,
      invite,
    };
  }

  // Aceitar convite
  async acceptInvite(inviteeId: string, inviteeUsername: string, inviteId?: string): Promise<GuildResult> {
    // Buscar convite (mais recente se não especificado)
    let invite: GuildInviteDocument | null;
    if (inviteId) {
      invite = await GuildInvite.findOne({ inviteId, inviteeId, status: 'pending' });
    } else {
      invite = await GuildInvite.findOne({ inviteeId, status: 'pending' }).sort({ createdAt: -1 });
    }

    if (!invite) {
      return { success: false, message: 'Nenhum convite pendente encontrado.' };
    }

    // Verificar expiração
    if (new Date() > invite.expiresAt) {
      invite.status = 'expired';
      await invite.save();
      return { success: false, message: 'Este convite expirou.' };
    }

    // Verificar se já está em guilda
    const existingGuild = await this.getPlayerGuild(inviteeId);
    if (existingGuild) {
      return { success: false, message: 'Você já faz parte de uma guilda.' };
    }

    // Obter guilda
    const guild = await this.getGuildById(invite.guildId);
    if (!guild) {
      invite.status = 'cancelled';
      await invite.save();
      return { success: false, message: 'A guilda não existe mais.' };
    }

    // Verificar limite
    const maxMembers = MAX_GUILD_MEMBERS_BASE + (guild.level - 1) * MEMBERS_PER_LEVEL;
    if (guild.members.length >= maxMembers) {
      return { success: false, message: 'A guilda atingiu o limite de membros.' };
    }

    // Adicionar membro
    guild.members.push({
      discordId: inviteeId,
      username: inviteeUsername,
      role: 'member',
      joinedAt: new Date(),
      contributionXP: 0,
      contributionCoins: 0,
      weeklyActivity: 0,
      lastActive: new Date(),
    });

    guild.stats.membersRecruited += 1;

    // Atualizar convite
    invite.status = 'accepted';
    invite.respondedAt = new Date();

    // Log
    this.addActivityLog(guild, {
      type: 'join',
      actorId: inviteeId,
      details: `${inviteeUsername} entrou na guilda`,
      timestamp: new Date(),
    });

    await guild.save();
    await invite.save();

    logger.info(`${inviteeUsername} joined guild ${guild.name}`);

    return {
      success: true,
      message: `Você entrou na guilda **${guild.name}** [${guild.tag}]! 🎉`,
      guild,
    };
  }

  // Recusar convite
  async declineInvite(inviteeId: string, inviteId?: string): Promise<GuildResult> {
    let invite: GuildInviteDocument | null;
    if (inviteId) {
      invite = await GuildInvite.findOne({ inviteId, inviteeId, status: 'pending' });
    } else {
      invite = await GuildInvite.findOne({ inviteeId, status: 'pending' }).sort({ createdAt: -1 });
    }

    if (!invite) {
      return { success: false, message: 'Nenhum convite pendente encontrado.' };
    }

    invite.status = 'declined';
    invite.respondedAt = new Date();
    await invite.save();

    return { success: true, message: `Convite da guilda **${invite.guildName}** recusado.` };
  }

  // Listar convites pendentes
  async getPendingInvites(discordId: string): Promise<GuildInviteDocument[]> {
    return GuildInvite.find({
      inviteeId: discordId,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });
  }

  // ==================== MEMBROS ====================

  // Sair da guilda
  async leaveGuild(discordId: string, username: string): Promise<GuildResult> {
    const guild = await this.getPlayerGuild(discordId);
    if (!guild) {
      return { success: false, message: 'Você não faz parte de nenhuma guilda.' };
    }

    const member = guild.members.find(m => m.discordId === discordId);
    if (!member) {
      return { success: false, message: 'Erro ao encontrar seus dados na guilda.' };
    }

    // Líder não pode sair sem transferir liderança
    if (member.role === 'leader') {
      if (guild.members.length > 1) {
        return { success: false, message: 'Transfira a liderança antes de sair ou expulse todos os membros.' };
      }
      // Se for o único membro, deletar guilda
      await Guild.deleteOne({ guildId: guild.guildId });
      await GuildInvite.deleteMany({ guildId: guild.guildId });
      logger.info(`Guild ${guild.name} disbanded by ${username}`);
      return { success: true, message: `A guilda **${guild.name}** foi dissolvida.` };
    }

    // Remover membro
    guild.members = guild.members.filter(m => m.discordId !== discordId);

    // Log
    this.addActivityLog(guild, {
      type: 'leave',
      actorId: discordId,
      details: `${username} saiu da guilda`,
      timestamp: new Date(),
    });

    await guild.save();

    logger.info(`${username} left guild ${guild.name}`);

    return { success: true, message: `Você saiu da guilda **${guild.name}**.` };
  }

  // Expulsar membro
  async kickMember(kickerId: string, kickerUsername: string, targetId: string): Promise<GuildResult> {
    const guild = await this.getPlayerGuild(kickerId);
    if (!guild) {
      return { success: false, message: 'Você não faz parte de nenhuma guilda.' };
    }

    const kicker = guild.members.find(m => m.discordId === kickerId);
    if (!kicker || !this.hasPermission(kicker.role, 'kick')) {
      return { success: false, message: 'Você não tem permissão para expulsar membros.' };
    }

    const target = guild.members.find(m => m.discordId === targetId);
    if (!target) {
      return { success: false, message: 'Este jogador não está na sua guilda.' };
    }

    // Não pode expulsar cargo igual ou superior
    if (ROLE_HIERARCHY[target.role] >= ROLE_HIERARCHY[kicker.role]) {
      return { success: false, message: 'Você não pode expulsar alguém com cargo igual ou superior.' };
    }

    // Remover membro
    guild.members = guild.members.filter(m => m.discordId !== targetId);

    // Cancelar convites pendentes do expulso
    await GuildInvite.updateMany(
      { guildId: guild.guildId, inviterId: targetId, status: 'pending' },
      { status: 'cancelled' }
    );

    // Log
    this.addActivityLog(guild, {
      type: 'kick',
      actorId: kickerId,
      targetId,
      details: `${kickerUsername} expulsou ${target.username}`,
      timestamp: new Date(),
    });

    await guild.save();

    logger.info(`${kickerUsername} kicked ${target.username} from ${guild.name}`);

    return { success: true, message: `**${target.username}** foi expulso da guilda.` };
  }

  // Promover membro
  async promoteMember(promoterId: string, promoterUsername: string, targetId: string): Promise<GuildResult> {
    const guild = await this.getPlayerGuild(promoterId);
    if (!guild) {
      return { success: false, message: 'Você não faz parte de nenhuma guilda.' };
    }

    const promoter = guild.members.find(m => m.discordId === promoterId);
    if (!promoter) {
      return { success: false, message: 'Erro ao encontrar seus dados.' };
    }

    const target = guild.members.find(m => m.discordId === targetId);
    if (!target) {
      return { success: false, message: 'Este jogador não está na sua guilda.' };
    }

    // Determinar próximo cargo
    let newRole: GuildRole;
    switch (target.role) {
      case 'member':
        if (!this.hasPermission(promoter.role, 'promote_officer') && promoter.role !== 'leader') {
          return { success: false, message: 'Você não pode promover para Oficial.' };
        }
        newRole = 'officer';
        break;
      case 'officer':
        if (promoter.role !== 'leader') {
          return { success: false, message: 'Apenas o Líder pode promover para Vice-Líder.' };
        }
        newRole = 'vice_leader';
        break;
      case 'vice_leader':
        if (promoter.role !== 'leader') {
          return { success: false, message: 'Apenas o Líder pode transferir a liderança.' };
        }
        // Transferir liderança
        target.role = 'leader';
        promoter.role = 'vice_leader';
        guild.leaderId = targetId;

        this.addActivityLog(guild, {
          type: 'promote',
          actorId: promoterId,
          targetId,
          details: `${promoterUsername} transferiu a liderança para ${target.username}`,
          timestamp: new Date(),
        });

        await guild.save();
        return { success: true, message: `**${target.username}** agora é o novo Líder! ${promoterUsername} se tornou Vice-Líder.` };
      default:
        return { success: false, message: 'Este membro já está no cargo máximo.' };
    }

    target.role = newRole;

    // Log
    this.addActivityLog(guild, {
      type: 'promote',
      actorId: promoterId,
      targetId,
      details: `${promoterUsername} promoveu ${target.username} para ${this.getRoleName(newRole)}`,
      timestamp: new Date(),
    });

    await guild.save();

    return { success: true, message: `**${target.username}** foi promovido para **${this.getRoleName(newRole)}**!` };
  }

  // Rebaixar membro
  async demoteMember(demoterId: string, demoterUsername: string, targetId: string): Promise<GuildResult> {
    const guild = await this.getPlayerGuild(demoterId);
    if (!guild) {
      return { success: false, message: 'Você não faz parte de nenhuma guilda.' };
    }

    const demoter = guild.members.find(m => m.discordId === demoterId);
    if (!demoter || !this.hasPermission(demoter.role, 'demote')) {
      return { success: false, message: 'Você não tem permissão para rebaixar membros.' };
    }

    const target = guild.members.find(m => m.discordId === targetId);
    if (!target) {
      return { success: false, message: 'Este jogador não está na sua guilda.' };
    }

    // Não pode rebaixar cargo igual ou superior
    if (ROLE_HIERARCHY[target.role] >= ROLE_HIERARCHY[demoter.role]) {
      return { success: false, message: 'Você não pode rebaixar alguém com cargo igual ou superior.' };
    }

    // Determinar cargo inferior
    let newRole: GuildRole;
    switch (target.role) {
      case 'vice_leader':
        newRole = 'officer';
        break;
      case 'officer':
        newRole = 'member';
        break;
      default:
        return { success: false, message: 'Este membro já está no cargo mínimo.' };
    }

    target.role = newRole;

    // Log
    this.addActivityLog(guild, {
      type: 'demote',
      actorId: demoterId,
      targetId,
      details: `${demoterUsername} rebaixou ${target.username} para ${this.getRoleName(newRole)}`,
      timestamp: new Date(),
    });

    await guild.save();

    return { success: true, message: `**${target.username}** foi rebaixado para **${this.getRoleName(newRole)}**.` };
  }

  // ==================== BANCO ====================

  // Depositar no banco
  async depositToBank(discordId: string, username: string, amount: number): Promise<GuildResult> {
    if (amount <= 0) {
      return { success: false, message: 'Valor inválido.' };
    }

    const guild = await this.getPlayerGuild(discordId);
    if (!guild) {
      return { success: false, message: 'Você não faz parte de nenhuma guilda.' };
    }

    const member = guild.members.find(m => m.discordId === discordId);
    if (!member || !this.hasPermission(member.role, 'bank_deposit')) {
      return { success: false, message: 'Você não tem permissão para depositar.' };
    }

    const user = await User.findOne({ discordId });
    if (!user || user.coins < amount) {
      return { success: false, message: 'Você não tem coins suficientes.' };
    }

    // Transferir
    user.coins -= amount;
    guild.bank.coins += amount;
    guild.stats.totalCoinsEarned += amount;
    member.contributionCoins += amount;

    // XP para guilda
    const guildXP = Math.floor(amount / 100);
    await this.addGuildXP(guild, guildXP);

    // Log
    this.addActivityLog(guild, {
      type: 'deposit',
      actorId: discordId,
      details: `${username} depositou ${amount.toLocaleString()} coins`,
      timestamp: new Date(),
    });

    await user.save();
    await guild.save();

    return {
      success: true,
      message: `Depositou **${amount.toLocaleString()}** coins no banco da guilda!\nSaldo do banco: **${guild.bank.coins.toLocaleString()}** coins`,
      guild,
    };
  }

  // Sacar do banco
  async withdrawFromBank(discordId: string, username: string, amount: number): Promise<GuildResult> {
    if (amount <= 0) {
      return { success: false, message: 'Valor inválido.' };
    }

    const guild = await this.getPlayerGuild(discordId);
    if (!guild) {
      return { success: false, message: 'Você não faz parte de nenhuma guilda.' };
    }

    const member = guild.members.find(m => m.discordId === discordId);
    if (!member) {
      return { success: false, message: 'Erro ao encontrar seus dados.' };
    }

    // Verificar permissão de saque
    const minRole = guild.settings.bankWithdrawRole;
    if (ROLE_HIERARCHY[member.role] < ROLE_HIERARCHY[minRole]) {
      return { success: false, message: `Apenas ${this.getRoleName(minRole)} ou superior pode sacar.` };
    }

    if (guild.bank.coins < amount) {
      return { success: false, message: `O banco só tem ${guild.bank.coins.toLocaleString()} coins.` };
    }

    const user = await User.findOne({ discordId });
    if (!user) {
      return { success: false, message: 'Usuário não encontrado.' };
    }

    // Transferir
    guild.bank.coins -= amount;
    user.coins += amount;

    // Log
    this.addActivityLog(guild, {
      type: 'withdraw',
      actorId: discordId,
      details: `${username} sacou ${amount.toLocaleString()} coins`,
      timestamp: new Date(),
    });

    await user.save();
    await guild.save();

    return {
      success: true,
      message: `Sacou **${amount.toLocaleString()}** coins do banco da guilda!\nSaldo do banco: **${guild.bank.coins.toLocaleString()}** coins`,
      guild,
    };
  }

  // ==================== XP E NÍVEIS ====================

  // Adicionar XP à guilda
  async addGuildXP(guild: GuildDocument, amount: number): Promise<boolean> {
    guild.experience += amount;
    guild.stats.totalXPEarned += amount;

    const xpNeeded = Math.floor(XP_PER_LEVEL * Math.pow(guild.level, 1.5));

    let leveledUp = false;
    while (guild.experience >= xpNeeded) {
      guild.experience -= xpNeeded;
      guild.level += 1;
      leveledUp = true;

      this.addActivityLog(guild, {
        type: 'level_up',
        actorId: 'system',
        details: `A guilda subiu para o nível ${guild.level}!`,
        timestamp: new Date(),
      });

      logger.info(`Guild ${guild.name} leveled up to ${guild.level}`);
    }

    return leveledUp;
  }

  // Contribuir XP do membro
  async contributeMemberXP(discordId: string, amount: number): Promise<void> {
    const guild = await this.getPlayerGuild(discordId);
    if (!guild) return;

    const member = guild.members.find(m => m.discordId === discordId);
    if (member) {
      member.contributionXP += amount;
      member.weeklyActivity += amount;
      member.lastActive = new Date();

      // Guilda ganha 10% do XP do membro
      const guildXP = Math.floor(amount * 0.1);
      if (guildXP > 0) {
        await this.addGuildXP(guild, guildXP);
      }

      await guild.save();
    }
  }

  // ==================== RANKING ====================

  // Ranking de guildas
  async getGuildRanking(limit: number = 10): Promise<GuildDocument[]> {
    return Guild.find({ status: { $ne: 'inactive' } })
      .sort({ level: -1, experience: -1, 'stats.totalXPEarned': -1 })
      .limit(limit);
  }

  // Ranking de membros da guilda
  async getMemberRanking(guildId: string): Promise<GuildMember[]> {
    const guild = await this.getGuildById(guildId);
    if (!guild) return [];

    return [...guild.members].sort((a, b) => b.contributionXP - a.contributionXP);
  }

  // ==================== CONFIGURAÇÕES ====================

  // Atualizar configuração
  async updateSetting(
    discordId: string,
    setting: keyof GuildDocument['settings'],
    value: boolean | number | GuildRole
  ): Promise<GuildResult> {
    const guild = await this.getPlayerGuild(discordId);
    if (!guild) {
      return { success: false, message: 'Você não faz parte de nenhuma guilda.' };
    }

    const member = guild.members.find(m => m.discordId === discordId);
    if (!member || member.role !== 'leader') {
      return { success: false, message: 'Apenas o Líder pode alterar configurações.' };
    }

    (guild.settings as Record<string, boolean | number | GuildRole>)[setting] = value;
    await guild.save();

    return { success: true, message: `Configuração **${setting}** atualizada!`, guild };
  }

  // ==================== UTILIDADES ====================

  // Verificar permissão
  private hasPermission(role: GuildRole, permission: string): boolean {
    const perms = ROLE_PERMISSIONS[role];
    return perms.includes('all') || perms.includes(permission);
  }

  // Nome do cargo
  private getRoleName(role: GuildRole): string {
    const names: Record<GuildRole, string> = {
      leader: 'Líder',
      vice_leader: 'Vice-Líder',
      officer: 'Oficial',
      member: 'Membro',
    };
    return names[role];
  }

  // Emoji do cargo
  getRoleEmoji(role: GuildRole): string {
    const emojis: Record<GuildRole, string> = {
      leader: '👑',
      vice_leader: '⚔️',
      officer: '🛡️',
      member: '👤',
    };
    return emojis[role];
  }

  // Adicionar log de atividade
  private addActivityLog(guild: GuildDocument, log: GuildActivityLog): void {
    guild.activityLogs.push(log);
    // Manter apenas últimos 100 logs
    if (guild.activityLogs.length > 100) {
      guild.activityLogs = guild.activityLogs.slice(-100);
    }
  }

  // Resetar atividade semanal (para cron job)
  async resetWeeklyActivity(): Promise<void> {
    await Guild.updateMany(
      {},
      { $set: { 'members.$[].weeklyActivity': 0 } }
    );
    logger.info('Weekly guild activity reset');
  }
}

export const guildService = new GuildService();
export default guildService;
