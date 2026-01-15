import { Equipment, EquipmentDocument, EquipmentSlot, EquipmentRarity, EquipmentStats } from '../models/Equipment';

class EquipmentRepository {
  async getPlayerEquipment(discordId: string): Promise<EquipmentDocument[]> {
    return Equipment.find({ odiscordId: discordId }).sort({ tier: -1, rarity: -1 });
  }

  async getEquippedItems(discordId: string): Promise<EquipmentDocument[]> {
    return Equipment.find({ odiscordId: discordId, isEquipped: true });
  }

  async getEquipmentBySlot(discordId: string, slot: EquipmentSlot): Promise<EquipmentDocument[]> {
    return Equipment.find({ odiscordId: discordId, slot }).sort({ tier: -1, rarity: -1 });
  }

  async getEquippedInSlot(discordId: string, slot: EquipmentSlot): Promise<EquipmentDocument | null> {
    return Equipment.findOne({ odiscordId: discordId, slot, isEquipped: true });
  }

  async getEquipmentById(id: string): Promise<EquipmentDocument | null> {
    return Equipment.findById(id);
  }

  async addEquipment(
    discordId: string,
    equipmentId: string,
    name: string,
    slot: EquipmentSlot,
    rarity: EquipmentRarity,
    tier: number,
    stats: EquipmentStats,
    setName?: string
  ): Promise<EquipmentDocument> {
    const equipment = new Equipment({
      odiscordId: discordId,
      equipmentId,
      name,
      slot,
      rarity,
      tier,
      stats,
      setName,
    });
    return equipment.save();
  }

  async equipItem(id: string): Promise<void> {
    const item = await Equipment.findById(id);
    if (!item) return;

    // Unequip current item in that slot
    await Equipment.updateMany(
      { odiscordId: item.odiscordId, slot: item.slot, isEquipped: true },
      { isEquipped: false }
    );

    // Equip new item
    await Equipment.findByIdAndUpdate(id, { isEquipped: true });
  }

  async unequipItem(id: string): Promise<void> {
    await Equipment.findByIdAndUpdate(id, { isEquipped: false });
  }

  async deleteEquipment(id: string): Promise<void> {
    await Equipment.findByIdAndDelete(id);
  }

  async getSetPieces(discordId: string, setName: string): Promise<EquipmentDocument[]> {
    return Equipment.find({ odiscordId: discordId, setName, isEquipped: true });
  }

  async countEquipment(discordId: string): Promise<number> {
    return Equipment.countDocuments({ odiscordId: discordId });
  }

  async getEquipmentByRarity(discordId: string, rarity: EquipmentRarity): Promise<EquipmentDocument[]> {
    return Equipment.find({ odiscordId: discordId, rarity });
  }
}

export const equipmentRepository = new EquipmentRepository();
export default equipmentRepository;
