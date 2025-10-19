import { Rarity } from '../lib/supabase/queries';

export interface CrateItem {
  id: number;
  name: string;
  type: string;
  rarity: Rarity;
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