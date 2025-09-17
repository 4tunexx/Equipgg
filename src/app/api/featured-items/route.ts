import { NextResponse } from 'next/server';
import { FeaturedItem } from '@/lib/mock-data';

// Mock featured items data
const featuredItems: FeaturedItem[] = [
  {
    id: 1,
    name: 'AK-47 | Redline',
    image: 'https://picsum.photos/200/150?random=101',
    rarity: 'Epic',
    type: 'Rifle',
    dataAiHint: 'ak47 red skin'
  },
  {
    id: 2,
    name: 'AWP | Dragon Lore',
    image: 'https://picsum.photos/200/150?random=102',
    rarity: 'Legendary',
    type: 'Sniper',
    dataAiHint: 'awp dragon skin'
  },
  {
    id: 3,
    name: 'M4A4 | Howl',
    image: 'https://picsum.photos/200/150?random=103',
    rarity: 'Legendary',
    type: 'Rifle',
    dataAiHint: 'm4a4 howl skin'
  },
  {
    id: 4,
    name: 'Karambit | Fade',
    image: 'https://picsum.photos/200/150?random=104',
    rarity: 'Legendary',
    type: 'Knife',
    dataAiHint: 'karambit fade knife'
  }
];

export async function GET() {
  try {
    return NextResponse.json(featuredItems);
  } catch (error) {
    console.error('Error fetching featured items:', error);
    return NextResponse.json({ error: 'Failed to fetch featured items' }, { status: 500 });
  }
}