// Serviço de Temporadas e Battle Pass
import {
  Season,
  BattlePass,
  PlayerBattlePass,
  ISeason,
  IBattlePass,
  IPlayerBattlePass,
  SeasonStatus,
  BattlePassReward,
  ClaimedReward,
} from '../database/models';
import { v4 as uuidv4 } from 'uuid';

// Configurações de temporada
const SEASON_CONFIG = {
  defaultDurationDays: 90,
  battlePassLevels: 100,
  xpPerLevel: 1000,
  premiumPrice: 9990, // Preço do premium em moedas
};

// ==================== SEASON MANAGEMENT ====================

// Obter temporada atual
export async function getCurrentSeason(): Promise<ISeason | null> {
  return await Season.findOne({ status: 'active' }).lean();
}

// Criar nova temporada
export async function createSeason(
  name: string,
  description: string,
  durationDays: number = SEASON_CONFIG.defaultDurationDays
): Promise<ISeason> {
  // Finalizar temporada anterior
  await Season.updateMany(
    { status: 'active' },
    { $set: { status: 'ended' } }
  );

  // Contar temporadas existentes
  const seasonCount = await Season.countDocuments();

  const startsAt = new Date();
  const endsAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

  const season = new Season({
    seasonId: uuidv4(),
    name,
    description,
    number: seasonCount + 1,
    status: 'active' as SeasonStatus,
    startsAt,
    endsAt,
    rewards: [],
  });

  await season.save();
  return season.toObject();
}

// Adicionar recompensas de ranking à temporada
export async function addSeasonRewards(
  seasonId: string,
  rewards: Array<{
    rankMin: number;
    rankMax: number;
    coins: number;
    materials?: Array<{ itemId: string; quantity: number }>;
    title?: string;
    cosmetics?: string[];
  }>
): Promise<{ success: boolean; message: string }> {
  const season = await Season.findOne({ seasonId });
  if (!season) {
    return { success: false, message: 'Temporada não encontrada.' };
  }

  season.rewards = rewards.map(r => ({
    rankMin: r.rankMin,
    rankMax: r.rankMax,
    coins: r.coins,
    materials: r.materials || [],
    title: r.title,
    cosmetics: r.cosmetics || [],
  }));

  await season.save();
  return { success: true, message: 'Recompensas adicionadas!' };
}

// Finalizar temporada
export async function endSeason(seasonId: string): Promise<{ success: boolean; message: string }> {
  const season = await Season.findOne({ seasonId, status: 'active' });
  if (!season) {
    return { success: false, message: 'Temporada não encontrada ou já finalizada.' };
  }

  season.status = 'ended';
  await season.save();

  return { success: true, message: `Temporada "${season.name}" finalizada!` };
}

// Obter todas temporadas
export async function getAllSeasons(): Promise<ISeason[]> {
  return await Season.find().sort({ number: -1 }).lean();
}

// ==================== BATTLE PASS MANAGEMENT ====================

// Criar Battle Pass para uma temporada
export async function createBattlePass(
  seasonId: string,
  name: string,
  premiumPrice: number = SEASON_CONFIG.premiumPrice
): Promise<IBattlePass> {
  // Desativar battle passes anteriores
  await BattlePass.updateMany({}, { $set: { isActive: false } });

  const rewards: BattlePassReward[] = [];

  // Gerar recompensas para cada nível
  for (let level = 1; level <= SEASON_CONFIG.battlePassLevels; level++) {
    const reward: BattlePassReward = {
      level,
    };

    // Recompensas gratuitas em níveis pares
    if (level % 2 === 0) {
      reward.freeReward = {
        type: level % 10 === 0 ? 'item' : 'coins',
        quantity: level % 10 === 0 ? 1 : level * 50,
        itemId: level % 10 === 0 ? `bp_item_${level}` : undefined,
      };
    }

    // Recompensas premium em todos os níveis
    reward.premiumReward = {
      type: level % 5 === 0 ? 'item' : 'coins',
      quantity: level % 5 === 0 ? 1 : level * 100,
      itemId: level % 5 === 0 ? `bp_premium_${level}` : undefined,
    };

    rewards.push(reward);
  }

  const battlePass = new BattlePass({
    seasonId,
    name,
    maxLevel: SEASON_CONFIG.battlePassLevels,
    xpPerLevel: SEASON_CONFIG.xpPerLevel,
    rewards,
    premiumPrice,
    isActive: true,
  });

  await battlePass.save();
  return battlePass.toObject();
}

