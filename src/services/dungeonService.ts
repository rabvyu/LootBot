// Serviço de Dungeons Cooperativas
import { v4 as uuidv4 } from 'uuid';
import {
  DungeonRun,
  DungeonRunDocument,
  DungeonParticipant,
  DungeonWave,
  DungeonLoot,
  Character,
  User,
  Guild,
  CharacterInventory,
} from '../database/models';
import {
  DUNGEONS,
  DungeonData,
  getDungeonById,
  calculateMonsterStats,
  calculateBossStats,
  DungeonReward,
} from '../data/dungeons';
import { guildService } from './guildService';
import { logger } from '../utils/logger';

export interface DungeonResult {
  success: boolean;
  message: string;
  run?: DungeonRunDocument;
  embed?: {
    title: string;
    description: string;
    color: number;
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
  };
}

export interface WaveResult {
  success: boolean;
  message: string;
  waveCompleted: boolean;
  monstersKilled: number;
  damageDealt: Record<string, number>;
  damageTaken: Record<string, number>;
  deaths: string[];
  nextWave?: number;
  isBossWave?: boolean;
}

export interface BossResult {
  success: boolean;
  message: string;
  bossDefeated: boolean;
  damageDealt: Record<string, number>;
  phase: number;
  enraged: boolean;
}

class DungeonService {
  // Cooldowns em memória (discord ID -> Map<dungeonId, timestamp>)
  private cooldowns: Map<string, Map<string, Date>> = new Map();

  // ==================== CRIAÇÃO E GERENCIAMENTO ====================

  // Criar uma nova dungeon run
  async createRun(
    dungeonId: string,
    leaderId: string,
    leaderUsername: string,
    channelId: string,
    guildMode: boolean = false
  ): Promise<DungeonResult> {
    const dungeon = getDungeonById(dungeonId);
    if (!dungeon) {
      return { success: false, message: 'Dungeon não encontrada.' };
    }

    // Verificar se já está em uma dungeon
    const existingRun = await this.getActiveRunForPlayer(leaderId);
    if (existingRun) {
      return { success: false, message: 'Você já está em uma dungeon ativa.' };
    }

    // Verificar cooldown
    const cooldownResult = this.checkCooldown(leaderId, dungeonId);
    if (!cooldownResult.canRun) {
      return { success: false, message: cooldownResult.message };
    }

    // Verificar personagem
    const character = await Character.findOne({ discordId: leaderId });
    if (!character) {
      return { success: false, message: 'Você precisa criar um personagem primeiro.' };
    }

    if (character.level < dungeon.minLevel) {
      return { success: false, message: `Nível mínimo: ${dungeon.minLevel}. Você está no nível ${character.level}.` };
    }

    // Verificar guilda se necessário
    let guildId: string | undefined;
    let guildName: string | undefined;

    if (dungeon.requiresGuild || guildMode) {
      const guild = await guildService.getPlayerGuild(leaderId);
      if (!guild) {
        return { success: false, message: 'Esta dungeon requer que você esteja em uma guilda.' };
      }
      guildId = guild.guildId;
      guildName = guild.name;
    }

    // Criar run
    const run = new DungeonRun({
      runId: uuidv4(),
      dungeonId,
      dungeonName: dungeon.name,
      difficulty: dungeon.difficulty,
      guildId,
      guildName,
      leaderId,
      leaderUsername,
      participants: [{
        discordId: leaderId,
        username: leaderUsername,
        level: character.level,
        class: character.class,
        damageDealt: 0,
        healingDone: 0,
        deaths: 0,
        joinedAt: new Date(),
        isReady: true,
      }],
      minPlayers: dungeon.minPlayers,
      maxPlayers: dungeon.maxPlayers,
      status: 'forming',
      currentWave: 0,
      totalWaves: dungeon.totalWaves,
      waves: [],
      channelId,
    });

    await run.save();

    logger.info(`Dungeon run created: ${dungeon.name} by ${leaderUsername}`);

    return {
      success: true,
      message: `Dungeon **${dungeon.name}** criada! Aguardando jogadores...`,
      run,
      embed: {
        title: `${dungeon.emoji} ${dungeon.name}`,
        description: `${dungeon.description}\n\nLíder: **${leaderUsername}**\nJogadores: 1/${dungeon.maxPlayers} (mín: ${dungeon.minPlayers})`,
        color: this.getDifficultyColor(dungeon.difficulty),
        fields: [
          { name: 'Dificuldade', value: dungeon.difficulty.toUpperCase(), inline: true },
          { name: 'Waves', value: `${dungeon.totalWaves}`, inline: true },
          { name: 'Nível Mín', value: `${dungeon.minLevel}`, inline: true },
        ],
      },
    };
  }

