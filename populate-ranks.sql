-- Populate ranks table with comprehensive rank data
-- Based on mock-data.ts rank structure

INSERT INTO ranks (name, tier, min_level, max_level, description, icon_url, created_at) VALUES
-- Silver Tier (Levels 1-20)
('Silver I', 'Silver Tier', 1, 2, 'Starting rank for new players', '/ranks/silver-1.png', NOW()),
('Silver II', 'Silver Tier', 3, 4, 'Basic progression in Silver tier', '/ranks/silver-2.png', NOW()),
('Silver III', 'Silver Tier', 5, 6, 'Advancing through Silver ranks', '/ranks/silver-3.png', NOW()),
('Silver IV', 'Silver Tier', 7, 8, 'Mid-tier Silver rank', '/ranks/silver-4.png', NOW()),
('Silver V', 'Silver Tier', 9, 10, 'Upper Silver progression', '/ranks/silver-5.png', NOW()),
('Silver VI', 'Silver Tier', 11, 12, 'Advanced Silver rank', '/ranks/silver-6.png', NOW()),
('Silver VII', 'Silver Tier', 13, 14, 'High Silver tier', '/ranks/silver-7.png', NOW()),
('Silver VIII', 'Silver Tier', 15, 16, 'Elite Silver progression', '/ranks/silver-8.png', NOW()),
('Silver IX', 'Silver Tier', 17, 18, 'Top Silver rank', '/ranks/silver-9.png', NOW()),
('Silver Elite', 'Silver Tier', 19, 20, 'Master of Silver tier', '/ranks/silver-elite.png', NOW()),

-- Gold Nova Tier (Levels 21-40)
('Gold Nova I', 'Gold Nova Tier', 21, 22, 'Entry into Gold Nova tier', '/ranks/gold-nova-1.png', NOW()),
('Gold Nova II', 'Gold Nova Tier', 23, 24, 'Progressing through Gold Nova', '/ranks/gold-nova-2.png', NOW()),
('Gold Nova III', 'Gold Nova Tier', 25, 26, 'Mid Gold Nova rank', '/ranks/gold-nova-3.png', NOW()),
('Gold Nova IV', 'Gold Nova Tier', 27, 28, 'Advanced Gold Nova', '/ranks/gold-nova-4.png', NOW()),
('Gold Nova V', 'Gold Nova Tier', 29, 30, 'Upper Gold Nova tier', '/ranks/gold-nova-5.png', NOW()),
('Gold Nova VI', 'Gold Nova Tier', 31, 32, 'High Gold Nova rank', '/ranks/gold-nova-6.png', NOW()),
('Gold Nova VII', 'Gold Nova Tier', 33, 34, 'Elite Gold Nova', '/ranks/gold-nova-7.png', NOW()),
('Gold Nova VIII', 'Gold Nova Tier', 35, 36, 'Top Gold Nova progression', '/ranks/gold-nova-8.png', NOW()),
('Gold Nova IX', 'Gold Nova Tier', 37, 38, 'Peak Gold Nova rank', '/ranks/gold-nova-9.png', NOW()),
('Gold Nova Master', 'Gold Nova Tier', 39, 40, 'Master of Gold Nova tier', '/ranks/gold-nova-master.png', NOW()),

-- Master Guardian Tier (Levels 41-60)
('Master Guardian I', 'Master Guardian Tier', 41, 42, 'Entry into Master Guardian tier', '/ranks/master-guardian-1.png', NOW()),
('Master Guardian II', 'Master Guardian Tier', 43, 44, 'Advancing Master Guardian', '/ranks/master-guardian-2.png', NOW()),
('Master Guardian III', 'Master Guardian Tier', 45, 46, 'Mid Master Guardian rank', '/ranks/master-guardian-3.png', NOW()),
('Master Guardian IV', 'Master Guardian Tier', 47, 48, 'Advanced Master Guardian', '/ranks/master-guardian-4.png', NOW()),
('Master Guardian V', 'Master Guardian Tier', 49, 50, 'Upper Master Guardian', '/ranks/master-guardian-5.png', NOW()),
('Master Guardian Elite I', 'Master Guardian Tier', 51, 52, 'Elite Master Guardian entry', '/ranks/master-guardian-elite-1.png', NOW()),
('Master Guardian Elite II', 'Master Guardian Tier', 53, 54, 'Advanced Elite Guardian', '/ranks/master-guardian-elite-2.png', NOW()),
('Master Guardian Elite III', 'Master Guardian Tier', 55, 56, 'Top Elite Guardian', '/ranks/master-guardian-elite-3.png', NOW()),
('Distinguished Master Guardian', 'Master Guardian Tier', 57, 58, 'Distinguished Guardian rank', '/ranks/distinguished-master-guardian.png', NOW()),
('Prime Master Guardian', 'Master Guardian Tier', 59, 60, 'Prime Guardian achievement', '/ranks/prime-master-guardian.png', NOW()),