// Obter Battle Pass ativo
export async function getActiveBattlePass(): Promise<IBattlePass | null> {
  return await BattlePass.findOne({ isActive: true }).lean();
}

// ==================== PLAYER BATTLE PASS ====================

// Obter ou criar progresso do jogador no Battle Pass
export async function getOrCreatePlayerBattlePass(
  odiscordId: string,
  seasonId: string
): Promise<IPlayerBattlePass> {
  let playerBP = await PlayerBattlePass.findOne({ odiscordId, seasonId });

  if (!playerBP) {
    playerBP = new PlayerBattlePass({
      odiscordId,
      seasonId,
      level: 1,
      xp: 0,
      isPremium: false,
      claimedRewards: [],
    });
    await playerBP.save();
  }

  return playerBP.toObject();
}

// Adicionar XP ao Battle Pass
export async function addBattlePassXp(
  odiscordId: string,
  seasonId: string,
  xpAmount: number
): Promise<{ success: boolean; playerBP?: IPlayerBattlePass; levelsGained: number; message: string }> {
  const battlePass = await BattlePass.findOne({ seasonId, isActive: true });
  if (!battlePass) {
    return { success: false, levelsGained: 0, message: 'Battle Pass não encontrado.' };
  }

  let playerBP = await PlayerBattlePass.findOne({ odiscordId, seasonId });
  if (!playerBP) {
    await getOrCreatePlayerBattlePass(odiscordId, seasonId);
    playerBP = await PlayerBattlePass.findOne({ odiscordId, seasonId });
    if (!playerBP) {
      return { success: false, levelsGained: 0, message: 'Erro ao criar Battle Pass.' };
    }
  }

  const startLevel = playerBP.level;
  playerBP.xp += xpAmount;

  // Calcular level ups
  while (playerBP.xp >= battlePass.xpPerLevel && playerBP.level < battlePass.maxLevel) {
    playerBP.xp -= battlePass.xpPerLevel;
    playerBP.level++;
  }

  // Cap XP se atingiu nível máximo
  if (playerBP.level >= battlePass.maxLevel) {
    playerBP.level = battlePass.maxLevel;
    playerBP.xp = battlePass.xpPerLevel;
  }

  const levelsGained = playerBP.level - startLevel;
  await playerBP.save();

  return {
    success: true,
    playerBP: playerBP.toObject(),
    levelsGained,
    message: levelsGained > 0
      ? `+${xpAmount} XP! Subiu para o nível ${playerBP.level}!`
      : `+${xpAmount} XP! (${playerBP.xp}/${battlePass.xpPerLevel})`,
  };
}

// Comprar Battle Pass Premium
export async function purchasePremium(
  odiscordId: string,
  seasonId: string
): Promise<{ success: boolean; price: number; message: string }> {
  const battlePass = await BattlePass.findOne({ seasonId, isActive: true });
  if (!battlePass) {
    return { success: false, price: 0, message: 'Battle Pass não encontrado.' };
  }

  let playerBP = await PlayerBattlePass.findOne({ odiscordId, seasonId });
  if (!playerBP) {
    await getOrCreatePlayerBattlePass(odiscordId, seasonId);
    playerBP = await PlayerBattlePass.findOne({ odiscordId, seasonId });
  }

  if (!playerBP) {
    return { success: false, price: 0, message: 'Erro ao acessar Battle Pass.' };
  }

  if (playerBP.isPremium) {
    return { success: false, price: 0, message: 'Você já tem o Premium!' };
  }

  playerBP.isPremium = true;
  playerBP.purchasedAt = new Date();
  await playerBP.save();

  return {
    success: true,
    price: battlePass.premiumPrice,
    message: 'Battle Pass Premium ativado! Você pode coletar todas as recompensas premium.',
  };
}