  // Entrar em uma dungeon
  async joinRun(runId: string, playerId: string, playerUsername: string): Promise<DungeonResult> {
    const run = await DungeonRun.findOne({ runId, status: 'forming' });
    if (!run) {
      return { success: false, message: 'Dungeon não encontrada ou já iniciada.' };
    }

    // Verificar se já está na dungeon
    if (run.participants.some(p => p.discordId === playerId)) {
      return { success: false, message: 'Você já está nesta dungeon.' };
    }

    // Verificar se já está em outra dungeon
    const existingRun = await this.getActiveRunForPlayer(playerId);
    if (existingRun) {
      return { success: false, message: 'Você já está em outra dungeon ativa.' };
    }

    // Verificar limite
    if (run.participants.length >= run.maxPlayers) {
      return { success: false, message: 'A dungeon está cheia.' };
    }

    // Verificar personagem
    const character = await Character.findOne({ discordId: playerId });
    if (!character) {
      return { success: false, message: 'Você precisa criar um personagem primeiro.' };
    }

    const dungeon = getDungeonById(run.dungeonId);
    if (dungeon && character.level < dungeon.minLevel) {
      return { success: false, message: `Nível mínimo: ${dungeon.minLevel}. Você está no nível ${character.level}.` };
    }

    // Verificar guilda se necessário
    if (run.guildId) {
      const playerGuild = await guildService.getPlayerGuild(playerId);
      if (!playerGuild || playerGuild.guildId !== run.guildId) {
        return { success: false, message: 'Esta dungeon é exclusiva para membros da guilda.' };
      }
    }

    // Adicionar participante
    run.participants.push({
      discordId: playerId,
      username: playerUsername,
      level: character.level,
      class: character.class,
      damageDealt: 0,
      healingDone: 0,
      deaths: 0,
      joinedAt: new Date(),
      isReady: false,
    });

    await run.save();

    return {
      success: true,
      message: `**${playerUsername}** entrou na dungeon! (${run.participants.length}/${run.maxPlayers})`,
      run,
    };
  }

  // Sair de uma dungeon
  async leaveRun(playerId: string): Promise<DungeonResult> {
    const run = await this.getActiveRunForPlayer(playerId);
    if (!run) {
      return { success: false, message: 'Você não está em nenhuma dungeon.' };
    }

    if (run.status === 'in_progress') {
      // Marcar como morto mas não remover
      const participant = run.participants.find(p => p.discordId === playerId);
      if (participant) {
        participant.deaths += 1;
      }
      await run.save();
      return { success: true, message: 'Você abandonou a dungeon e foi marcado como derrotado.' };
    }

    // Remover da fase de formação
    if (run.leaderId === playerId) {
      // Líder saindo - cancelar run
      run.status = 'abandoned';
      await run.save();
      return { success: true, message: 'Você saiu e a dungeon foi cancelada.' };
    }

    run.participants = run.participants.filter(p => p.discordId !== playerId);
    await run.save();

    return { success: true, message: 'Você saiu da dungeon.' };
  }

  // Marcar como pronto
  async setReady(playerId: string, ready: boolean = true): Promise<DungeonResult> {
    const run = await this.getActiveRunForPlayer(playerId);
    if (!run) {
      return { success: false, message: 'Você não está em nenhuma dungeon.' };
    }

    if (run.status !== 'forming') {
      return { success: false, message: 'A dungeon já iniciou.' };
    }

    const participant = run.participants.find(p => p.discordId === playerId);
    if (!participant) {
      return { success: false, message: 'Erro ao encontrar seus dados.' };
    }

    participant.isReady = ready;
    await run.save();

    const readyCount = run.participants.filter(p => p.isReady).length;

    return {
      success: true,
      message: ready
        ? `✅ Você está pronto! (${readyCount}/${run.participants.length} prontos)`
        : `❌ Você não está mais pronto. (${readyCount}/${run.participants.length} prontos)`,
      run,
    };
  }

