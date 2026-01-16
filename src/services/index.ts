// Exportações de todos os serviços

// Serviços Core (existentes)
export * from './xpService';
export * from './levelService';
export * from './badgeService';
export * from './antiExploit';
export * from './voiceTracker';

// Fase 2 - Sistemas existentes
export * from './dungeonService';
export * from './arenaService';
export * from './worldEventService';
export * from './achievementService';
export * from './guildService';

// Fase 3 - Economia
export * as AuctionService from './auctionService';
export * as TradeService from './tradeService';
export * as BankService from './bankService';

// Fase 3 - Sistemas de Conteúdo
export * as QuestService from './questService';
export * as RaidService from './raidService';
export * as TowerService from './towerService';
export * as SeasonService from './seasonService';

// Fase 3 - Mini-games
export * as FishingService from './minigames/fishingService';
export * as MiningService from './minigames/miningService';
export * as CasinoService from './minigames/casinoService';
export * as TriviaService from './minigames/triviaService';

// Fase 3 - Sistemas Avançados
export * as HousingService from './housingService';
export * as PrestigeService from './prestigeService';

// Fase 3 - QoL & Dashboard
export * as NotificationService from './notificationService';
export * as AutoBattleService from './autoBattleService';
export * as FavoritesService from './favoritesService';
export * as StatsService from './statsService';
