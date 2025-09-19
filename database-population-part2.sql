-- EquipGG Database Population Part 2
-- Continuing with remaining badges, crates, items, missions, perks, and ranks

-- ===============================
-- POPULATE REMAINING BADGES
-- ===============================

-- Collection & Inventory Badges (8)
INSERT INTO badges (name, description, category, requirement_type, requirement_value, rarity) VALUES
('Pointy End', 'Earned by owning any Knife skin—sharp style unlocked!', 'collection', 'knife_owned', 1, 'rare'),
('Hand-in-Glove', 'A badge for owning any pair of Gloves, adding flair to your hands.', 'collection', 'gloves_owned', 1, 'rare'),
('Legendary Arsenal', 'Awarded for owning 5 different Legendary items at once.', 'collection', 'legendary_items', 5, 'epic'),
('Hoarder', 'A proud badge for filling every slot in your inventory (min. 50 slots).', 'collection', 'inventory_full', 50, 'rare'),
('Master of Contracts', 'Earned by completing 50 Trade-Up Contracts, a crafting legend!', 'collection', 'trade_ups', 50, 'epic'),
('StatTrak™ Master', 'A badge for accumulating 1,000 wins on a single StatTrak™ item.', 'collection', 'stattrak_wins', 1000, 'epic'),
('Gambler', 'Awarded for opening 100 crates—risk and reward in style!', 'collection', 'crates_opened', 100, 'rare'),
('Operator', 'Earned by owning your first Operator skin, stepping into elite territory.', 'collection', 'operator_owned', 1, 'uncommon'),

-- Betting Skill Badges (5)
('Untouchable', 'A badge for achieving a 10-win betting streak—unbeatable!', 'betting', 'win_streak', 10, 'epic'),
('Giant Slayer', 'Earned by winning 10 bets on underdog teams (odds > 3.0).', 'betting', 'underdog_wins', 10, 'rare'),
('Prophet', 'A prophetic badge for winning 1,000 total bets.', 'betting', 'total_wins', 1000, 'epic'),
('The Regular', 'Awarded for placing 5,000 total bets, a true betting regular.', 'betting', 'total_bets', 5000, 'epic'),
('Predictor of the Week', 'Finish #1 on the weekly win-rate leaderboard and claim this title!', 'betting', 'weekly_winrate', 1, 'legendary'),

-- Community & Event Badges (5)
('Referral Master', 'Earned by successfully referring 10 friends who reach Level 10.', 'community', 'referrals', 10, 'epic'),
('Community Voice', 'A badge for casting 500 community votes on matches—your voice counts!', 'community', 'votes_cast', 500, 'rare'),
('Moderator', 'A staff-assigned badge for community moderators, a mark of authority.', 'community', 'moderator', 1, 'legendary'),
('Summer Offensive 2025', 'Participated in the Summer 2025 event—wear this seasonal badge with pride!', 'community', 'summer_event', 1, 'rare'),
('Winter Major 2025', 'A badge for joining the Winter 2025 event, celebrating a major milestone.', 'community', 'winter_event', 1, 'rare');

-- ===============================
-- POPULATE CRATES
-- ===============================
INSERT INTO crates (name, description, coin_price, rarity_common, rarity_uncommon, rarity_rare, rarity_epic, rarity_legendary) VALUES
('Level Up Crate', 'A standard crate awarded every time you level up, packed with a random item to boost your collection.', 0, 70.0, 20.0, 7.0, 2.5, 0.5),
('Weekly Loyalty Crate', 'A special crate earned after a 7-day login streak, offering a much higher chance for rare and exciting items.', 0, 0.0, 60.0, 25.0, 12.0, 3.0),
('Prestige Crate', 'An elite crate unlocked only upon achieving Prestige, guaranteeing a high-tier item to showcase your mastery.', 0, 0.0, 0.0, 50.0, 40.0, 10.0),
('Trade-Up Crate', 'A crate received after a successful Trade-Up Contract, filled with better-than-average items to elevate your arsenal.', 0, 20.0, 50.0, 20.0, 8.0, 2.0),
('Summer 2025 Crate', 'A limited-time crate available during the Summer 2025 event, featuring exclusive items to celebrate the season.', 500, 50.0, 25.0, 15.0, 8.0, 2.0);