  // Iniciar dungeon
  async startRun(leaderId: string): Promise<DungeonResult> {
    const run = await DungeonRun.findOne({ leaderId, status: 'forming' });
    if (!run) {
      return { success: false, message: 'Você não é líder de nenhuma dungeon em formação.' };
    }

    // Verificar mínimo de jogadores
    if (run.participants.length < run.minPlayers) {
      return { success: false, message: `Mínimo de ${run.minPlayers} jogadores. Atual: ${run.participants.length}.` };
    }

    // Verificar se todos estão prontos
    const notReady = run.participants.filter(p => !p.isReady);
    if (notReady.length > 0) {
      const names = notReady.map(p => p.username).join(', ');
      return { success: false, message: `Aguardando jogadores: ${names}` };
    }

    // Gerar waves
    const dungeon = getDungeonById(run.dungeonId)!;
    run.waves = this.generateWaves(dungeon, run.participants.length);

    // Gerar boss
    const bossStats = calculateBossStats(dungeon.boss, dungeon.difficulty, run.participants.length);
    run.boss = {
      bossId: dungeon.boss.bossId,
      name: dungeon.boss.name,
      hp: bossStats.hp,
      maxHp: bossStats.hp,
      attack: bossStats.attack,
      defense: bossStats.defense,
      abilities: dungeon.boss.abilities,
      isAlive: true,
      phase: 1,
      enraged: false,
    };

    // Atualizar status
    run.status = 'in_progress';
    run.startedAt = new Date();
    run.currentWave = 1;

    // Aplicar cooldown para todos
    for (const participant of run.participants) {
      this.setCooldown(participant.discordId, run.dungeonId, dungeon.cooldownHours);
    }

    await run.save();

    logger.info(`Dungeon ${dungeon.name} started with ${run.participants.length} players`);

    return {
      success: true,
      message: `⚔️ A dungeon **${run.dungeonName}** começou!\n\n**Wave 1/${run.totalWaves}** - Prepare-se!`,
      run,
    };
  }

  // ==================== COMBATE ====================

  // Processar wave atual
  async processWave(runId: string): Promise<WaveResult> {
    const run = await DungeonRun.findOne({ runId, status: 'in_progress' });
    if (!run) {
      return { success: false, message: 'Dungeon não encontrada.', waveCompleted: false, monstersKilled: 0, damageDealt: {}, damageTaken: {}, deaths: [] };
    }

    const wave = run.waves[run.currentWave - 1];
    if (!wave || wave.completed) {
      return { success: false, message: 'Wave não encontrada ou já completada.', waveCompleted: false, monstersKilled: 0, damageDealt: {}, damageTaken: {}, deaths: [] };
    }

    wave.startedAt = new Date();

    // Simular combate da wave
    const result = await this.simulateWaveCombat(run, wave);

    if (result.waveCompleted) {
      wave.completed = true;
      wave.completedAt = new Date();

      // Verificar se era última wave antes do boss
      if (run.currentWave >= run.totalWaves) {
        result.isBossWave = true;
      } else {
        run.currentWave += 1;
        result.nextWave = run.currentWave;
      }
    }

    // Atualizar estatísticas dos participantes
    for (const [discordId, damage] of Object.entries(result.damageDealt)) {
      const participant = run.participants.find(p => p.discordId === discordId);
      if (participant) {
        participant.damageDealt += damage;
      }
    }

    run.totalDamageDealt += Object.values(result.damageDealt).reduce((a, b) => a + b, 0);

    await run.save();

    return result;
  }

