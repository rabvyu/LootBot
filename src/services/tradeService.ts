// Serviço de Trading P2P
import { Trade, ITrade, TradeStatus, TradeItem } from '../database/models';
import { v4 as uuidv4 } from 'uuid';

// Configurações de trade
const TRADE_CONFIG = {
  maxItemsPerSide: 10,
  maxCoinsPerTrade: 1000000,
  tradeTimeout: 10 * 60 * 1000, // 10 minutos
  cooldownBetweenTrades: 30 * 1000, // 30 segundos
};

export interface CreateTradeResult {
  success: boolean;
  trade?: ITrade;
  message: string;
}

export interface TradeActionResult {
  success: boolean;
  trade?: ITrade;
  message: string;
  completed?: boolean;
}

// Criar nova proposta de trade
export async function createTrade(
  initiatorId: string,
  initiatorName: string,
  targetId: string,
  targetName: string
): Promise<CreateTradeResult> {
  // Verificar se já existe trade ativo entre os usuários
  const existingTrade = await Trade.findOne({
    $or: [
      { initiatorId, targetId, status: 'pending' },
      { initiatorId: targetId, targetId: initiatorId, status: 'pending' },
    ],
  });

  if (existingTrade) {
    return { success: false, message: 'Já existe uma negociação ativa entre vocês.' };
  }

  // Verificar cooldown
  const recentTrade = await Trade.findOne({
    $or: [
      { initiatorId },
      { targetId: initiatorId },
    ],
    createdAt: { $gte: new Date(Date.now() - TRADE_CONFIG.cooldownBetweenTrades) },
  });

  if (recentTrade) {
    return { success: false, message: 'Aguarde alguns segundos antes de iniciar outra negociação.' };
  }

  const trade = new Trade({
    tradeId: uuidv4(),
    initiatorId,
    initiatorName,
    targetId,
    targetName,
    initiatorItems: [],
    targetItems: [],
    initiatorCoins: 0,
    targetCoins: 0,
    initiatorConfirmed: false,
    targetConfirmed: false,
    status: 'pending' as TradeStatus,
    expiresAt: new Date(Date.now() + TRADE_CONFIG.tradeTimeout),
  });

  await trade.save();

  return {
    success: true,
    trade: trade.toObject(),
    message: `Proposta de troca enviada para ${targetName}!`,
  };
}

// Aceitar proposta de trade
export async function acceptTrade(tradeId: string, userId: string): Promise<TradeActionResult> {
  const trade = await Trade.findOne({ tradeId, targetId: userId, status: 'pending' });

  if (!trade) {
    return { success: false, message: 'Proposta de troca não encontrada.' };
  }

  trade.status = 'negotiating';
  await trade.save();

  return {
    success: true,
    trade: trade.toObject(),
    message: 'Proposta aceita! Agora vocês podem adicionar itens à troca.',
  };
}

// Recusar proposta de trade
export async function declineTrade(tradeId: string, userId: string): Promise<TradeActionResult> {
  const trade = await Trade.findOne({
    tradeId,
    $or: [{ initiatorId: userId }, { targetId: userId }],
    status: { $in: ['pending', 'negotiating'] },
  });

  if (!trade) {
    return { success: false, message: 'Proposta de troca não encontrada.' };
  }

  trade.status = 'declined';
  await trade.save();

  return {
    success: true,
    trade: trade.toObject(),
    message: 'Troca recusada.',
  };
}

// Adicionar item à troca
export async function addItemToTrade(
  tradeId: string,
  userId: string,
  item: TradeItem
): Promise<TradeActionResult> {
  const trade = await Trade.findOne({
    tradeId,
    $or: [{ initiatorId: userId }, { targetId: userId }],
    status: 'negotiating',
  });

  if (!trade) {
    return { success: false, message: 'Troca não encontrada ou não está em negociação.' };
  }

  const isInitiator = trade.initiatorId === userId;
  const items = isInitiator ? trade.initiatorItems : trade.targetItems;

  if (items.length >= TRADE_CONFIG.maxItemsPerSide) {
    return { success: false, message: `Máximo de ${TRADE_CONFIG.maxItemsPerSide} itens por lado.` };
  }

  // Verificar se o item já está na troca
  const existingItem = items.find(i => i.itemId === item.itemId);
  if (existingItem) {
    return { success: false, message: 'Este item já está na troca.' };
  }

  items.push(item);

  // Reset confirmações quando alguém modifica a troca
  trade.initiatorConfirmed = false;
  trade.targetConfirmed = false;

  await trade.save();

  return {
    success: true,
    trade: trade.toObject(),
    message: `${item.itemName} adicionado à troca.`,
  };
}

// Remover item da troca
export async function removeItemFromTrade(
  tradeId: string,
  userId: string,
  itemId: string
): Promise<TradeActionResult> {
  const trade = await Trade.findOne({
    tradeId,
    $or: [{ initiatorId: userId }, { targetId: userId }],
    status: 'negotiating',
  });

  if (!trade) {
    return { success: false, message: 'Troca não encontrada ou não está em negociação.' };
  }

  const isInitiator = trade.initiatorId === userId;

  if (isInitiator) {
    trade.initiatorItems = trade.initiatorItems.filter(i => i.itemId !== itemId);
  } else {
    trade.targetItems = trade.targetItems.filter(i => i.itemId !== itemId);
  }

  // Reset confirmações
  trade.initiatorConfirmed = false;
  trade.targetConfirmed = false;

  await trade.save();

  return {
    success: true,
    trade: trade.toObject(),
    message: 'Item removido da troca.',
  };
}