-- Legendary Tier (Levels 61-80)
('Legendary Eagle I', 'Legendary Tier', 61, 62, 'Entry into Legendary tier', '/ranks/legendary-eagle-1.png', NOW()),
('Legendary Eagle II', 'Legendary Tier', 63, 64, 'Advancing Legendary Eagle', '/ranks/legendary-eagle-2.png', NOW()),
('Legendary Eagle III', 'Legendary Tier', 65, 66, 'High Legendary Eagle', '/ranks/legendary-eagle-3.png', NOW()),
('Legendary Eagle Master I', 'Legendary Tier', 67, 68, 'Eagle Master entry', '/ranks/legendary-eagle-master-1.png', NOW()),
('Legendary Eagle Master II', 'Legendary Tier', 69, 70, 'Advanced Eagle Master', '/ranks/legendary-eagle-master-2.png', NOW()),
('Supreme Master First Class', 'Legendary Tier', 71, 72, 'Supreme Master achievement', '/ranks/supreme-master-first-class.png', NOW()),
('Supreme Master Second Class', 'Legendary Tier', 73, 74, 'Elite Supreme Master', '/ranks/supreme-master-second-class.png', NOW()),
('Supreme Master Guardian', 'Legendary Tier', 75, 76, 'Guardian Supreme Master', '/ranks/supreme-master-guardian.png', NOW()),
('Legendary Guardian', 'Legendary Tier', 77, 78, 'Legendary Guardian rank', '/ranks/legendary-guardian.png', NOW()),
('Mythic Guardian', 'Legendary Tier', 79, 80, 'Mythic Guardian achievement', '/ranks/mythic-guardian.png', NOW()),

-- Global Elite Tier (Levels 81-100)
('Global Initiate', 'Global Elite Tier', 81, 82, 'Entry into Global Elite', '/ranks/global-initiate.png', NOW()),
('Global Sentinel', 'Global Elite Tier', 83, 84, 'Global Sentinel rank', '/ranks/global-sentinel.png', NOW()),
('Global Paragon', 'Global Elite Tier', 85, 86, 'Global Paragon achievement', '/ranks/global-paragon.png', NOW()),
('Global Vanguard', 'Global Elite Tier', 87, 88, 'Global Vanguard rank', '/ranks/global-vanguard.png', NOW()),
('Global Warlord', 'Global Elite Tier', 89, 90, 'Global Warlord achievement', '/ranks/global-warlord.png', NOW()),
('Global Overlord', 'Global Elite Tier', 91, 92, 'Global Overlord rank', '/ranks/global-overlord.png', NOW()),
('Global Elite Guardian', 'Global Elite Tier', 93, 94, 'Elite Guardian rank', '/ranks/global-elite-guardian.png', NOW()),
('Global Elite Master', 'Global Elite Tier', 95, 96, 'Elite Master achievement', '/ranks/global-elite-master.png', NOW()),
('Supreme Global Elite', 'Global Elite Tier', 97, 98, 'Supreme Global Elite', '/ranks/supreme-global-elite.png', NOW()),
('The Global Elite', 'Global Elite Tier', 99, 100, 'The ultimate rank achievement', '/ranks/the-global-elite.png', NOW());

-- Update any existing users to have proper ranks based on their level
UPDATE users 
SET current_rank = (
    SELECT name 
    FROM ranks 
    WHERE users.level >= ranks.min_level 
    AND users.level <= ranks.max_level 
    LIMIT 1
)
WHERE current_rank IS NULL OR current_rank = '';

SELECT 'Ranks populated successfully!' as message;
SELECT COUNT(*) as total_ranks FROM ranks;