  // Simular combate de wave
  private async simulateWaveCombat(run: DungeonRunDocument, wave: DungeonWave): Promise<WaveResult> {
    const result: WaveResult = {
      success: true,
      message: '',
      waveCompleted: false,
      monstersKilled: 0,
      damageDealt: {},
      damageTaken: {},
      deaths: [],
    };

    // Calcular poder total dos jogadores
    const characters = await Character.find({
      discordId: { $in: run.participants.map(p => p.discordId) },
    });

    const charMap = new Map(characters.map(c => [c.discordId, c]));

    // Inicializar dano por jogador
    for (const participant of run.participants) {
      result.damageDealt[participant.discordId] = 0;
      result.damageTaken[participant.discordId] = 0;
    }

    // Combate por turnos (simplificado)
    let aliveMonsters = wave.monsters.filter(m => m.isAlive);
    const maxTurns = 10;

    for (let turn = 0; turn < maxTurns && aliveMonsters.length > 0; turn++) {
      // Jogadores atacam
      for (const participant of run.participants) {
        const char = charMap.get(participant.discordId);
        if (!char) continue;

        const target = aliveMonsters[Math.floor(Math.random() * aliveMonsters.length)];
        if (!target) break;

        const damage = this.calculateDamage(char.stats.attack, target.defense);
        target.hp -= damage;
        result.damageDealt[participant.discordId] += damage;

        if (target.hp <= 0) {
          target.isAlive = false;
          result.monstersKilled += 1;
          aliveMonsters = wave.monsters.filter(m => m.isAlive);
        }
      }

      // Monstros atacam
      for (const monster of aliveMonsters) {
        const target = run.participants[Math.floor(Math.random() * run.participants.length)];
        const char = charMap.get(target.discordId);
        if (!char) continue;

        const damage = this.calculateDamage(monster.attack, char.stats.defense);
        result.damageTaken[target.discordId] += damage;

        // Chance de morte se dano > 50% HP
        if (damage > char.stats.maxHp * 0.5 && Math.random() < 0.1) {
          result.deaths.push(target.username);
          const participant = run.participants.find(p => p.discordId === target.discordId);
          if (participant) participant.deaths += 1;
        }
      }
    }

    result.waveCompleted = aliveMonsters.length === 0;
    result.message = result.waveCompleted
      ? `✅ Wave ${wave.waveNumber} completada! ${result.monstersKilled} monstros derrotados.`
      : `❌ Wave ${wave.waveNumber} falhou. ${aliveMonsters.length} monstros restantes.`;

    return result;
  }

  // Processar combate de boss
  async processBoss(runId: string): Promise<BossResult> {
    const run = await DungeonRun.findOne({ runId, status: 'in_progress' });
    if (!run || !run.boss) {
      return { success: false, message: 'Boss não encontrado.', bossDefeated: false, damageDealt: {}, phase: 1, enraged: false };
    }

    const dungeon = getDungeonById(run.dungeonId)!;
    const result: BossResult = {
      success: true,
      message: '',
      bossDefeated: false,
      damageDealt: {},
      phase: run.boss.phase,
      enraged: run.boss.enraged,
    };

    // Calcular poder dos jogadores
    const characters = await Character.find({
      discordId: { $in: run.participants.map(p => p.discordId) },
    });

    const charMap = new Map(characters.map(c => [c.discordId, c]));

    // Inicializar dano
    for (const participant of run.participants) {
      result.damageDealt[participant.discordId] = 0;
    }

    // Combate por turnos
    const maxTurns = 20;

    for (let turn = 0; turn < maxTurns && run.boss.isAlive; turn++) {
      // Jogadores atacam
      for (const participant of run.participants) {
        const char = charMap.get(participant.discordId);
        if (!char) continue;

        const damage = this.calculateDamage(char.stats.attack, run.boss.defense);
        run.boss.hp -= damage;
        result.damageDealt[participant.discordId] += damage;

        // Verificar fase
        const hpPercent = (run.boss.hp / run.boss.maxHp) * 100;
        if (hpPercent <= dungeon.boss.enrageThreshold && !run.boss.enraged) {
          run.boss.enraged = true;
          result.enraged = true;
        }

        // Avançar fase
        const phaseThresholds = [75, 50, 25, 10];
        for (let i = 0; i < phaseThresholds.length; i++) {
          if (hpPercent <= phaseThresholds[i] && run.boss.phase <= i + 1) {
            run.boss.phase = i + 2;
            result.phase = run.boss.phase;
          }
        }

        if (run.boss.hp <= 0) {
          run.boss.isAlive = false;
          result.bossDefeated = true;
          break;
        }
      }

      if (!run.boss.isAlive) break;

      // Boss ataca (dano em área quando enraged)
      const bossAttackMultiplier = run.boss.enraged ? 1.5 : 1.0;
      for (const participant of run.participants) {
        const char = charMap.get(participant.discordId);
        if (!char) continue;

        const damage = this.calculateDamage(
          run.boss.attack * bossAttackMultiplier,
          char.stats.defense
        );

        // Chance de morte
        if (damage > char.stats.maxHp * 0.4 && Math.random() < 0.15) {
          const p = run.participants.find(p => p.discordId === participant.discordId);
          if (p) p.deaths += 1;
        }
      }
    }

    // Atualizar estatísticas
    for (const [discordId, damage] of Object.entries(result.damageDealt)) {
      const participant = run.participants.find(p => p.discordId === discordId);
      if (participant) {
        participant.damageDealt += damage;
      }
    }

    run.totalDamageDealt += Object.values(result.damageDealt).reduce((a, b) => a + b, 0);

    if (result.bossDefeated) {
      run.status = 'completed';
      run.success = true;
      run.completedAt = new Date();

      // Distribuir loot
      await this.distributeLoot(run);

      // Atualizar guilda
      if (run.guildId) {
        const guild = await Guild.findOne({ guildId: run.guildId });
        if (guild) {
          guild.stats.dungeonsCompleted += 1;
          guild.stats.bossesKilled += 1;
          await guildService.addGuildXP(guild, 500);
          await guild.save();
        }
      }

      result.message = `🏆 **${run.boss.name}** foi derrotado! A dungeon foi completada!`;
    } else {
      result.message = `⚔️ Boss HP: ${run.boss.hp.toLocaleString()}/${run.boss.maxHp.toLocaleString()} (Fase ${run.boss.phase})`;
    }

    await run.save();

    return result;
  }