-- ===============================
-- POPULATE ITEMS
-- ===============================

-- Common Skins (20)
INSERT INTO items (name, description, category, weapon_type, rarity, coin_price, gem_price, sell_price) VALUES
('P250 | Sand Dune', 'A sleek, sandy finish for your P250, perfect for a subtle yet stylish start.', 'skin', 'p250', 'common', 100, 0, 25),
('Nova | Polar Mesh', 'A cool, mesh-patterned Nova skin to add a frosty edge to your loadout.', 'skin', 'nova', 'common', 100, 0, 25),
('MP7 | Army Recon', 'A rugged, military-inspired MP7 skin for the tactical player.', 'skin', 'mp7', 'common', 120, 0, 30),
('G3SG1 | Jungle Dashed', 'A jungle-themed G3SG1 with dashed patterns for a wild look.', 'skin', 'g3sg1', 'common', 110, 0, 27),
('P90 | Ash Wood', 'An ash-wood textured P90, blending nature with firepower.', 'skin', 'p90', 'common', 130, 0, 32),
('Tec-9 | Urban DDPAT', 'An urban camouflage Tec-9, ideal for city skirmishes.', 'skin', 'tec9', 'common', 90, 0, 22),
('UMP-45 | Carbon Fiber', 'A sleek carbon fiber UMP-45 for a modern, lightweight feel.', 'skin', 'ump45', 'common', 140, 0, 35),
('MAC-10 | Tarnish', 'A weathered MAC-10 with a tarnished finish for a gritty vibe.', 'skin', 'mac10', 'common', 85, 0, 21),
('XM1014 | Blue Spruce', 'A blue spruce XM1014, bringing a touch of forest elegance.', 'skin', 'xm1014', 'common', 95, 0, 23),
('Sawed-Off | Forest DDPAT', 'A forest camouflage Sawed-Off, perfect for woodland battles.', 'skin', 'sawedoff', 'common', 80, 0, 20),
('Five-SeveN | Coolant', 'A coolant-coated Five-SeveN with a refreshing, icy design.', 'skin', 'fiveseven', 'common', 105, 0, 26),
('MP9 | Storm', 'A stormy MP9 skin, charged with dynamic energy.', 'skin', 'mp9', 'common', 115, 0, 28),
('Glock-18 | High Beam', 'A high-beam Glock-18, lighting up your arsenal with style.', 'skin', 'glock', 'common', 125, 0, 31),
('SSG 08 | Abyss', 'An abyssal SSG 08, diving into deep, mysterious tones.', 'skin', 'ssg08', 'common', 135, 0, 33),
('Dual Berettas | Contractor', 'A contractor-grade Dual Berettas for a no-nonsense look.', 'skin', 'dualberettas', 'common', 75, 0, 18),
('Galil AR | Stone Cold', 'A stone-cold Galil AR, carved with a rugged, icy edge.', 'skin', 'galil', 'common', 110, 0, 27),
('M249 | Predator', 'A predatory M249, ready to dominate with a fierce design.', 'skin', 'm249', 'common', 145, 0, 36),
('FAMAS | Colony', 'A colonial FAMAS skin, blending history with firepower.', 'skin', 'famas', 'common', 100, 0, 25),
('SG 553 | Anodized Navy', 'A navy-anodized SG 553, offering a sleek maritime style.', 'skin', 'sg553', 'common', 120, 0, 30),
('USP-S | Forest Leaves', 'A forest-leaves USP-S, bringing natural beauty to your shots.', 'skin', 'usp', 'common', 110, 0, 27),

