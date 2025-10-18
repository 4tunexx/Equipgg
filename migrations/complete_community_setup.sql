-- ============================================
-- COMPLETE COMMUNITY & CHAT SYSTEM SETUP
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- Step 1: Clean up existing tables
DROP TABLE IF EXISTS forum_posts CASCADE;
DROP TABLE IF EXISTS forum_topics CASCADE;
DROP TABLE IF EXISTS forum_categories CASCADE;
DROP TABLE IF EXISTS chat_channel_members CASCADE;
DROP TABLE IF EXISTS chat_user_status CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_channels CASCADE;

-- ============================================
-- FORUM TABLES
-- ============================================

-- Forum Categories
CREATE TABLE forum_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  topic_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum Topics
CREATE TABLE forum_topics (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  category_id TEXT NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  reputation INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum Posts
CREATE TABLE forum_posts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  topic_id TEXT NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  edited_at TIMESTAMP WITH TIME ZONE,
  edited_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  reputation INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CHAT TABLES
-- ============================================

-- Chat Channels (Community, Betting, Dashboard, etc.)
CREATE TABLE chat_channels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'public' CHECK (type IN ('public', 'private', 'direct')),
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'betting', 'dashboard', 'support')),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE,
  message_count INTEGER DEFAULT 0,
  member_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  settings JSONB DEFAULT '{}'::jsonb
);

-- Chat Messages
CREATE TABLE chat_messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  content TEXT NOT NULL,
  sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'system', 'file', 'emoji')),
  reply_to TEXT REFERENCES chat_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  edited_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Chat User Status (mutes, bans)
CREATE TABLE chat_user_status (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  is_muted BOOLEAN DEFAULT FALSE,
  muted_until TIMESTAMP WITH TIME ZONE,
  muted_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  is_banned BOOLEAN DEFAULT FALSE,
  banned_at TIMESTAMP WITH TIME ZONE,
  banned_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  ban_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, channel_id)
);

-- Chat Channel Members
CREATE TABLE chat_channel_members (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  channel_id TEXT NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  notifications_enabled BOOLEAN DEFAULT TRUE,
  UNIQUE(channel_id, user_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Forum indexes
CREATE INDEX idx_forum_topics_category ON forum_topics(category_id);
CREATE INDEX idx_forum_topics_author ON forum_topics(author_id);
CREATE INDEX idx_forum_topics_created ON forum_topics(created_at DESC);
CREATE INDEX idx_forum_posts_topic ON forum_posts(topic_id);
CREATE INDEX idx_forum_posts_author ON forum_posts(author_id);
CREATE INDEX idx_forum_posts_created ON forum_posts(created_at DESC);

-- Chat indexes
CREATE INDEX idx_chat_messages_channel_id ON chat_messages(channel_id);
CREATE INDEX idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_messages_channel_created ON chat_messages(channel_id, created_at DESC);
CREATE INDEX idx_chat_user_status_user_channel ON chat_user_status(user_id, channel_id);
CREATE INDEX idx_chat_channel_members_channel ON chat_channel_members(channel_id);
CREATE INDEX idx_chat_channel_members_user ON chat_channel_members(user_id);

-- ============================================
-- INSERT DEFAULT DATA
-- ============================================

-- Insert Forum Categories
INSERT INTO forum_categories (id, name, title, description, icon, display_order)
VALUES 
  ('general', 'General Discussion', 'General', 'Talk about anything gaming related', '💬', 1),
  ('support', 'Support & Help', 'Support', 'Get help with technical issues', '🆘', 2),
  ('trading', 'Trading Post', 'Trading', 'Buy, sell, and trade items', '💰', 3),
  ('feedback', 'Feedback & Suggestions', 'Feedback', 'Share your ideas to improve the platform', '💡', 4);

-- Insert Chat Channels
INSERT INTO chat_channels (id, name, description, type, category, message_count, member_count, is_active)
VALUES 
  -- Community Chats
  ('community-general', 'General', 'General community discussion', 'public', 'general', 0, 0, TRUE),
  ('community-trading', 'Trading', 'Buy, sell, and trade items', 'public', 'general', 0, 0, TRUE),
  ('community-games', 'Games', 'Discuss CS2 matches and strategies', 'public', 'general', 0, 0, TRUE),
  ('community-support', 'Support', 'Get help from moderators', 'public', 'support', 0, 0, TRUE),
  
  -- Betting Chats
  ('betting-live', 'Live Betting', 'Discuss live bets and predictions', 'public', 'betting', 0, 0, TRUE),
  ('betting-tips', 'Betting Tips', 'Share and discuss betting strategies', 'public', 'betting', 0, 0, TRUE),
  ('betting-results', 'Results', 'Discuss match results and outcomes', 'public', 'betting', 0, 0, TRUE),
  
  -- Dashboard Chat
  ('dashboard-main', 'Dashboard Chat', 'Quick chat for dashboard users', 'public', 'dashboard', 0, 0, TRUE);

-- ============================================
-- TRIGGERS FOR AUTO-UPDATE
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Forum triggers
CREATE TRIGGER update_forum_categories_updated_at 
  BEFORE UPDATE ON forum_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forum_topics_updated_at 
  BEFORE UPDATE ON forum_topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forum_posts_updated_at 
  BEFORE UPDATE ON forum_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Chat triggers
CREATE TRIGGER update_chat_channels_updated_at 
  BEFORE UPDATE ON chat_channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at 
  BEFORE UPDATE ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_user_status_updated_at 
  BEFORE UPDATE ON chat_user_status
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 'Setup completed successfully!' as status;

SELECT 'Forum Tables:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'forum_%'
ORDER BY table_name;

SELECT 'Chat Tables:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'chat_%'
ORDER BY table_name;

SELECT 'Forum Categories:' as info;
SELECT id, name, description FROM forum_categories ORDER BY display_order;

SELECT 'Chat Channels:' as info;
SELECT id, name, category, description FROM chat_channels ORDER BY category, id;