  // Calcular dano
  private calculateDamage(attack: number, defense: number): number {
    const baseDamage = attack - defense * 0.5;
    const variance = 0.2;
    const multiplier = 1 + (Math.random() * variance * 2 - variance);
    return Math.max(1, Math.floor(baseDamage * multiplier));
  }

  // ==================== LOOT ====================

  // Distribuir loot baseado em contribuição
  private async distributeLoot(run: DungeonRunDocument): Promise<void> {
    const dungeon = getDungeonById(run.dungeonId);
    if (!dungeon) return;

    const totalDamage = run.participants.reduce((sum, p) => sum + p.damageDealt, 0);
    if (totalDamage === 0) return;

    // Bônus de tempo
    let timeMultiplier = 1.0;
    if (run.startedAt && run.completedAt) {
      const minutes = (run.completedAt.getTime() - run.startedAt.getTime()) / 60000;
      if (minutes <= dungeon.timeBonus.fastMinutes) {
        timeMultiplier = 1 + dungeon.timeBonus.bonusPercent / 100;
      }
    }

    for (const participant of run.participants) {
      const contribution = participant.damageDealt / totalDamage;
      const loot: DungeonLoot = {
        discordId: participant.discordId,
        coins: 0,
        xp: 0,
        items: [],
        materials: [],
      };

      for (const reward of dungeon.baseRewards) {
        // Chance de drop
        if (Math.random() * 100 > reward.chance) continue;

        // Quantidade baseada em contribuição
        const baseAmount = reward.minAmount + Math.random() * (reward.maxAmount - reward.minAmount);
        const amount = Math.floor(baseAmount * contribution * timeMultiplier);

        if (amount <= 0) continue;

        switch (reward.type) {
          case 'coins':
            loot.coins += amount;
            break;
          case 'xp':
            loot.xp += amount;
            break;
          case 'material':
            loot.materials.push({
              materialId: reward.id!,
              materialName: reward.name,
              quantity: amount,
            });
            break;
          case 'item':
          case 'equipment':
            if (Math.random() < contribution * 2) { // Maior contribuição = maior chance
              loot.items.push({
                itemId: reward.id!,
                itemName: reward.name,
                rarity: reward.rarity || 'common',
                quantity: 1,
              });
            }
            break;
        }
      }

      run.loot.push(loot);

      // Aplicar recompensas
      await this.applyLoot(participant.discordId, loot);
    }
  }

  // Aplicar loot ao jogador
  private async applyLoot(discordId: string, loot: DungeonLoot): Promise<void> {
    const user = await User.findOne({ discordId });
    const character = await Character.findOne({ discordId });

    if (user) {
      user.coins += loot.coins;
      await user.save();
    }

    if (character) {
      character.experience += loot.xp;
      await character.save();
    }

    // Adicionar materiais ao inventário
    if (loot.materials.length > 0) {
      let inventory = await CharacterInventory.findOne({ discordId });
      if (!inventory) {
        inventory = new CharacterInventory({ discordId, consumables: [], materials: [] });
      }

      for (const mat of loot.materials) {
        const existing = inventory.materials.find(m => m.itemId === mat.materialId);
        if (existing) {
          existing.quantity += mat.quantity;
        } else {
          inventory.materials.push({
            itemId: mat.materialId,
            quantity: mat.quantity,
            acquiredAt: new Date(),
          });
        }
      }

      await inventory.save();
    }
  }

