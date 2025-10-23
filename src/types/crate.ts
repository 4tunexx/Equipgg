import { Rarity } from '../lib/supabase/queries';

// Extended rarity type to include 'Exotic'
export type ExtendedRarity = Rarity | 'Exotic';

export interface CrateItem {
  id: number;
  name: string;
  type: string;
  rarity: ExtendedRarity;
  image: string;
}

export interface Crate {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  items: CrateItem[];
}