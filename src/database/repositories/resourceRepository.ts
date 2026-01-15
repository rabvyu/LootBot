import { Resource, ResourceDocument, ResourceRarity } from '../models/Resource';
import { UserResource, UserResourceDocument } from '../models/UserResource';

class ResourceRepository {
  // Resource definitions
  async getResourceById(id: string): Promise<ResourceDocument | null> {
    return Resource.findOne({ id });
  }

  async getAllResources(): Promise<ResourceDocument[]> {
    return Resource.find().sort({ rarity: 1, name: 1 });
  }

  async getResourcesByRarity(rarity: ResourceRarity): Promise<ResourceDocument[]> {
    return Resource.find({ rarity });
  }

  async createResource(data: Partial<ResourceDocument>): Promise<ResourceDocument> {
    return Resource.create(data);
  }

  // User resources
  async getUserResource(discordId: string, resourceId: string): Promise<UserResourceDocument | null> {
    return UserResource.findOne({ discordId, resourceId });
  }

  async getUserResources(discordId: string): Promise<UserResourceDocument[]> {
    return UserResource.find({ discordId, amount: { $gt: 0 } }).sort({ amount: -1 });
  }

  async addResource(
    discordId: string,
    resourceId: string,
    amount: number
  ): Promise<UserResourceDocument> {
    const result = await UserResource.findOneAndUpdate(
      { discordId, resourceId },
      {
        $inc: { amount, totalCollected: amount },
      },
      { upsert: true, new: true }
    );
    return result;
  }

  async removeResource(
    discordId: string,
    resourceId: string,
    amount: number
  ): Promise<boolean> {
    const current = await UserResource.findOne({ discordId, resourceId });
    if (!current || current.amount < amount) {
      return false;
    }

    await UserResource.updateOne(
      { discordId, resourceId },
      { $inc: { amount: -amount } }
    );
    return true;
  }

  async setResourceAmount(
    discordId: string,
    resourceId: string,
    amount: number
  ): Promise<UserResourceDocument | null> {
    return UserResource.findOneAndUpdate(
      { discordId, resourceId },
      { amount },
      { upsert: true, new: true }
    );
  }

  async hasResource(discordId: string, resourceId: string, amount: number): Promise<boolean> {
    const resource = await UserResource.findOne({ discordId, resourceId });
    return resource ? resource.amount >= amount : false;
  }

  async getTotalResourceValue(discordId: string): Promise<number> {
    const userResources = await this.getUserResources(discordId);
    let total = 0;

    for (const ur of userResources) {
      const resource = await this.getResourceById(ur.resourceId);
      if (resource) {
        total += ur.amount * resource.baseValue;
      }
    }

    return total;
  }

  async getResourceLeaderboard(resourceId: string, limit: number = 10): Promise<UserResourceDocument[]> {
    return UserResource.find({ resourceId, amount: { $gt: 0 } })
      .sort({ amount: -1 })
      .limit(limit);
  }
}

export const resourceRepository = new ResourceRepository();
export default resourceRepository;
