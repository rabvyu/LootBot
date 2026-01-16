// Serviço de Casa de Leilões (Auction House)
import { Auction, IAuction, AuctionStatus, AuctionBid, AuctionItemType } from '../database/models';
import { v4 as uuidv4 } from 'uuid';

// Taxas do leilão
const AUCTION_FEES = {
  listingFee: 0.02, // 2% do preço inicial
  successFee: 0.05, // 5% do valor final
  cancelFee: 0.10,  // 10% do preço inicial se cancelar
};

// Durações permitidas em horas
const ALLOWED_DURATIONS: (24 | 48 | 72)[] = [24, 48, 72];

export interface CreateAuctionParams {
  sellerId: string;
  sellerName: string;
  itemType: AuctionItemType;
  itemId: string;
  itemName: string;
  itemRarity: string;
  itemLevel: number;
  itemStats?: any;
  quantity: number;
  startingBid: number;
  buyoutPrice?: number;
  duration: 24 | 48 | 72;
}

export interface BidResult {
  success: boolean;
  message: string;
  auction?: IAuction;
  refundAmount?: number;
}

export interface AuctionSearchParams {
  itemType?: AuctionItemType;
  minLevel?: number;
  maxLevel?: number;
  rarity?: string;
  minPrice?: number;
  maxPrice?: number;
  sellerId?: string;
  sortBy?: 'price' | 'time' | 'level';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  skip?: number;
}

// Calcular taxa de listagem
export function calculateListingFee(startingBid: number): number {
  return Math.floor(startingBid * AUCTION_FEES.listingFee);
}

// Calcular taxa de sucesso
export function calculateSuccessFee(finalPrice: number): number {
  return Math.floor(finalPrice * AUCTION_FEES.successFee);
}

// Criar novo leilão
export async function createAuction(params: CreateAuctionParams): Promise<{ success: boolean; auction?: IAuction; fee: number; message: string }> {
  // Validações
  if (!ALLOWED_DURATIONS.includes(params.duration)) {
    return { success: false, fee: 0, message: 'Duração inválida. Use 24, 48 ou 72 horas.' };
  }

  if (params.startingBid < 10) {
    return { success: false, fee: 0, message: 'Lance inicial mínimo é 10 moedas.' };
  }

  if (params.buyoutPrice && params.buyoutPrice <= params.startingBid) {
    return { success: false, fee: 0, message: 'Preço de compra imediata deve ser maior que o lance inicial.' };
  }

  if (params.quantity < 1) {
    return { success: false, fee: 0, message: 'Quantidade deve ser pelo menos 1.' };
  }

  // Verificar limite de leilões ativos do vendedor
  const activeAuctions = await Auction.countDocuments({
    sellerId: params.sellerId,
    status: 'active',
  });

  if (activeAuctions >= 10) {
    return { success: false, fee: 0, message: 'Você já tem 10 leilões ativos. Aguarde alguns finalizarem.' };
  }

  const listingFee = calculateListingFee(params.startingBid);
  const expiresAt = new Date(Date.now() + params.duration * 60 * 60 * 1000);

  const auction = new Auction({
    listingId: uuidv4(),
    sellerId: params.sellerId,
    sellerName: params.sellerName,
    itemType: params.itemType,
    itemId: params.itemId,
    itemName: params.itemName,
    itemRarity: params.itemRarity,
    itemLevel: params.itemLevel,
    itemStats: params.itemStats,
    quantity: params.quantity,
    startingBid: params.startingBid,
    buyoutPrice: params.buyoutPrice,
    currentBid: 0,
    currentBidderId: null,
    currentBidderName: null,
    bids: [],
    duration: params.duration,
    status: 'active' as AuctionStatus,
    expiresAt,
    listingFee,
  });

  await auction.save();

  return {
    success: true,
    auction: auction.toObject(),
    fee: listingFee,
    message: `Leilão criado! Taxa de listagem: ${listingFee} moedas.`,
  };
}