-- Legendary Knives (10)
('Karambit | Doppler', 'A dazzling Karambit with a Doppler effect, a true collector''s gem.', 'knife', 'karambit', 'legendary', 50000, 2500, 12500),
('Butterfly Knife | Fade', 'A stunning Butterfly Knife with a fade finish, radiating luxury.', 'knife', 'butterfly', 'legendary', 45000, 2250, 11250),
('M9 Bayonet | Lore', 'An M9 Bayonet etched with lore, a legendary piece of art.', 'knife', 'm9', 'legendary', 48000, 2400, 12000),
('Talon Knife | Slaughter', 'A Talon Knife with a slaughter pattern, fierce and bold.', 'knife', 'talon', 'legendary', 52000, 2600, 13000),
('Skeleton Knife | Crimson Web', 'A Skeleton Knife with crimson webs, dripping with elegance.', 'knife', 'skeleton', 'legendary', 55000, 2750, 13750),
('Huntsman Knife | Tiger Tooth', 'A Huntsman Knife with tiger tooth markings, wild and powerful.', 'knife', 'huntsman', 'legendary', 47000, 2350, 11750),
('Bowie Knife | Case Hardened', 'A Case Hardened Bowie Knife, tough and timeless.', 'knife', 'bowie', 'legendary', 44000, 2200, 11000),
('Falchion Knife | Marble Fade', 'A Falchion Knife with a marble fade, blending beauty and strength.', 'knife', 'falchion', 'legendary', 46000, 2300, 11500),
('Shadow Daggers | Autotronic', 'Shadow Daggers with an autotronic finish, sleek and futuristic.', 'knife', 'shadow', 'legendary', 43000, 2150, 10750),
('Ursus Knife | Ultraviolet', 'An Ursus Knife in ultraviolet, glowing with rare intensity.', 'knife', 'ursus', 'legendary', 49000, 2450, 12250),

-- Epic to Legendary Gloves (10)
('Sport Gloves | Pandora''s Box', 'Sport Gloves with a Pandora''s Box design, a mythical masterpiece.', 'gloves', 'sport', 'legendary', 35000, 1750, 8750),
('Specialist Gloves | Emerald Web', 'Specialist Gloves with an emerald web, exuding rare elegance.', 'gloves', 'specialist', 'legendary', 38000, 1900, 9500),
('Moto Gloves | Spearmint', 'Moto Gloves in spearmint, offering a fresh and bold look.', 'gloves', 'moto', 'epic', 15000, 750, 3750),
('Hand Wraps | Cobalt Skulls', 'Hand Wraps with cobalt skulls, a striking and powerful choice.', 'gloves', 'handwraps', 'epic', 16000, 800, 4000),
('Driver Gloves | King Snake', 'Driver Gloves with a king snake pattern, regal and commanding.', 'gloves', 'driver', 'epic', 17000, 850, 4250),
('Broken Fang Gloves | Jade', 'Broken Fang Gloves in jade, blending toughness with beauty.', 'gloves', 'brokenfang', 'epic', 14000, 700, 3500),
('Bloodhound Gloves | Charred', 'Bloodhound Gloves with a charred finish, rugged and intense.', 'gloves', 'bloodhound', 'rare', 8000, 400, 2000),
('Hydra Gloves | Case Hardened', 'Hydra Gloves with a case-hardened style, durable and unique.', 'gloves', 'hydra', 'rare', 8500, 425, 2125),
('Hand Wraps | Duct Tape', 'Hand Wraps with a duct tape look, practical yet stylish.', 'gloves', 'handwraps', 'uncommon', 3000, 150, 750),
('Moto Gloves | Transport', 'Moto Gloves in a transport design, ready for any journey.', 'gloves', 'moto', 'uncommon', 3200, 160, 800),

