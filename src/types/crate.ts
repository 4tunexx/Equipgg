import { DBItem, Rarity } from '../lib/supabase/queries';

export interface CrateItem {
  id: string;
  name: string;
  type: string;
  rarity: Rarity;
  image: string;
}

export interface Crate {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  items: CrateItem[];
}