// Definir moedas na troca
export async function setTradeCoins(
  tradeId: string,
  userId: string,
  amount: number
): Promise<TradeActionResult> {
  if (amount < 0) {
    return { success: false, message: 'Quantidade de moedas inválida.' };
  }

  if (amount > TRADE_CONFIG.maxCoinsPerTrade) {
    return { success: false, message: `Máximo de ${TRADE_CONFIG.maxCoinsPerTrade} moedas por troca.` };
  }

  const trade = await Trade.findOne({
    tradeId,
    $or: [{ initiatorId: userId }, { targetId: userId }],
    status: 'negotiating',
  });

  if (!trade) {
    return { success: false, message: 'Troca não encontrada ou não está em negociação.' };
  }

  const isInitiator = trade.initiatorId === userId;

  if (isInitiator) {
    trade.initiatorCoins = amount;
  } else {
    trade.targetCoins = amount;
  }

  // Reset confirmações
  trade.initiatorConfirmed = false;
  trade.targetConfirmed = false;

  await trade.save();

  return {
    success: true,
    trade: trade.toObject(),
    message: `Moedas definidas: ${amount}.`,
  };
}

// Confirmar troca
export async function confirmTrade(tradeId: string, userId: string): Promise<TradeActionResult> {
  const trade = await Trade.findOne({
    tradeId,
    $or: [{ initiatorId: userId }, { targetId: userId }],
    status: 'negotiating',
  });

  if (!trade) {
    return { success: false, message: 'Troca não encontrada ou não está em negociação.' };
  }

  const isInitiator = trade.initiatorId === userId;

  if (isInitiator) {
    trade.initiatorConfirmed = true;
  } else {
    trade.targetConfirmed = true;
  }

  // Verificar se ambos confirmaram
  if (trade.initiatorConfirmed && trade.targetConfirmed) {
    trade.status = 'completed';
    trade.completedAt = new Date();
    await trade.save();

    return {
      success: true,
      trade: trade.toObject(),
      message: 'Troca concluída com sucesso!',
      completed: true,
    };
  }

  await trade.save();

  return {
    success: true,
    trade: trade.toObject(),
    message: 'Confirmação registrada. Aguardando confirmação do outro jogador.',
  };
}

// Cancelar confirmação
export async function unconfirmTrade(tradeId: string, userId: string): Promise<TradeActionResult> {
  const trade = await Trade.findOne({
    tradeId,
    $or: [{ initiatorId: userId }, { targetId: userId }],
    status: 'negotiating',
  });

  if (!trade) {
    return { success: false, message: 'Troca não encontrada.' };
  }

  const isInitiator = trade.initiatorId === userId;

  if (isInitiator) {
    trade.initiatorConfirmed = false;
  } else {
    trade.targetConfirmed = false;
  }

  await trade.save();

  return {
    success: true,
    trade: trade.toObject(),
    message: 'Confirmação cancelada.',
  };
}

// Obter trade ativo do usuário
export async function getActiveTrade(userId: string): Promise<ITrade | null> {
  return await Trade.findOne({
    $or: [{ initiatorId: userId }, { targetId: userId }],
    status: { $in: ['pending', 'negotiating'] },
  }).lean();
}

// Obter detalhes da troca
export async function getTradeDetails(tradeId: string): Promise<ITrade | null> {
  return await Trade.findOne({ tradeId }).lean();
}

// Obter histórico de trocas
export async function getTradeHistory(
  userId: string,
  limit: number = 10
): Promise<ITrade[]> {
  return await Trade.find({
    $or: [{ initiatorId: userId }, { targetId: userId }],
    status: 'completed',
  })
    .sort({ completedAt: -1 })
    .limit(limit)
    .lean();
}

// Processar trades expirados
export async function processExpiredTrades(): Promise<number> {
  const result = await Trade.updateMany(
    {
      status: { $in: ['pending', 'negotiating'] },
      expiresAt: { $lte: new Date() },
    },
    {
      $set: { status: 'expired' },
    }
  );

  return result.modifiedCount;
}

// Validar se usuário pode fazer trade (verificar inventário, moedas, etc)
export function validateTradeItems(
  trade: ITrade,
  initiatorInventory: any[],
  targetInventory: any[],
  initiatorCoins: number,
  targetCoins: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Verificar itens do initiator
  for (const item of trade.initiatorItems) {
    const hasItem = initiatorInventory.some(
      i => i.itemId === item.itemId && i.quantity >= item.quantity
    );
    if (!hasItem) {
      errors.push(`Iniciador não possui ${item.itemName} suficiente.`);
    }
  }

  // Verificar itens do target
  for (const item of trade.targetItems) {
    const hasItem = targetInventory.some(
      i => i.itemId === item.itemId && i.quantity >= item.quantity
    );
    if (!hasItem) {
      errors.push(`Alvo não possui ${item.itemName} suficiente.`);
    }
  }

  // Verificar moedas
  if (trade.initiatorCoins > initiatorCoins) {
    errors.push('Iniciador não possui moedas suficientes.');
  }

  if (trade.targetCoins > targetCoins) {
    errors.push('Alvo não possui moedas suficientes.');
  }

  return { valid: errors.length === 0, errors };
}
