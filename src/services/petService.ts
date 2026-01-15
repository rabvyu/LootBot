import { petRepository } from '../database/repositories/petRepository';
import { economyRepository } from '../database/repositories/economyRepository';
import { userRepository } from '../database/repositories/userRepository';
import { PetDocument, PetRarity } from '../database/models/Pet';
import { UserPetDocument } from '../database/models/UserPet';
import { logger } from '../utils/logger';

// Pet level XP requirements
const PET_XP_FOR_LEVEL = (level: number): number => Math.floor(100 * Math.pow(level, 1.3));

// Default pets to seed
const DEFAULT_PETS = [
  {
    id: 'slime',
    name: 'Slime',
    emoji: '🟢',
    description: 'Um slime amigavel que gera moedas lentamente.',
    rarity: 'common' as PetRarity,
    baseCoinsPerHour: 2,
    baseXpPerHour: 0,
    price: 500,
    maxLevel: 15,
    feedCost: 10,
    feedInterval: 12,
  },
  {
    id: 'hamster',
    name: 'Hamster',
    emoji: '🐹',
    description: 'Um hamster energetico na sua rodinha.',
    rarity: 'common' as PetRarity,
    baseCoinsPerHour: 3,
    baseXpPerHour: 0,
    price: 750,
    maxLevel: 15,
    feedCost: 12,
    feedInterval: 10,
  },
  {
    id: 'cat',
    name: 'Gato',
    emoji: '🐱',
    description: 'Um gato preguicoso que as vezes traz presentes.',
    rarity: 'uncommon' as PetRarity,
    baseCoinsPerHour: 5,
    baseXpPerHour: 1,
    price: 1500,
    maxLevel: 20,
    feedCost: 20,
    feedInterval: 8,
  },
  {
    id: 'dog',
    name: 'Cachorro',
    emoji: '🐕',
    description: 'Um cachorro leal que aumenta sua felicidade.',
    rarity: 'uncommon' as PetRarity,
    baseCoinsPerHour: 4,
    baseXpPerHour: 2,
    price: 1500,
    maxLevel: 20,
    feedCost: 25,
    feedInterval: 6,
  },
  {
    id: 'fox',
    name: 'Raposa',
    emoji: '🦊',
    description: 'Uma raposa astuta que encontra tesouros.',
    rarity: 'rare' as PetRarity,
    baseCoinsPerHour: 10,
    baseXpPerHour: 3,
    price: 5000,
    maxLevel: 25,
    feedCost: 40,
    feedInterval: 8,
    specialAbility: 'Chance de bonus ao coletar',
  },
  {
    id: 'owl',
    name: 'Coruja',
    emoji: '🦉',
    description: 'Uma coruja sabia que gera mais XP.',
    rarity: 'rare' as PetRarity,
    baseCoinsPerHour: 5,
    baseXpPerHour: 8,
    price: 6000,
    maxLevel: 25,
    feedCost: 35,
    feedInterval: 10,
    specialAbility: 'Bonus de XP dobrado',
  },
  {
    id: 'wolf',
    name: 'Lobo',
    emoji: '🐺',
    description: 'Um lobo feroz e protetor.',
    rarity: 'rare' as PetRarity,
    baseCoinsPerHour: 12,
    baseXpPerHour: 4,
    price: 7000,
    maxLevel: 25,
    feedCost: 50,
    feedInterval: 6,
  },
  {
    id: 'unicorn',
    name: 'Unicornio',
    emoji: '🦄',
    description: 'Um unicornio magico e raro.',
    rarity: 'epic' as PetRarity,
    baseCoinsPerHour: 25,
    baseXpPerHour: 8,
    price: 15000,
    maxLevel: 30,
    feedCost: 80,
    feedInterval: 12,
    specialAbility: 'Regenera fome mais devagar',
  },
  {
    id: 'dragon',
    name: 'Dragao',
    emoji: '🐉',
    description: 'Um poderoso dragao que acumula tesouros.',
    rarity: 'epic' as PetRarity,
    baseCoinsPerHour: 30,
    baseXpPerHour: 10,
    price: 20000,
    maxLevel: 35,
    feedCost: 100,
    feedInterval: 8,
    specialAbility: 'Dobra coins em nivel max',
  },
  {
    id: 'phoenix',
    name: 'Fenix',
    emoji: '🔥',
    description: 'Uma fenix lendaria que renasce das cinzas.',
    rarity: 'legendary' as PetRarity,
    baseCoinsPerHour: 50,
    baseXpPerHour: 15,
    price: 50000,
    maxLevel: 50,
    feedCost: 150,
    feedInterval: 24,
    specialAbility: 'Protege streak ao morrer',
  },
];

export interface PetPurchaseResult {
  success: boolean;
  message: string;
  pet?: UserPetDocument;
  newBalance?: number;
}

export interface CollectResult {
  success: boolean;
  message: string;
  coins: number;
  xp: number;
  petXp: number;
  leveledUp: boolean;
  newLevel?: number;
}

