// Profile Banner Styles - Purchasable Cosmetics

export interface ProfileBanner {
  id: string;
  name: string;
  description: string;
  gradient: string; // CSS gradient
  price: number; // In coins
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  category: 'cosmetic';
  image_url: string; // For shop display
}

export const PROFILE_BANNERS: ProfileBanner[] = [
  {
    id: 'banner_default',
    name: 'Default Banner',
    description: 'The classic gradient banner. Free for everyone!',
    gradient: 'linear-gradient(135deg, hsl(var(--primary) / 0.2) 0%, rgb(139 92 246 / 0.2) 50%, rgb(59 130 246 / 0.2) 100%)',
    price: 0,
    rarity: 'common',
    category: 'cosmetic',
    image_url: '/images/banners/default.png'
  },
  {
    id: 'banner_sunset',
    name: 'Sunset Blaze',
    description: 'Watch the sun set on your profile with warm orange and pink tones.',
    gradient: 'linear-gradient(135deg, rgb(251 146 60 / 0.3) 0%, rgb(251 113 133 / 0.3) 50%, rgb(244 63 94 / 0.3) 100%)',
    price: 100,
    rarity: 'common',
    category: 'cosmetic',
    image_url: '/images/banners/sunset.png'
  },
  {
    id: 'banner_ocean',
    name: 'Ocean Wave',
    description: 'Dive into the deep blue sea with cool cyan and blue gradients.',
    gradient: 'linear-gradient(135deg, rgb(6 182 212 / 0.3) 0%, rgb(14 165 233 / 0.3) 50%, rgb(59 130 246 / 0.3) 100%)',
    price: 150,
    rarity: 'uncommon',
    category: 'cosmetic',
    image_url: '/images/banners/ocean.png'
  },
  {
    id: 'banner_forest',
    name: 'Forest Mist',
    description: 'Nature\'s embrace with emerald green and teal shades.',
    gradient: 'linear-gradient(135deg, rgb(34 197 94 / 0.3) 0%, rgb(16 185 129 / 0.3) 50%, rgb(20 184 166 / 0.3) 100%)',
    price: 150,
    rarity: 'uncommon',
    category: 'cosmetic',
    image_url: '/images/banners/forest.png'
  },
  {
    id: 'banner_royal',
    name: 'Royal Purple',
    description: 'Feel like royalty with deep purple and violet tones.',
    gradient: 'linear-gradient(135deg, rgb(168 85 247 / 0.4) 0%, rgb(147 51 234 / 0.4) 50%, rgb(126 34 206 / 0.4) 100%)',
    price: 300,
    rarity: 'rare',
    category: 'cosmetic',
    image_url: '/images/banners/royal.png'
  },
  {
    id: 'banner_fire',
    name: 'Inferno',
    description: 'Burn bright with intense reds and oranges. For the bold!',
    gradient: 'linear-gradient(135deg, rgb(239 68 68 / 0.4) 0%, rgb(249 115 22 / 0.4) 50%, rgb(251 146 60 / 0.4) 100%)',
    price: 300,
    rarity: 'rare',
    category: 'cosmetic',
    image_url: '/images/banners/fire.png'
  },
  {
    id: 'banner_aurora',
    name: 'Aurora Borealis',
    description: 'The magical northern lights dance across your profile.',
    gradient: 'linear-gradient(135deg, rgb(16 185 129 / 0.4) 0%, rgb(59 130 246 / 0.4) 33%, rgb(139 92 246 / 0.4) 66%, rgb(236 72 153 / 0.4) 100%)',
    price: 500,
    rarity: 'epic',
    category: 'cosmetic',
    image_url: '/images/banners/aurora.png'
  },
  {
    id: 'banner_galaxy',
    name: 'Cosmic Galaxy',
    description: 'Explore the cosmos with deep space purples and blues.',
    gradient: 'linear-gradient(135deg, rgb(30 27 75 / 0.5) 0%, rgb(88 28 135 / 0.5) 33%, rgb(109 40 217 / 0.5) 66%, rgb(59 130 246 / 0.5) 100%)',
    price: 500,
    rarity: 'epic',
    category: 'cosmetic',
    image_url: '/images/banners/galaxy.png'
  },
  {
    id: 'banner_gold',
    name: 'Golden Prestige',
    description: 'Shine with luxury! Radiant gold and amber gradients.',
    gradient: 'linear-gradient(135deg, rgb(253 224 71 / 0.5) 0%, rgb(251 191 36 / 0.5) 33%, rgb(245 158 11 / 0.5) 66%, rgb(217 119 6 / 0.5) 100%)',
    price: 1000,
    rarity: 'legendary',
    category: 'cosmetic',
    image_url: '/images/banners/gold.png'
  },
  {
    id: 'banner_rainbow',
    name: 'Rainbow Prism',
    description: 'The ultimate flex! Full spectrum rainbow across your profile.',
    gradient: 'linear-gradient(135deg, rgb(239 68 68 / 0.4) 0%, rgb(251 146 60 / 0.4) 16%, rgb(253 224 71 / 0.4) 33%, rgb(34 197 94 / 0.4) 50%, rgb(59 130 246 / 0.4) 66%, rgb(168 85 247 / 0.4) 83%, rgb(236 72 153 / 0.4) 100%)',
    price: 1000,
    rarity: 'legendary',
    category: 'cosmetic',
    image_url: '/images/banners/rainbow.png'
  }
];

// Helper function to get banner by ID
export function getBannerById(id: string): ProfileBanner | undefined {
  return PROFILE_BANNERS.find(banner => banner.id === id);
}

// Helper function to get default banner
export function getDefaultBanner(): ProfileBanner {
  return PROFILE_BANNERS[0];
}

// Helper function to get banner gradient by ID (with fallback to default)
export function getBannerGradient(bannerId?: string | null): string {
  if (!bannerId) return getDefaultBanner().gradient;
  const banner = getBannerById(bannerId);
  return banner ? banner.gradient : getDefaultBanner().gradient;
}

// Get rarity color
export function getRarityColor(rarity: string): string {
  switch (rarity.toLowerCase()) {
    case 'common': return 'text-gray-400';
    case 'uncommon': return 'text-green-400';
    case 'rare': return 'text-blue-400';
    case 'epic': return 'text-purple-400';
    case 'legendary': return 'text-yellow-400';
    default: return 'text-gray-400';
  }
}

