import { BaseModel } from './database';

export interface Session extends BaseModel {
  token: string;
  user_id: string;
  expires_at: string;
  active: boolean;
}