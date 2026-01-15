import { Pet, PetDocument, PetRarity } from '../models/Pet';
import { UserPet, UserPetDocument } from '../models/UserPet';

class PetRepository {
  // Pet definitions
  async getPetById(id: string): Promise<PetDocument | null> {
    return Pet.findOne({ id });
  }

  async getAllPets(): Promise<PetDocument[]> {
    return Pet.find().sort({ price: 1 });
  }

  async getPetsByRarity(rarity: PetRarity): Promise<PetDocument[]> {
    return Pet.find({ rarity }).sort({ price: 1 });
  }

  async createPet(data: Partial<PetDocument>): Promise<PetDocument> {
    return Pet.create(data);
  }

  // User pets
  async getUserPets(discordId: string): Promise<UserPetDocument[]> {
    return UserPet.find({ discordId }).sort({ isActive: -1, level: -1 });
  }

  async getUserPetById(discordId: string, petId: string): Promise<UserPetDocument | null> {
    return UserPet.findOne({ discordId, petId });
  }

  async getActivePet(discordId: string): Promise<UserPetDocument | null> {
    return UserPet.findOne({ discordId, isActive: true });
  }

  async addPetToUser(
    discordId: string,
    petId: string,
    customName: string
  ): Promise<UserPetDocument> {
    return UserPet.create({
      discordId,
      petId,
      name: customName,
      level: 1,
      experience: 0,
      isActive: false,
      lastFed: new Date(),
      lastCollected: new Date(),
      totalCoinsGenerated: 0,
      totalXpGenerated: 0,
      hunger: 100,
      happiness: 100,
      acquiredAt: new Date(),
    });
  }

  async setActivePet(discordId: string, petId: string): Promise<boolean> {
    // Deactivate all pets first
    await UserPet.updateMany({ discordId }, { isActive: false });
    // Activate the specified pet
    const result = await UserPet.updateOne(
      { discordId, petId },
      { isActive: true }
    );
    return result.modifiedCount > 0;
  }

  async deactivateAllPets(discordId: string): Promise<void> {
    await UserPet.updateMany({ discordId }, { isActive: false });
  }

  async feedPet(discordId: string, petId: string): Promise<UserPetDocument | null> {
    return UserPet.findOneAndUpdate(
      { discordId, petId },
      {
        lastFed: new Date(),
        hunger: 100,
        $inc: { happiness: 10 },
      },
      { new: true }
    );
  }

  async updatePetHunger(
    discordId: string,
    petId: string,
    hunger: number,
    happiness: number
  ): Promise<void> {
    await UserPet.updateOne(
      { discordId, petId },
      { hunger: Math.max(0, hunger), happiness: Math.max(0, Math.min(100, happiness)) }
    );
  }

  async collectRewards(
    discordId: string,
    petId: string,
    coins: number,
    xp: number
  ): Promise<UserPetDocument | null> {
    return UserPet.findOneAndUpdate(
      { discordId, petId },
      {
        lastCollected: new Date(),
        $inc: {
          totalCoinsGenerated: coins,
          totalXpGenerated: xp,
        },
      },
      { new: true }
    );
  }

  async addPetExperience(
    discordId: string,
    petId: string,
    exp: number
  ): Promise<UserPetDocument | null> {
    return UserPet.findOneAndUpdate(
      { discordId, petId },
      { $inc: { experience: exp } },
      { new: true }
    );
  }

  async levelUpPet(
    discordId: string,
    petId: string,
    newLevel: number,
    remainingExp: number
  ): Promise<UserPetDocument | null> {
    return UserPet.findOneAndUpdate(
      { discordId, petId },
      { level: newLevel, experience: remainingExp },
      { new: true }
    );
  }

  async renamePet(
    discordId: string,
    petId: string,
    newName: string
  ): Promise<UserPetDocument | null> {
    return UserPet.findOneAndUpdate(
      { discordId, petId },
      { name: newName },
      { new: true }
    );
  }

  async releasePet(discordId: string, petId: string): Promise<boolean> {
    const result = await UserPet.deleteOne({ discordId, petId });
    return result.deletedCount > 0;
  }

  async countUserPets(discordId: string): Promise<number> {
    return UserPet.countDocuments({ discordId });
  }

  async getAllActivePets(): Promise<UserPetDocument[]> {
    return UserPet.find({ isActive: true });
  }
}

export const petRepository = new PetRepository();
export default petRepository;
