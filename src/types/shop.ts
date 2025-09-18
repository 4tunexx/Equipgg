import { Rarity } from '@/lib/supabase/queries';

export interface ShopItem {
  id: string;
  name: string;
  description: string | null;
  type: string;
  rarity: Rarity;
  image: string | null;
  dataAiHint: string | null;
  created_at: string;
  price: number;
  stock: number;
}