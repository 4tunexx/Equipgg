import { BaseModel } from './database';

export type ModerationAction = 'warn' | 'mute' | 'ban' | 'suspend' | 'unmute' | 'unban';

export interface UserModeration extends BaseModel {
  user_id: string;
  moderator_id: string;
  action: ModerationAction;
  reason?: string | null;
  active: boolean;
  expires_at?: string | null;
}