class PetService {
  async initialize(): Promise<void> {
    for (const petData of DEFAULT_PETS) {
      const existing = await petRepository.getPetById(petData.id);
      if (!existing) {
        await petRepository.createPet(petData);
        logger.info(`Created pet: ${petData.name}`);
      }
    }
    logger.info('Pet system initialized');
  }

  async getAvailablePets(): Promise<PetDocument[]> {
    return petRepository.getAllPets();
  }

  async getPetDefinition(petId: string): Promise<PetDocument | null> {
    return petRepository.getPetById(petId);
  }

  async getUserPets(discordId: string): Promise<UserPetDocument[]> {
    return petRepository.getUserPets(discordId);
  }

  async getActivePet(discordId: string): Promise<UserPetDocument | null> {
    return petRepository.getActivePet(discordId);
  }

  async purchasePet(
    discordId: string,
    petId: string,
    customName?: string
  ): Promise<PetPurchaseResult> {
    const petDef = await petRepository.getPetById(petId);
    if (!petDef) {
      return { success: false, message: 'Pet nao encontrado.' };
    }

    // Check if user already has this pet
    const existingPet = await petRepository.getUserPetById(discordId, petId);
    if (existingPet) {
      return { success: false, message: 'Voce ja possui este pet!' };
    }

    // Check balance
    const balance = await economyRepository.getBalance(discordId);
    if (balance < petDef.price) {
      return {
        success: false,
        message: `Saldo insuficiente! Voce tem ${balance} coins, precisa de ${petDef.price}.`,
      };
    }

    // Process purchase
    const result = await economyRepository.removeCoins(
      discordId,
      petDef.price,
      'spend',
      `Compra de pet: ${petDef.name}`
    );

    if (!result) {
      return { success: false, message: 'Erro ao processar compra.' };
    }

    // Add pet to user
    const userPet = await petRepository.addPetToUser(
      discordId,
      petId,
      customName || petDef.name
    );

    logger.info(`User ${discordId} purchased pet ${petId}`);

    return {
      success: true,
      message: `Voce adotou **${userPet.name}** (${petDef.emoji})!`,
      pet: userPet,
      newBalance: result.newBalance,
    };
  }

  async activatePet(discordId: string, petId: string): Promise<{ success: boolean; message: string }> {
    const userPet = await petRepository.getUserPetById(discordId, petId);
    if (!userPet) {
      return { success: false, message: 'Voce nao possui este pet.' };
    }

    await petRepository.setActivePet(discordId, petId);
    return { success: true, message: `**${userPet.name}** agora esta ativo!` };
  }

  async deactivatePet(discordId: string): Promise<{ success: boolean; message: string }> {
    await petRepository.deactivateAllPets(discordId);
    return { success: true, message: 'Pet desativado.' };
  }

  async feedPet(discordId: string, petId: string): Promise<{ success: boolean; message: string; newBalance?: number }> {
    const userPet = await petRepository.getUserPetById(discordId, petId);
    if (!userPet) {
      return { success: false, message: 'Voce nao possui este pet.' };
    }

    const petDef = await petRepository.getPetById(petId);
    if (!petDef) {
      return { success: false, message: 'Pet nao encontrado.' };
    }

    if (userPet.hunger >= 100) {
      return { success: false, message: `${userPet.name} ja esta satisfeito!` };
    }

    const balance = await economyRepository.getBalance(discordId);
    if (balance < petDef.feedCost) {
      return {
        success: false,
        message: `Voce precisa de ${petDef.feedCost} coins para alimentar ${userPet.name}.`,
      };
    }

    const result = await economyRepository.removeCoins(
      discordId,
      petDef.feedCost,
      'spend',
      `Alimentar pet: ${userPet.name}`
    );

    if (!result) {
      return { success: false, message: 'Erro ao processar pagamento.' };
    }

    await petRepository.feedPet(discordId, petId);

    return {
      success: true,
      message: `Voce alimentou **${userPet.name}**! ${petDef.emoji}`,
      newBalance: result.newBalance,
    };
  }

