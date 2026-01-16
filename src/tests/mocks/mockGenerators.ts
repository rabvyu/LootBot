// Geradores de dados mock para testes
import { Types } from 'mongoose';

// Gerar ID aleatório do Discord
export const generateDiscordId = (): string => {
  return Math.floor(Math.random() * 1000000000000000000).toString();
};

// Gerar ObjectId do MongoDB
export const generateObjectId = (): string => {
  return new Types.ObjectId().toString();
};

// Gerar username aleatório
export const generateUsername = (): string => {
  const adjectives = ['Brave', 'Swift', 'Dark', 'Light', 'Ancient', 'Mighty'];
  const nouns = ['Warrior', 'Mage', 'Hunter', 'Shadow', 'Dragon', 'Knight'];
  const num = Math.floor(Math.random() * 9999);
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${num}`;
};

// Mock de usuário
export const createMockUser = (overrides: Partial<any> = {}): any => ({
  _id: generateObjectId(),
  discordId: generateDiscordId(),
  username: generateUsername(),
  level: 1,
  xp: 0,
  coins: 1000,
  stats: {
    messagesCount: 0,
    voiceMinutes: 0,
    reactionsGiven: 0,
    reactionsReceived: 0,
    currentStreak: 0,
    longestStreak: 0,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Mock de personagem
export const createMockCharacter = (overrides: Partial<any> = {}): any => ({
  _id: generateObjectId(),
  odiscordId: generateDiscordId(),
  name: generateUsername(),
  class: 'warrior',
  level: 1,
  xp: 0,
  hp: 100,
  maxHp: 100,
  mp: 50,
  maxMp: 50,
  attributes: {
    strength: 10,
    dexterity: 10,
    intelligence: 10,
    vitality: 10,
    luck: 10,
    attributePoints: 0,
  },
  stats: {
    attack: 15,
    defense: 10,
    magicAttack: 5,
    magicDefense: 5,
    speed: 10,
    critChance: 5,
    critDamage: 150,
    evasion: 5,
    accuracy: 95,
    lifesteal: 0,
  },
  createdAt: new Date(),
  ...overrides,
});

// Mock de equipamento
export const createMockEquipment = (overrides: Partial<any> = {}): any => ({
  _id: generateObjectId(),
  discordId: generateDiscordId(),
  equipmentId: `equip_${Date.now()}`,
  name: 'Espada de Teste',
  slot: 'weapon',
  rarity: 'common',
  tier: 1,
  stats: {
    attack: 10,
    defense: 0,
    hp: 0,
    critChance: 0,
    critDamage: 0,
    evasion: 0,
    lifesteal: 0,
  },
  enchantments: {},
  isEquipped: false,
  createdAt: new Date(),
  ...overrides,
});

// Mock de item de inventário
export const createMockInventoryItem = (overrides: Partial<any> = {}): any => ({
  itemId: `item_${Date.now()}`,
  name: 'Item de Teste',
  quantity: 1,
  ...overrides,
});

// Mock de guilda
export const createMockGuild = (overrides: Partial<any> = {}): any => ({
  _id: generateObjectId(),
  guildId: `guild_${Date.now()}`,
  name: 'Guilda de Teste',
  tag: 'TEST',
  description: 'Uma guilda para testes',
  leaderId: generateDiscordId(),
  level: 1,
  xp: 0,
  coins: 0,
  maxMembers: 20,
  memberCount: 1,
  members: [],
  createdAt: new Date(),
  ...overrides,
});

// Mock de dungeon run
export const createMockDungeonRun = (overrides: Partial<any> = {}): any => ({
  _id: generateObjectId(),
  dungeonId: 'forest_dungeon',
  difficulty: 'normal',
  leaderId: generateDiscordId(),
  participants: [],
  status: 'waiting',
  currentWave: 0,
  totalWaves: 5,
  createdAt: new Date(),
  ...overrides,
});

// Mock de arena match
export const createMockArenaMatch = (overrides: Partial<any> = {}): any => ({
  _id: generateObjectId(),
  seasonId: 'season_1',
  player1Id: generateDiscordId(),
  player2Id: generateDiscordId(),
  winnerId: null,
  player1RatingBefore: 1000,
  player2RatingBefore: 1000,
  player1RatingAfter: 0,
  player2RatingAfter: 0,
  rounds: [],
  status: 'pending',
  createdAt: new Date(),
  ...overrides,
});

// Mock de quest
export const createMockQuest = (overrides: Partial<any> = {}): any => ({
  _id: generateObjectId(),
  questId: `quest_${Date.now()}`,
  title: 'Quest de Teste',
  description: 'Uma quest para testes',
  type: 'side',
  levelRequired: 1,
  objectives: [
    { type: 'kill', target: 'goblin', quantity: 5, description: 'Derrote 5 goblins' },
  ],
  rewards: [
    { type: 'coins', quantity: 100 },
    { type: 'xp', quantity: 50 },
  ],
  createdAt: new Date(),
  ...overrides,
});

// Mock de auction listing
export const createMockAuctionListing = (overrides: Partial<any> = {}): any => ({
  _id: generateObjectId(),
  listingId: `auction_${Date.now()}`,
  sellerId: generateDiscordId(),
  itemType: 'equipment',
  itemData: createMockEquipment(),
  startingBid: 1000,
  buyoutPrice: 5000,
  currentBid: 0,
  currentBidderId: null,
  bids: [],
  duration: 24,
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  status: 'active',
  createdAt: new Date(),
  ...overrides,
});

// Mock de trade
export const createMockTrade = (overrides: Partial<any> = {}): any => ({
  _id: generateObjectId(),
  tradeId: `trade_${Date.now()}`,
  initiatorId: generateDiscordId(),
  targetId: generateDiscordId(),
  initiatorItems: [],
  targetItems: [],
  initiatorCoins: 0,
  targetCoins: 0,
  initiatorConfirmed: false,
  targetConfirmed: false,
  status: 'pending',
  createdAt: new Date(),
  ...overrides,
});

// Mock de world event
export const createMockWorldEvent = (overrides: Partial<any> = {}): any => ({
  _id: generateObjectId(),
  eventId: `event_${Date.now()}`,
  name: 'Evento de Teste',
  type: 'invasion',
  description: 'Um evento para testes',
  status: 'active',
  participants: [],
  startedAt: new Date(),
  endsAt: new Date(Date.now() + 60 * 60 * 1000),
  ...overrides,
});

// Mock de achievement progress
export const createMockAchievementProgress = (overrides: Partial<any> = {}): any => ({
  _id: generateObjectId(),
  discordId: generateDiscordId(),
  achievements: {},
  stats: {
    monstersKilled: 0,
    bossesKilled: 0,
    dungeonsCompleted: 0,
    pvpWins: 0,
    pvpLosses: 0,
    itemsCrafted: 0,
    enchantmentsApplied: 0,
    coinsEarned: 0,
    coinsSpent: 0,
    eventsParticipated: 0,
    guildContribution: 0,
    loginStreak: 0,
    maxLevel: 1,
  },
  createdAt: new Date(),
  ...overrides,
});

// Utilitários de teste
export const wait = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const randomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

export const randomBoolean = (): boolean => {
  return Math.random() > 0.5;
};

export default {
  generateDiscordId,
  generateObjectId,
  generateUsername,
  createMockUser,
  createMockCharacter,
  createMockEquipment,
  createMockInventoryItem,
  createMockGuild,
  createMockDungeonRun,
  createMockArenaMatch,
  createMockQuest,
  createMockAuctionListing,
  createMockTrade,
  createMockWorldEvent,
  createMockAchievementProgress,
  wait,
  randomInt,
  randomElement,
  randomBoolean,
};
