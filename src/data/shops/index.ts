// Shops - Index
export * from './upgradeShop';
export * from './alchemistShop';

import { allUpgradeItems, UpgradeShopItem } from './upgradeShop';
import { allAlchemistItems, AlchemistItem, ALCHEMIST_REFRESH_HOURS } from './alchemistShop';

// Contagem de itens
export const SHOP_COUNTS = {
  upgradeItems: allUpgradeItems.length,
  alchemistItems: allAlchemistItems.length,
  get total() {
    return this.upgradeItems + this.alchemistItems;
  },
};

// Re-export constants
export { ALCHEMIST_REFRESH_HOURS };

// Union type para qualquer item de loja
export type ShopItem = UpgradeShopItem | AlchemistItem;

// Verificar se item é de upgrade
export const isUpgradeItem = (item: ShopItem): item is UpgradeShopItem => {
  return 'category' in item;
};

// Verificar se item é de alquimista
export const isAlchemistItem = (item: ShopItem): item is AlchemistItem => {
  return 'rarity' in item;
};
