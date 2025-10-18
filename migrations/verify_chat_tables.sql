-- Run this to check if tables exist and their structure
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'chat_%';

-- Check chat_messages columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'chat_messages'
ORDER BY ordinal_position;

-- Check chat_channels columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'chat_channels'
ORDER BY ordinal_position;