-- AWP Skins (20)
('AWP | Dragon Lore', 'The iconic AWP Dragon Lore, a legendary sniper''s dream.', 'skin', 'awp', 'legendary', 75000, 3750, 18750),
('AWP | Gungnir', 'An AWP Gungnir, forged with mythical power.', 'skin', 'awp', 'legendary', 70000, 3500, 17500),
('AWP | Medusa', 'An AWP Medusa, turning foes to stone with its beauty.', 'skin', 'awp', 'legendary', 72000, 3600, 18000),
('AWP | Containment Breach', 'An AWP Containment Breach, radiating hazardous allure.', 'skin', 'awp', 'epic', 25000, 1250, 6250),
('AWP | Hyper Beast', 'An AWP Hyper Beast, wild and ferocious in design.', 'skin', 'awp', 'epic', 22000, 1100, 5500),
('AWP | Asiimov', 'An AWP Asiimov, futuristic and eye-catching.', 'skin', 'awp', 'epic', 20000, 1000, 5000),
('AWP | Neo-Noir', 'An AWP Neo-Noir, blending dark elegance with style.', 'skin', 'awp', 'epic', 23000, 1150, 5750),
('AWP | Wildfire', 'An AWP Wildfire, blazing with intense energy.', 'skin', 'awp', 'epic', 24000, 1200, 6000),
('AWP | Redline', 'An AWP Redline, striking with a bold red streak.', 'skin', 'awp', 'rare', 8000, 400, 2000),
('AWP | Corticera', 'An AWP Corticera, featuring a unique bark-like pattern.', 'skin', 'awp', 'rare', 7500, 375, 1875),
('AWP | Elite Build', 'An AWP Elite Build, built for precision and prestige.', 'skin', 'awp', 'rare', 8500, 425, 2125),
('AWP | Fever Dream', 'An AWP Fever Dream, surreal and captivating.', 'skin', 'awp', 'rare', 9000, 450, 2250),
('AWP | Phobos', 'An AWP Phobos, inspired by the Martian moon''s mystique.', 'skin', 'awp', 'rare', 7800, 390, 1950),
('AWP | Atheris', 'An AWP Atheris, sleek with a snake-inspired design.', 'skin', 'awp', 'uncommon', 3500, 175, 875),
('AWP | PAW', 'An AWP PAW, playful yet powerful.', 'skin', 'awp', 'uncommon', 3200, 160, 800),
('AWP | Exoskeleton', 'An AWP Exoskeleton, armored and tough.', 'skin', 'awp', 'uncommon', 3600, 180, 900),
('AWP | Capillary', 'An AWP Capillary, delicate yet deadly.', 'skin', 'awp', 'uncommon', 3400, 170, 850),
('AWP | Chromatic Aberration', 'An AWP Chromatic Aberration, with a mesmerizing color shift.', 'skin', 'awp', 'epic', 21000, 1050, 5250),
('AWP | POP AWP', 'An AWP POP AWP, vibrant and pop-art inspired.', 'skin', 'awp', 'uncommon', 3800, 190, 950),
('AWP | Worm God', 'An AWP Worm God, earthy and otherworldly.', 'skin', 'awp', 'uncommon', 3300, 165, 825),

-- Operator Skins (10)
('Sir Bloody Darryl', 'The legendary Sir Bloody Darryl, a fierce operator icon.', 'operator', 'operator', 'epic', 12000, 600, 3000),
('Agent Ava | FBI', 'Agent Ava from the FBI, ready for elite missions.', 'operator', 'operator', 'epic', 11500, 575, 2875),
('Number K | Sabre', 'Number K of Sabre, a tactical powerhouse.', 'operator', 'operator', 'epic', 12500, 625, 3125),
('Slingshot | Phoenix', 'Slingshot from Phoenix, agile and bold.', 'operator', 'operator', 'rare', 6000, 300, 1500),
('Frogman | SEAL Team 6', 'Frogman of SEAL Team 6, stealthy and skilled.', 'operator', 'operator', 'rare', 6500, 325, 1625),
('Officer | SAS', 'An SAS Officer, commanding with authority.', 'operator', 'operator', 'rare', 6200, 310, 1550),
('Swoop Squad | FBI', 'Swoop Squad from the FBI, swift and precise.', 'operator', 'operator', 'rare', 6300, 315, 1575),
('Gendarmerie Nationale', 'A Gendarmerie Nationale operator, disciplined and strong.', 'operator', 'operator', 'uncommon', 2500, 125, 625),
('The Doctor | Professionals', 'The Doctor from the Professionals, healing with style.', 'operator', 'operator', 'epic', 11000, 550, 2750),
('Elite Crew | Phoenix', 'Elite Crew from Phoenix, a top-tier team player.', 'operator', 'operator', 'rare', 5800, 290, 1450);

-- Continue with AK-47 and M4 skins in next part...