// Fazer lance
export async function placeBid(
  listingId: string,
  bidderId: string,
  bidderName: string,
  amount: number
): Promise<BidResult> {
  const auction = await Auction.findOne({ listingId, status: 'active' });

  if (!auction) {
    return { success: false, message: 'Leilão não encontrado ou já finalizado.' };
  }

  if (auction.sellerId === bidderId) {
    return { success: false, message: 'Você não pode dar lance no próprio leilão.' };
  }

  if (new Date() >= auction.expiresAt) {
    return { success: false, message: 'Este leilão já expirou.' };
  }

  const minBid = auction.currentBid > 0
    ? Math.floor(auction.currentBid * 1.05) // Mínimo 5% a mais
    : auction.startingBid;

  if (amount < minBid) {
    return { success: false, message: `Lance mínimo é ${minBid} moedas.` };
  }

  // Verificar se é compra imediata
  if (auction.buyoutPrice && amount >= auction.buyoutPrice) {
    return await buyout(listingId, bidderId, bidderName);
  }

  // Guardar o licitante anterior para reembolso
  const previousBidderId = auction.currentBidderId;
  const previousBid = auction.currentBid;

  // Registrar o lance
  const bid: AuctionBid = {
    bidderId,
    bidderName,
    amount,
    bidAt: new Date(),
  };

  auction.bids.push(bid);
  auction.currentBid = amount;
  auction.currentBidderId = bidderId;
  auction.currentBidderName = bidderName;

  // Estender tempo se faltam menos de 5 minutos
  const timeRemaining = auction.expiresAt.getTime() - Date.now();
  if (timeRemaining < 5 * 60 * 1000) {
    auction.expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  }

  await auction.save();

  return {
    success: true,
    message: `Lance de ${amount} moedas registrado!`,
    auction: auction.toObject(),
    refundAmount: previousBidderId ? previousBid : undefined,
  };
}

// Compra imediata (buyout)
export async function buyout(
  listingId: string,
  buyerId: string,
  buyerName: string
): Promise<BidResult> {
  const auction = await Auction.findOne({ listingId, status: 'active' });

  if (!auction) {
    return { success: false, message: 'Leilão não encontrado ou já finalizado.' };
  }

  if (!auction.buyoutPrice) {
    return { success: false, message: 'Este leilão não tem opção de compra imediata.' };
  }

  if (auction.sellerId === buyerId) {
    return { success: false, message: 'Você não pode comprar seu próprio item.' };
  }

  const previousBidderId = auction.currentBidderId;
  const previousBid = auction.currentBid;

  // Registrar a compra
  const bid: AuctionBid = {
    bidderId: buyerId,
    bidderName: buyerName,
    amount: auction.buyoutPrice,
    bidAt: new Date(),
  };

  auction.bids.push(bid);
  auction.currentBid = auction.buyoutPrice;
  auction.currentBidderId = buyerId;
  auction.currentBidderName = buyerName;
  auction.status = 'sold';
  auction.soldAt = new Date();
  auction.soldPrice = auction.buyoutPrice;

  await auction.save();

  return {
    success: true,
    message: `Compra imediata realizada por ${auction.buyoutPrice} moedas!`,
    auction: auction.toObject(),
    refundAmount: previousBidderId ? previousBid : undefined,
  };
}

// Cancelar leilão
export async function cancelAuction(
  listingId: string,
  sellerId: string
): Promise<{ success: boolean; message: string; fee?: number }> {
  const auction = await Auction.findOne({ listingId, sellerId, status: 'active' });

  if (!auction) {
    return { success: false, message: 'Leilão não encontrado ou não pertence a você.' };
  }

  if (auction.currentBid > 0) {
    return { success: false, message: 'Não é possível cancelar leilão com lances ativos.' };
  }

  const cancelFee = Math.floor(auction.startingBid * AUCTION_FEES.cancelFee);

  auction.status = 'cancelled';
  await auction.save();

  return {
    success: true,
    message: `Leilão cancelado. Taxa de cancelamento: ${cancelFee} moedas.`,
    fee: cancelFee,
  };
}

