import type { ShopItem } from '@/types/database';

// Feature highlights for the shop
export const shopFeatureHighlights = [
  {
    title: 'Exclusive Items',
    description: 'Get access to rare and exclusive items only available in the shop',
    icon: '✨'
  },
  {
    title: 'Flash Sales',
    description: 'Limited time discounts on premium items',
    icon: '⚡'
  },
  {
    title: 'Daily Deals',
    description: 'New deals every day with special discounts',
    icon: '🎯'
  },
  {
    title: 'Bundle Savings',
    description: 'Save more when you buy item bundles',
    icon: '📦'
  }
];

// Perk highlights for shop items
export const shopPerkHighlights = [
  {
    title: 'Instant Delivery',
    description: 'Items are delivered instantly to your inventory',
    icon: '🚀'
  },
  {
    title: 'Trade Enabled',
    description: 'All shop items are tradeable after purchase',
    icon: '🤝'
  },
  {
    title: 'Authenticity',
    description: '100% authentic items with unique identifiers',
    icon: '🔒'
  }
];

// Featured shop items
export const featuredShopItems: ShopItem[] = [
  {
    id: '1',
    name: 'Dragon Lore AWP',
    description: 'The legendary Dragon Lore skin for the AWP',
    price: 100000,
    currency: 'coins',
    type: 'Rifle',
    image: '/items/awp-dragon-lore.png',
    rarity: 'Legendary',
    dataAiHint: 'Most sought after AWP skin',
    stock: 1
  },
  {
    id: '2',
    name: 'Butterfly Knife | Fade',
    description: 'Factory New Butterfly Knife with Fade pattern',
    price: 75000,
    currency: 'coins',
    type: 'Knife',
    image: '/items/butterfly-fade.png',
    rarity: 'Mythical',
    dataAiHint: 'Popular knife skin',
    stock: 3
  },
  {
    id: '3',
    name: 'Premium Case Key',
    description: 'Key to open Premium Cases',
    price: 250,
    currency: 'gems',
    type: 'Key',
    image: '/items/premium-key.png',
    rarity: 'Rare',
    dataAiHint: 'Required for premium cases',
    stock: 100
  }
];

// Shop bundle offers
export const shopBundles = {
  starter: { gems: 1000, price: 4.99, currency: 'USD' },
  popular: { gems: 2500, price: 9.99, currency: 'USD' },
  value: { gems: 5000, price: 19.99, currency: 'USD' },
  premium: { gems: 10000, price: 49.99, currency: 'USD' },
  ultimate: { gems: 25000, price: 99.99, currency: 'USD' }
};