  async collectPetRewards(discordId: string): Promise<CollectResult> {
    const activePet = await petRepository.getActivePet(discordId);
    if (!activePet) {
      return {
        success: false,
        message: 'Voce nao tem um pet ativo.',
        coins: 0,
        xp: 0,
        petXp: 0,
        leveledUp: false,
      };
    }

    const petDef = await petRepository.getPetById(activePet.petId);
    if (!petDef) {
      return {
        success: false,
        message: 'Erro ao encontrar definicao do pet.',
        coins: 0,
        xp: 0,
        petXp: 0,
        leveledUp: false,
      };
    }

    // Calculate time since last collection
    const now = new Date();
    const lastCollected = new Date(activePet.lastCollected);
    const hoursPassed = (now.getTime() - lastCollected.getTime()) / (1000 * 60 * 60);

    if (hoursPassed < 0.5) {
      const minutesLeft = Math.ceil((0.5 - hoursPassed) * 60);
      return {
        success: false,
        message: `Espere mais ${minutesLeft} minutos para coletar.`,
        coins: 0,
        xp: 0,
        petXp: 0,
        leveledUp: false,
      };
    }

    // Calculate hunger decay
    const lastFed = new Date(activePet.lastFed);
    const hoursSinceFed = (now.getTime() - lastFed.getTime()) / (1000 * 60 * 60);
    const hungerDecay = Math.floor(hoursSinceFed * (100 / petDef.feedInterval));
    const currentHunger = Math.max(0, 100 - hungerDecay);

    // Happiness affects generation (hungry pet = less happy = less rewards)
    const happinessMultiplier = currentHunger >= 50 ? 1 : currentHunger >= 25 ? 0.5 : 0.25;
    const levelMultiplier = 1 + (activePet.level - 1) * 0.1; // 10% bonus per level

    // Calculate rewards (cap at 24 hours)
    const effectiveHours = Math.min(hoursPassed, 24);
    let coinsEarned = Math.floor(
      petDef.baseCoinsPerHour * effectiveHours * happinessMultiplier * levelMultiplier
    );
    let xpEarned = Math.floor(
      petDef.baseXpPerHour * effectiveHours * happinessMultiplier * levelMultiplier
    );

    // Special abilities
    if (petDef.specialAbility?.includes('bonus') && Math.random() < 0.2) {
      coinsEarned = Math.floor(coinsEarned * 1.5);
    }
    if (petDef.specialAbility?.includes('XP dobrado')) {
      xpEarned = xpEarned * 2;
    }

    // Award rewards
    if (coinsEarned > 0) {
      await economyRepository.addCoins(discordId, coinsEarned, 'earn', `Pet: ${activePet.name}`);
    }
    if (xpEarned > 0) {
      await userRepository.addXP(discordId, xpEarned, 'bonus');
    }

    // Update pet stats
    await petRepository.collectRewards(discordId, activePet.petId, coinsEarned, xpEarned);
    await petRepository.updatePetHunger(
      discordId,
      activePet.petId,
      currentHunger,
      currentHunger >= 50 ? activePet.happiness : activePet.happiness - 5
    );

    // Award pet XP
    const petXpEarned = Math.floor(effectiveHours * 10);
    await petRepository.addPetExperience(discordId, activePet.petId, petXpEarned);

    // Check for level up
    const updatedPet = await petRepository.getUserPetById(discordId, activePet.petId);
    let leveledUp = false;
    let newLevel = activePet.level;

    if (updatedPet && updatedPet.level < petDef.maxLevel) {
      const xpNeeded = PET_XP_FOR_LEVEL(updatedPet.level);
      if (updatedPet.experience >= xpNeeded) {
        newLevel = updatedPet.level + 1;
        const remainingXp = updatedPet.experience - xpNeeded;
        await petRepository.levelUpPet(discordId, activePet.petId, newLevel, remainingXp);
        leveledUp = true;
        logger.info(`Pet ${activePet.name} leveled up to ${newLevel} for user ${discordId}`);
      }
    }

    return {
      success: true,
      message: `Coletado de **${activePet.name}**!`,
      coins: coinsEarned,
      xp: xpEarned,
      petXp: petXpEarned,
      leveledUp,
      newLevel: leveledUp ? newLevel : undefined,
    };
  }

  async renamePet(
    discordId: string,
    petId: string,
    newName: string
  ): Promise<{ success: boolean; message: string }> {
    if (newName.length < 1 || newName.length > 20) {
      return { success: false, message: 'Nome deve ter entre 1 e 20 caracteres.' };
    }

    const userPet = await petRepository.getUserPetById(discordId, petId);
    if (!userPet) {
      return { success: false, message: 'Voce nao possui este pet.' };
    }

    await petRepository.renamePet(discordId, petId, newName);
    return { success: true, message: `Pet renomeado para **${newName}**!` };
  }

  async releasePet(
    discordId: string,
    petId: string
  ): Promise<{ success: boolean; message: string; refund: number }> {
    const userPet = await petRepository.getUserPetById(discordId, petId);
    if (!userPet) {
      return { success: false, message: 'Voce nao possui este pet.', refund: 0 };
    }

    const petDef = await petRepository.getPetById(petId);
    if (!petDef) {
      return { success: false, message: 'Erro ao encontrar pet.', refund: 0 };
    }

    // Refund 25% of original price
    const refund = Math.floor(petDef.price * 0.25);

    await petRepository.releasePet(discordId, petId);
    if (refund > 0) {
      await economyRepository.addCoins(discordId, refund, 'earn', `Liberou pet: ${userPet.name}`);
    }

    return {
      success: true,
      message: `Voce liberou **${userPet.name}** e recebeu ${refund} coins de volta.`,
      refund,
    };
  }

  getPetXpForLevel(level: number): number {
    return PET_XP_FOR_LEVEL(level);
  }
}

export const petService = new PetService();
export default petService;