// Coletar recompensa do Battle Pass
export async function claimBattlePassReward(
  odiscordId: string,
  seasonId: string,
  level: number,
  type: 'free' | 'premium'
): Promise<{ success: boolean; reward?: any; message: string }> {
  const battlePass = await BattlePass.findOne({ seasonId, isActive: true });
  if (!battlePass) {
    return { success: false, message: 'Battle Pass não encontrado.' };
  }

  const playerBP = await PlayerBattlePass.findOne({ odiscordId, seasonId });
  if (!playerBP) {
    return { success: false, message: 'Você não tem progresso no Battle Pass.' };
  }

  // Verificar se atingiu o nível
  if (playerBP.level < level) {
    return { success: false, message: `Você precisa do nível ${level} para essa recompensa.` };
  }

  // Verificar se é premium e não tem acesso
  if (type === 'premium' && !playerBP.isPremium) {
    return { success: false, message: 'Essa recompensa requer Battle Pass Premium.' };
  }

  // Verificar se já coletou
  const alreadyClaimed = playerBP.claimedRewards.some(
    r => r.level === level && r.type === type
  );
  if (alreadyClaimed) {
    return { success: false, message: 'Recompensa já coletada.' };
  }

  // Buscar recompensa
  const rewardDef = battlePass.rewards.find(r => r.level === level);
  if (!rewardDef) {
    return { success: false, message: 'Recompensa não encontrada.' };
  }

  const reward = type === 'free' ? rewardDef.freeReward : rewardDef.premiumReward;
  if (!reward) {
    return { success: false, message: 'Não há recompensa desse tipo neste nível.' };
  }

  // Registrar coleta
  const claimed: ClaimedReward = {
    level,
    type,
    claimedAt: new Date(),
  };
  playerBP.claimedRewards.push(claimed);
  await playerBP.save();

  return {
    success: true,
    reward,
    message: `Recompensa do nível ${level} coletada!`,
  };
}

// Obter recompensas disponíveis para coletar
export async function getAvailableRewards(
  odiscordId: string,
  seasonId: string
): Promise<{ level: number; type: 'free' | 'premium'; reward: any }[]> {
  const battlePass = await BattlePass.findOne({ seasonId, isActive: true });
  if (!battlePass) return [];

  const playerBP = await PlayerBattlePass.findOne({ odiscordId, seasonId });
  if (!playerBP) return [];

  const available: { level: number; type: 'free' | 'premium'; reward: any }[] = [];

  for (const rewardDef of battlePass.rewards) {
    if (rewardDef.level > playerBP.level) continue;

    // Verificar recompensa gratuita
    if (rewardDef.freeReward) {
      const claimed = playerBP.claimedRewards.some(
        r => r.level === rewardDef.level && r.type === 'free'
      );
      if (!claimed) {
        available.push({
          level: rewardDef.level,
          type: 'free',
          reward: rewardDef.freeReward,
        });
      }
    }

    // Verificar recompensa premium
    if (rewardDef.premiumReward && playerBP.isPremium) {
      const claimed = playerBP.claimedRewards.some(
        r => r.level === rewardDef.level && r.type === 'premium'
      );
      if (!claimed) {
        available.push({
          level: rewardDef.level,
          type: 'premium',
          reward: rewardDef.premiumReward,
        });
      }
    }
  }

  return available;
}

// Obter progresso do jogador
export async function getPlayerProgress(
  odiscordId: string,
  seasonId: string
): Promise<{
  level: number;
  xp: number;
  xpRequired: number;
  isPremium: boolean;
  claimedCount: number;
  availableCount: number;
} | null> {
  const battlePass = await BattlePass.findOne({ seasonId, isActive: true });
  if (!battlePass) return null;

  const playerBP = await PlayerBattlePass.findOne({ odiscordId, seasonId });
  if (!playerBP) return null;

  const available = await getAvailableRewards(odiscordId, seasonId);

  return {
    level: playerBP.level,
    xp: playerBP.xp,
    xpRequired: battlePass.xpPerLevel,
    isPremium: playerBP.isPremium,
    claimedCount: playerBP.claimedRewards.length,
    availableCount: available.length,
  };
}

// Obter ranking da temporada
export async function getSeasonRanking(
  seasonId: string,
  limit: number = 20
): Promise<Array<{ odiscordId: string; level: number; isPremium: boolean; rank: number }>> {
  const players = await PlayerBattlePass.find({ seasonId })
    .sort({ level: -1, xp: -1 })
    .limit(limit)
    .lean();

  return players.map((p, index) => ({
    odiscordId: p.odiscordId,
    level: p.level,
    isPremium: p.isPremium,
    rank: index + 1,
  }));
}
