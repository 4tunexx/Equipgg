-- Insert default chat channels
INSERT INTO chat_channels (id, name, description, type, category, message_count, member_count, is_active)
VALUES 
  ('community-general', 'General', 'General community discussion', 'public', 'general', 0, 0, TRUE),
  ('community-trading', 'Trading', 'Buy, sell, and trade items', 'public', 'general', 0, 0, TRUE),
  ('community-games', 'Games', 'Discuss CS2 matches and strategies', 'public', 'general', 0, 0, TRUE),
  ('community-support', 'Support', 'Get help from moderators', 'public', 'support', 0, 0, TRUE),
  ('betting-live', 'Live Betting', 'Discuss live bets and predictions', 'public', 'betting', 0, 0, TRUE),
  ('betting-tips', 'Betting Tips', 'Share and discuss betting strategies', 'public', 'betting', 0, 0, TRUE),
  ('betting-results', 'Results', 'Discuss match results and outcomes', 'public', 'betting', 0, 0, TRUE),
  ('dashboard-main', 'Dashboard Chat', 'Quick chat for dashboard users', 'public', 'dashboard', 0, 0, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Insert default forum categories
INSERT INTO forum_categories (id, name, title, description, icon, display_order, topic_count, post_count)
VALUES 
  ('general', 'General Discussion', 'General', 'Talk about anything gaming related', '💬', 1, 0, 0),
  ('support', 'Support & Help', 'Support', 'Get help with technical issues', '🆘', 2, 0, 0),
  ('trading', 'Trading Post', 'Trading', 'Buy, sell, and trade items', '💰', 3, 0, 0),
  ('feedback', 'Feedback & Suggestions', 'Feedback', 'Share your ideas to improve the platform', '💡', 4, 0, 0)
ON CONFLICT (id) DO NOTHING;