  // ==================== WAVES ====================

  // Gerar waves da dungeon
  private generateWaves(dungeon: DungeonData, playerCount: number): DungeonWave[] {
    const waves: DungeonWave[] = [];

    for (let i = 1; i <= dungeon.totalWaves; i++) {
      const monsterCount = dungeon.monstersPerWave.min +
        Math.floor(Math.random() * (dungeon.monstersPerWave.max - dungeon.monstersPerWave.min + 1));

      const monsters = [];
      for (let j = 0; j < monsterCount; j++) {
        const monsterData = dungeon.monsters[Math.floor(Math.random() * dungeon.monsters.length)];
        const stats = calculateMonsterStats(monsterData, i, dungeon.difficulty);

        // Escalar por número de jogadores
        const playerMultiplier = 1 + (playerCount - 3) * 0.15;

        monsters.push({
          monsterId: monsterData.monsterId,
          name: monsterData.name,
          hp: Math.floor(stats.hp * playerMultiplier),
          maxHp: Math.floor(stats.hp * playerMultiplier),
          attack: Math.floor(stats.attack * playerMultiplier),
          defense: Math.floor(stats.defense * playerMultiplier),
          isAlive: true,
        });
      }

      waves.push({
        waveNumber: i,
        monsters,
        completed: false,
      });
    }

    return waves;
  }

  // ==================== COOLDOWNS ====================

  private checkCooldown(discordId: string, dungeonId: string): { canRun: boolean; message: string } {
    const playerCooldowns = this.cooldowns.get(discordId);
    if (!playerCooldowns) {
      return { canRun: true, message: '' };
    }

    const cooldownEnd = playerCooldowns.get(dungeonId);
    if (!cooldownEnd || new Date() >= cooldownEnd) {
      return { canRun: true, message: '' };
    }

    const remainingMs = cooldownEnd.getTime() - Date.now();
    const remainingHours = Math.ceil(remainingMs / 3600000);

    return {
      canRun: false,
      message: `Cooldown ativo. Aguarde ${remainingHours}h para entrar novamente nesta dungeon.`,
    };
  }

  private setCooldown(discordId: string, dungeonId: string, hours: number): void {
    if (!this.cooldowns.has(discordId)) {
      this.cooldowns.set(discordId, new Map());
    }

    const cooldownEnd = new Date();
    cooldownEnd.setHours(cooldownEnd.getHours() + hours);

    this.cooldowns.get(discordId)!.set(dungeonId, cooldownEnd);
  }

  // ==================== QUERIES ====================

  // Obter run ativa de um jogador
  async getActiveRunForPlayer(discordId: string): Promise<DungeonRunDocument | null> {
    return DungeonRun.findOne({
      'participants.discordId': discordId,
      status: { $in: ['forming', 'in_progress'] },
    });
  }

  // Obter run por ID
  async getRunById(runId: string): Promise<DungeonRunDocument | null> {
    return DungeonRun.findOne({ runId });
  }

  // Obter runs abertas
  async getOpenRuns(): Promise<DungeonRunDocument[]> {
    return DungeonRun.find({ status: 'forming' }).sort({ createdAt: -1 }).limit(10);
  }

  // Obter histórico de um jogador
  async getPlayerHistory(discordId: string, limit: number = 10): Promise<DungeonRunDocument[]> {
    return DungeonRun.find({
      'participants.discordId': discordId,
      status: { $in: ['completed', 'failed'] },
    })
      .sort({ completedAt: -1 })
      .limit(limit);
  }

  // ==================== UTILITÁRIOS ====================

  private getDifficultyColor(difficulty: string): number {
    const colors: Record<string, number> = {
      normal: 0x2ECC71,
      hard: 0xF1C40F,
      extreme: 0xE74C3C,
      impossible: 0x9B59B6,
    };
    return colors[difficulty] || 0x3498DB;
  }

  // Cancelar runs antigas em formação (para cron job)
  async cleanupOldRuns(): Promise<number> {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const result = await DungeonRun.updateMany(
      { status: 'forming', createdAt: { $lt: oneHourAgo } },
      { status: 'abandoned' }
    );

    return result.modifiedCount;
  }
}

export const dungeonService = new DungeonService();
export default dungeonService;