// Buscar leilões
export async function searchAuctions(params: AuctionSearchParams): Promise<IAuction[]> {
  const query: any = { status: 'active' };

  if (params.itemType) query.itemType = params.itemType;
  if (params.rarity) query.itemRarity = params.rarity;
  if (params.sellerId) query.sellerId = params.sellerId;

  if (params.minLevel || params.maxLevel) {
    query.itemLevel = {};
    if (params.minLevel) query.itemLevel.$gte = params.minLevel;
    if (params.maxLevel) query.itemLevel.$lte = params.maxLevel;
  }

  if (params.minPrice || params.maxPrice) {
    query.$or = [
      {
        currentBid: {
          ...(params.minPrice && { $gte: params.minPrice }),
          ...(params.maxPrice && { $lte: params.maxPrice }),
        },
      },
      {
        currentBid: 0,
        startingBid: {
          ...(params.minPrice && { $gte: params.minPrice }),
          ...(params.maxPrice && { $lte: params.maxPrice }),
        },
      },
    ];
  }

  const sortField = params.sortBy === 'price'
    ? 'currentBid'
    : params.sortBy === 'level'
    ? 'itemLevel'
    : 'expiresAt';

  const sortOrder = params.sortOrder === 'desc' ? -1 : 1;

  return await Auction.find(query)
    .sort({ [sortField]: sortOrder })
    .skip(params.skip || 0)
    .limit(params.limit || 20)
    .lean();
}

// Processar leilões expirados
export async function processExpiredAuctions(): Promise<{
  processed: number;
  sold: string[];
  expired: string[];
}> {
  const now = new Date();
  const expiredAuctions = await Auction.find({
    status: 'active',
    expiresAt: { $lte: now },
  });

  const sold: string[] = [];
  const expired: string[] = [];

  for (const auction of expiredAuctions) {
    if (auction.currentBid > 0 && auction.currentBidderId) {
      auction.status = 'sold';
      auction.soldAt = now;
      auction.soldPrice = auction.currentBid;
      sold.push(auction.listingId);
    } else {
      auction.status = 'expired';
      expired.push(auction.listingId);
    }
    await auction.save();
  }

  return { processed: expiredAuctions.length, sold, expired };
}

// Obter leilões do usuário
export async function getUserAuctions(
  userId: string,
  type: 'selling' | 'bidding' | 'won' | 'sold'
): Promise<IAuction[]> {
  let query: any;

  switch (type) {
    case 'selling':
      query = { sellerId: userId, status: 'active' };
      break;
    case 'bidding':
      query = { currentBidderId: userId, status: 'active' };
      break;
    case 'won':
      query = { currentBidderId: userId, status: 'sold' };
      break;
    case 'sold':
      query = { sellerId: userId, status: 'sold' };
      break;
  }

  return await Auction.find(query).sort({ createdAt: -1 }).limit(20).lean();
}

// Obter detalhes do leilão
export async function getAuctionDetails(listingId: string): Promise<IAuction | null> {
  return await Auction.findOne({ listingId }).lean();
}

// Obter estatísticas do mercado
export async function getMarketStats(): Promise<{
  activeListings: number;
  totalVolume24h: number;
  averagePrice: number;
  mostTraded: string;
}> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [activeCount, recentSales, mostTradedResult] = await Promise.all([
    Auction.countDocuments({ status: 'active' }),
    Auction.find({ status: 'sold', soldAt: { $gte: oneDayAgo } }).lean(),
    Auction.aggregate([
      { $match: { status: 'sold', soldAt: { $gte: oneDayAgo } } },
      { $group: { _id: '$itemType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]),
  ]);

  const totalVolume = recentSales.reduce((sum, a) => sum + (a.soldPrice || 0), 0);
  const avgPrice = recentSales.length > 0 ? Math.floor(totalVolume / recentSales.length) : 0;

  return {
    activeListings: activeCount,
    totalVolume24h: totalVolume,
    averagePrice: avgPrice,
    mostTraded: mostTradedResult[0]?._id || 'equipment',
  };
}
