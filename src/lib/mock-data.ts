
import { Gem, Swords as SwordsIcon, Gamepad2 as Gamepad2Icon, User as UserIcon, Trophy as TrophyIcon, Award as AwardIcon, Crown as CrownIcon, Zap as ZapIcon, Shield, Radio, Hand, Slice, LogIn, Send, Vote, ShoppingBag, BarChart2, Star, CheckCircle, Repeat, PcCase, Palette, Sparkles, Diamond, Gauge, ChevronsUp, Coins, Brush, Badge, FolderPlus, Repeat2, LifeBuoy, Ticket, PercentCircle, BrainCircuit, MessageSquare, HelpCircle, Lightbulb, Rocket, Puzzle, Bomb, Gamepad2 } from "lucide-react";

export type Activity = {
  id: number;
  user: string;
  action: string;
  item?: string;
  rarity?: Rarity;
  xp?: number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';

export const activityFeedData: Activity[] = [
  { id: 1, user: 'john325', action: 'opened', item: 'Karambit | Doppler', rarity: 'Legendary', icon: Gem },
  { id: 2, user: 'copilot32', action: 'won Match #560C', xp: 250, icon: TrophyIcon },
  { id: 3, user: 'PixelWarrior', action: 'unlocked Badge', item: 'Trigger Master', icon: AwardIcon },
  { id: 4, user: 'NIGHTRAGE', action: 'reached', item: 'Prestige Tier IV', icon: CrownIcon },
  { id: 5, user: 'HydraX', action: 'completed', item: 'Flash and Dash | +Crate: Ember', icon: ZapIcon },
];

export type FeaturedItem = {
  id: number;
  name: string;
  type: string;
  rarity: Rarity;
  image: string;
  dataAiHint: string;
};

// Helper function to generate fallback image URLs with picsum.photos as backup
function generateImageUrl(itemName: string, itemType: string): string {
  // For now, let's use placeholders with themed images to avoid 404s
  const itemHash = itemName.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  
  if (itemType.includes('Knife') || itemType.includes('Knives')) {
    return `https://picsum.photos/seed/knife${itemHash}/300/200`;
  } else if (itemType.includes('Gloves')) {
    return `https://picsum.photos/seed/gloves${itemHash}/300/200`;
  } else if (itemType.includes('Agent') || itemType.includes('Operator')) {
    return `https://picsum.photos/seed/agent${itemHash}/300/200`;
  } else {
    // For weapon skins
    return `https://picsum.photos/seed/weapon${itemHash}/300/200`;
  }
}

export const featuredItemsData: FeaturedItem[] = [
  { id: 1, name: 'Driver Gloves | Imperial Plaid', type: 'Gloves', rarity: 'Epic', image: generateImageUrl('Driver Gloves | Imperial Plaid', 'Gloves'), dataAiHint: "plaid gloves" },
  { id: 2, name: 'Karambit | Case Hardened', type: 'Knife', rarity: 'Legendary', image: generateImageUrl('Karambit | Case Hardened', 'Knife'), dataAiHint: "blue steel knife" },
  { id: 3, name: 'Hydra Gloves | Case Hardened', type: 'Gloves', rarity: 'Epic', image: generateImageUrl('Hydra Gloves | Case Hardened', 'Gloves'), dataAiHint: "snakeskin gloves" },
  { id: 4, name: 'AK-47 | Asiimov', type: 'Rifle', rarity: 'Epic', image: generateImageUrl('AK-47 | Asiimov', 'Rifle'), dataAiHint: "orange white rifle" },
  { id: 5, name: 'AWP | Dragon Lore', type: 'Sniper', rarity: 'Legendary', image: generateImageUrl('AWP | Dragon Lore', 'Sniper'), dataAiHint: "dragon sniper rifle" },
  { id: 6, name: 'Glock-18 | Water Elemental', type: 'Pistol', rarity: 'Rare', image: generateImageUrl('Glock-18 | Water Elemental', 'Pistol'), dataAiHint: "water monster handgun" },
  { id: 7, name: 'Desert Eagle | Blaze', type: 'Pistol', rarity: 'Epic', image: generateImageUrl('Desert Eagle | Blaze', 'Pistol'), dataAiHint: "flame pistol" },
  { id: 8, name: 'USP-S | Kill Confirmed', type: 'Pistol', rarity: 'Legendary', image: generateImageUrl('USP-S | Kill Confirmed', 'Pistol'), dataAiHint: "skull handgun" },
];

export const rarityColors: Record<Rarity, string> = {
  'Common': 'text-gray-400',
  'Uncommon': 'text-green-400',
  'Rare': 'text-blue-400',
  'Epic': 'text-purple-400',
  'Legendary': 'text-red-400',
};

export const rarityGlow: Record<Rarity, string> = {
    'Common': '',
    'Uncommon': '',
    'Rare': 'glow-rare',
    'Epic': 'glow-epic',
    'Legendary': 'glow-legendary',
}


export type Team = {
  name: string;
  logo: string;
  dataAiHint: string;
};

export type MatchStatus = 'Upcoming' | 'Live' | 'Finished';

export type Match = {
  id: string;
  team1: Team;
  team2: Team;
  odds1: number;
  odds2: number;
  startTime: string;
  status: MatchStatus;
  tournament?: string;
  event_name?: string;
  start_time?: string;
  time?: string;
  map?: string;
};

export const upcomingMatchesData: Match[] = [
  { id: '1', team1: { name: 'Natus Vincere', logo: 'https://picsum.photos/48/48?random=11', dataAiHint: "esports logo" }, team2: { name: 'FaZe Clan', logo: 'https://picsum.photos/48/48?random=12', dataAiHint: "gaming logo" }, odds1: 1.85, odds2: 1.95, startTime: '18:00 CEST', status: 'Upcoming' },
  { id: '2', team1: { name: 'G2 Esports', logo: 'https://picsum.photos/48/48?random=13', dataAiHint: "team logo" }, team2: { name: 'Team Vitality', logo: 'https://picsum.photos/48/48?random=14', dataAiHint: "esports team" }, odds1: 2.10, odds2: 1.75, startTime: '20:00 CEST', status: 'Upcoming' },
  { id: '3', team1: { name: 'Astralis', logo: 'https://picsum.photos/48/48?random=15', dataAiHint: "star logo" }, team2: { name: 'MOUZ', logo: 'https://picsum.photos/48/48?random=16', dataAiHint: "mouse logo" }, odds1: 1.60, odds2: 2.30, startTime: '22:00 CEST', status: 'Upcoming' },
];

export const liveMatchesData: Match[] = [
    { id: '4', team1: { name: 'Cloud9', logo: 'https://picsum.photos/48/48?random=17', dataAiHint: "cloud logo" }, team2: { name: 'Team Liquid', logo: 'https://picsum.photos/48/48?random=18', dataAiHint: "horse logo" }, odds1: 1.70, odds2: 2.15, startTime: 'Live', status: 'Live' },
];

export const finishedMatchesData: Match[] = [
    { id: '5', team1: { name: 'Ninjas in Pyjamas', logo: 'https://picsum.photos/48/48?random=19', dataAiHint: "ninja logo" }, team2: { name: 'Fnatic', logo: 'https://picsum.photos/48/48?random=20', dataAiHint: "orange logo" }, odds1: 2.25, odds2: 1.65, startTime: 'Finished', status: 'Finished' },
];


export type LeaderboardPlayer = {
  id?: string;
  rank?: number;
  name: string;
  avatar: string;
  dataAiHint: string;
  xp: number;
};

export const xpLeaderboardData: LeaderboardPlayer[] = [
  { id: '1', rank: 1, name: 'ShadowStrike', avatar: 'https://picsum.photos/40/40?random=21', dataAiHint: "gamer avatar", xp: 1250320 },
  { id: '2', rank: 2, name: 'Vortex', avatar: 'https://picsum.photos/40/40?random=22', dataAiHint: "gaming profile", xp: 1198750 },
  { id: '3', rank: 3, name: 'Phoenix', avatar: 'https://picsum.photos/40/40?random=23', dataAiHint: "user avatar", xp: 1150600 },
  { id: '4', rank: 4, name: 'Reaper', avatar: 'https://picsum.photos/40/40?random=24', dataAiHint: "gaming avatar", xp: 1099800 },
  { id: '5', rank: 5, name: 'Fury', avatar: 'https://picsum.photos/40/40?random=25', dataAiHint: "player avatar", xp: 1056240 },
];

export const coinsLeaderboardData = [
    { rank: 1, name: 'CoinMagnate', avatar: 'https://picsum.photos/40/40?random=31', dataAiHint: "rich player", xp: 0, coinsWon: 2500000 },
    { rank: 2, name: 'Goldfinger', avatar: 'https://picsum.photos/40/40?random=32', dataAiHint: "gold avatar", xp: 0, coinsWon: 2350000 },
    { rank: 3, name: 'Richie', avatar: 'https://picsum.photos/40/40?random=33', dataAiHint: "money avatar", xp: 0, coinsWon: 2100000 },
    { rank: 4, name: 'TheBank', avatar: 'https://picsum.photos/40/40?random=34', dataAiHint: "banker avatar", xp: 0, coinsWon: 1980000 },
    { rank: 5, name: 'Fortune', avatar: 'https://picsum.photos/40/40?random=35', dataAiHint: "lucky avatar", xp: 0, coinsWon: 1850000 },
]

export const achievementsLeaderboardData = [
    { rank: 1, name: 'Achiever', avatar: 'https://picsum.photos/40/40?random=41', dataAiHint: "achiever avatar", xp: 0, achievements: 150 },
    { rank: 2, name: 'TrophyHunter', avatar: 'https://picsum.photos/40/40?random=42', dataAiHint: "hunter avatar", xp: 0, achievements: 145 },
    { rank: 3, name: 'TheCollector', avatar: 'https://picsum.photos/40/40?random=43', dataAiHint: "collector avatar", xp: 0, achievements: 142 },
    { rank: 4, name: 'QuestMaster', avatar: 'https://picsum.photos/40/40?random=44', dataAiHint: "quest avatar", xp: 0, achievements: 138 },
    { rank: 5, name: 'GoalGetter', avatar: 'https://picsum.photos/40/40?random=45', dataAiHint: "goal avatar", xp: 0, achievements: 135 },
]

export const topPredictorsLeaderboardData = [
    { rank: 1, name: 'TheOracle', avatar: 'https://picsum.photos/40/40?random=51', dataAiHint: 'wise seer', xp: 0, matchesWon: 215 },
    { rank: 2, name: 'Nostradamus', avatar: 'https://picsum.photos/40/40?random=52', dataAiHint: 'mystic man', xp: 0, matchesWon: 209 },
    { rank: 3, name: 'Clairvoyant', avatar: 'https://picsum.photos/40/40?random=53', dataAiHint: 'crystal ball', xp: 0, matchesWon: 201 },
    { rank: 4, name: 'Soothsayer', avatar: 'https://picsum.photos/40/40?random=54', dataAiHint: 'fortune teller', xp: 0, matchesWon: 195 },
    { rank: 5, name: 'Visionary', avatar: 'https://picsum.photos/40/40?random=55', dataAiHint: 'futurist', xp: 0, matchesWon: 188 },
];

export const contributorsLeaderboardData = [
    { rank: 1, name: 'Patron', avatar: 'https://picsum.photos/40/40?random=61', dataAiHint: 'generous person', xp: 0, contribution: 'Top Donator' },
    { rank: 2, name: 'BugSlayer', avatar: 'https://picsum.photos/40/40?random=62', dataAiHint: 'knight with sword', xp: 0, contribution: 'Bug Hunter' },
    { rank: 3, name: 'TheGuide', avatar: 'https://picsum.photos/40/40?random=63', dataAiHint: 'helping hand', xp: 0, contribution: 'Community Helper' },
    { rank: 4, name: 'Innovator', avatar: 'https://picsum.photos/40/40?random=64', dataAiHint: 'lightbulb head', xp: 0, contribution: 'Feature Suggester' },
    { rank: 5, name: 'Ambassador', avatar: 'https://picsum.photos/40/40?random=65', dataAiHint: 'welcoming person', xp: 0, contribution: 'Top Referrer' },
];


export const featureHighlightsData = [
  {
    icon: SwordsIcon,
    title: 'Match Betting',
    description: 'Predict outcomes on live CS2 matches and win big with our dynamic odds system.',
  },
  {
    icon: Gem,
    title: 'Item Crafting',
    description: 'Trade-up your items in high-stakes contracts for a chance at legendary gear.',
  },
  {
    icon: Gamepad2Icon,
    title: 'Mission System',
    description: 'Complete daily and main missions to earn XP, coins, and exclusive crates.',
  },
  {
    icon: UserIcon,
    title: 'Community',
    description: 'Join our forums, chat with fellow players, and climb the global leaderboards.',
  },
]

export type InventoryItemType = 'Pistol' | 'Rifle' | 'SMG' | 'Heavy' | 'Knife' | 'Gloves' | 'Operator';
export type EquippedSlot = 'primary' | 'secondary' | 'knife' | 'gloves' | 'agent' | 'patch';

export interface ItemStat {
    origin: string;
    value: number;
    statTrak?: number;
}
export interface InventoryItem {
  id: string;
  name: string;
  image: string;
  rarity: Rarity;
  type: InventoryItemType;
  dataAiHint: string;
  stat?: ItemStat;
}

export const inventoryData: InventoryItem[] = [
    { id: '1', name: 'Glock-18 | Fade', image: generateImageUrl('Glock-18 | Fade', 'Pistol'), rarity: 'Epic', type: 'Pistol', dataAiHint: "rainbow pistol", stat: { origin: 'Crate Drop', value: 4500 } },
    { id: '2', name: 'USP-S | Neo-Noir', image: generateImageUrl('USP-S | Neo-Noir', 'Pistol'), rarity: 'Rare', type: 'Pistol', dataAiHint: "comic book pistol", stat: { origin: 'Trade-up', value: 1200 } },
    { id: '3', name: 'Desert Eagle | Blaze', image: generateImageUrl('Desert Eagle | Blaze', 'Pistol'), rarity: 'Legendary', type: 'Pistol', dataAiHint: "flame decal pistol", stat: { origin: 'Market', value: 8500 } },
    { id: '4', name: 'AK-47 | Redline', image: generateImageUrl('AK-47 | Redline', 'Rifle'), rarity: 'Rare', type: 'Rifle', dataAiHint: "red stripe rifle", stat: { origin: 'Crate Drop', value: 2200, statTrak: 1234 } },
    { id: '5', name: 'M4A4 | Howl', image: generateImageUrl('M4A4 | Howl', 'Rifle'), rarity: 'Legendary', type: 'Rifle', dataAiHint: "roaring beast rifle", stat: { origin: 'Crate Drop', value: 15000 } },
    { id: '6', name: 'AWP | Dragon Lore', image: generateImageUrl('AWP | Dragon Lore', 'Rifle'), rarity: 'Legendary', type: 'Rifle', dataAiHint: "golden dragon sniper", stat: { origin: 'Trade-up', value: 25000 } },
    { id: '7', name: 'MP9 | Bulldozer', image: generateImageUrl('MP9 | Bulldozer', 'SMG'), rarity: 'Uncommon', type: 'SMG', dataAiHint: "solid yellow smg", stat: { origin: 'Market', value: 50 } },
    { id: '8', name: 'MAC-10 | Neon Rider', image: generateImageUrl('MAC-10 | Neon Rider', 'SMG'), rarity: 'Epic', type: 'SMG', dataAiHint: "80s synthwave smg", stat: { origin: 'Crate Drop', value: 3800 } },
    { id: '9', name: 'Nova | Hyper Beast', image: generateImageUrl('Nova | Hyper Beast', 'Heavy'), rarity: 'Epic', type: 'Heavy', dataAiHint: "colorful monster shotgun", stat: { origin: 'Trade-up', value: 3200 } },
    { id: '10', name: 'Karambit | Doppler', image: generateImageUrl('Karambit | Doppler', 'Knife'), rarity: 'Legendary', type: 'Knife', dataAiHint: "nebula curved knife", stat: { origin: 'Market', value: 18000 } },
    { id: '11', name: 'Butterfly Knife | Fade', image: generateImageUrl('Butterfly Knife | Fade', 'Knife'), rarity: 'Legendary', type: 'Knife', dataAiHint: "gradient balisong knife", stat: { origin: 'Crate Drop', value: 22000 } },
    { id: '12', name: 'Sport Gloves | Pandora\'s Box', image: generateImageUrl('Sport Gloves | Pandora\'s Box', 'Gloves'), rarity: 'Legendary', type: 'Gloves', dataAiHint: "purple black gloves", stat: { origin: 'Crate Drop', value: 19500 } },
    { id: '13', name: 'Hand Wraps | Cobalt Skulls', image: generateImageUrl('Hand Wraps | Cobalt Skulls', 'Gloves'), rarity: 'Epic', type: 'Gloves', dataAiHint: "blue skull hand wraps", stat: { origin: 'Trade-up', value: 5500 } },
    { id: '14', name: 'P250 | Asiimov', image: generateImageUrl('P250 | Asiimov', 'Pistol'), rarity: 'Rare', type: 'Pistol', dataAiHint: "orange white sci-fi pistol", stat: { origin: 'Market', value: 950 } },
    { id: '15', name: 'AUG | Akihabara Accept', image: generateImageUrl('AUG | Akihabara Accept', 'Rifle'), rarity: 'Legendary', type: 'Rifle', dataAiHint: "anime girl rifle", stat: { origin: 'Market', value: 4000 } },
];

export const equippedItems = {
  agent: { id: 'agent1', name: 'Special Agent Ava | FBI', image: generateImageUrl('Special Agent Ava | FBI', 'Agent'), rarity: 'Epic', dataAiHint: "female soldier" },
  gloves: { id: '12', name: 'Sport Gloves | Pandora\'s Box', image: generateImageUrl('Sport Gloves | Pandora\'s Box', 'Gloves'), rarity: 'Legendary', type: 'Gloves', dataAiHint: "purple black gloves" },
  knife: { id: '11', name: 'Butterfly Knife | Fade', image: generateImageUrl('Butterfly Knife | Fade', 'Knife'), rarity: 'Legendary', type: 'Knife', dataAiHint: "gradient balisong knife" },
  primary: { id: '5', name: 'M4A4 | Howl', image: generateImageUrl('M4A4 | Howl', 'Rifle'), rarity: 'Legendary', type: 'Rifle', dataAiHint: "roaring beast rifle" },
  secondary: { id: '3', name: 'Desert Eagle | Blaze', image: generateImageUrl('Desert Eagle | Blaze', 'Pistol'), rarity: 'Legendary', type: 'Pistol', dataAiHint: "flame decal pistol" },
};

export const itemCategories = {
    'Pistol': inventoryData.filter(item => item.type === 'Pistol'),
    'Rifle': inventoryData.filter(item => item.type === 'Rifle'),
    'SMG': inventoryData.filter(item => item.type === 'SMG'),
    'Heavy': inventoryData.filter(item => item.type === 'Heavy'),
    'Knife': inventoryData.filter(item => item.type === 'Knife'),
    'Gloves': inventoryData.filter(item => item.type === 'Gloves'),
}

export const equippedSlotsConfig = [
    { id: 'agent', name: 'Agent', icon: UserIcon },
    { id: 'gloves', name: 'Gloves', icon: Hand },
    { id: 'knife', name: 'Knife', icon: Slice },
    { id: 'primary', name: 'Primary', icon: Radio },
    { id: 'secondary', name: 'Secondary', icon: Radio },
    { id: 'perks', name: 'Perks', icon: Star },
];

export const perks = [
    { name: 'XP Booster', description: '+10% XP from all sources', icon: ZapIcon },
    { name: 'Lucky Charm', description: 'Slightly increases rare item drop rate', icon: Gem },
    { name: 'Quick Sell', description: 'Reduces market commission by 5%', icon: ShoppingBag },
]

export const userStats = [
    { label: 'Crates Opened', value: 142, icon: PcCase },
    { label: 'Trade-ups', value: 38, icon: Repeat },
    { label: 'Perks Owned', value: perks.length, icon: Star },
    { label: 'StatTrak™ Kills', value: '1,234', icon: BarChart2 },
];


export const dailyMissions = [
    { id: 'login', title: 'Log In', description: 'Kick off your day with a simple login.', xpReward: 50, icon: LogIn },
    { id: 'place-bet', title: 'Place a Bet', description: 'Test your prediction skills on any match.', xpReward: 100, icon: SwordsIcon },
    { id: 'cast-vote', title: 'Cast a Vote', description: 'Make your voice heard in a community vote.', xpReward: 25, icon: Vote },
    { id: 'chatterbox', title: 'Chatterbox', description: 'Send 5 messages in any chat room.', xpReward: 50, icon: Send },
    { id: 'place-3-bets', title: 'Place 3 Bets', description: 'Up the ante by placing three separate bets.', xpReward: 150, icon: SwordsIcon },
    { id: 'window-shopper', title: 'Window Shopper', description: 'Explore the shop for new skins and crates.', xpReward: 25, icon: ShoppingBag },
    { id: 'coin-earner', title: 'Coin Earner', description: 'Rack up at least 500 Coins from winning bets.', xpReward: 200, icon: Gem },
    { id: 'check-ranks', title: 'Check the Ranks', description: 'Visit the leaderboard page.', xpReward: 25, icon: BarChart2 },
    { id: 'win-bet', title: 'Win a Bet', description: 'Successfully predict a match outcome.', xpReward: 250, icon: TrophyIcon },
    
    // Arcade-specific achievements
    { id: 'first-crash', title: 'First Crash', description: 'Play your first Crash game.', xpReward: 50, icon: Rocket },
    { id: 'crash-cashout-3x', title: 'Triple Threat', description: 'Cash out at 3x multiplier or higher in Crash.', xpReward: 100, icon: Rocket },
    { id: 'crash-streak-3', title: 'Crash Master', description: 'Cash out successfully 3 times in a row in Crash.', xpReward: 200, icon: Rocket },
    { id: 'coinflip-winner', title: 'Lucky Flip', description: 'Win your first Coinflip game.', xpReward: 75, icon: Coins },
    { id: 'coinflip-streak-5', title: 'Flip Master', description: 'Win 5 Coinflip games in a row.', xpReward: 250, icon: Coins },
    { id: 'plinko-big-win', title: 'Plinko Champion', description: 'Win 10x or more in a single Plinko drop.', xpReward: 150, icon: Puzzle },
    { id: 'sweeper-expert', title: 'Mine Sweeper', description: 'Successfully clear 10 tiles in Sweeper without hitting a mine.', xpReward: 200, icon: Bomb },
    { id: 'arcade-addict', title: 'Arcade Addict', description: 'Play 100 arcade games total.', xpReward: 500, icon: Gamepad2 },
    { id: 'high-roller', title: 'High Roller', description: 'Place a bet of 1000 coins or more in any arcade game.', xpReward: 300, icon: Gem },
];

export const mainMissions = [
    { id: 'main-1', tier: 1, title: 'The First Step', description: 'Take your first bet and step into the world of predictions.', xpReward: 100, coinReward: 50, icon: SwordsIcon },
    { id: 'main-2', tier: 1, title: 'A Winner is You', description: 'Win your very first bet.', xpReward: 250, coinReward: 100, icon: TrophyIcon },
    { id: 'main-3', tier: 1, title: 'Join the Conversation', description: 'Cast your first community vote.', xpReward: 50, icon: Vote },
    { id: 'main-4', tier: 1, title: 'Getting Paid', description: 'Earn your first 1,000 Coins.', xpReward: 150, coinReward: 250, icon: Gem },
    { id: 'main-5', tier: 1, title: 'Moving Up', description: 'Reach Level 5.', xpReward: 500, crateReward: 'Level Up Crate', icon: Star },
    { id: 'main-6', tier: 1, title: 'What’s in the Box?', description: 'Open your first Crate.', xpReward: 100, icon: Gem },
    { id: 'main-7', tier: 1, title: 'Gear Up', description: 'Equip your first item to your profile.', xpReward: 75, icon: Shield },
    { id: 'main-8', tier: 1, title: 'Liquidate Assets', description: 'Sell an item back to the shop for the first time.', xpReward: 50, coinReward: 25, icon: ShoppingBag },
    { id: 'main-9', tier: 1, title: 'Sizing Up Competition', description: 'Check out the leaderboard to see where you stand.', xpReward: 25, icon: BarChart2 },
    { id: 'main-10', tier: 1, title: 'Speak Your Mind', description: 'Make your first forum post.', xpReward: 50, icon: Send },

    { id: 'main-11', tier: 2, title: 'Active Bettor', description: 'Place 25 bets and prove your dedication.', xpReward: 250, coinReward: 100, icon: SwordsIcon },
    { id: 'main-12', tier: 2, title: 'Novice Predictor', description: 'Win 10 bets and earn a hefty XP boost.', xpReward: 500, coinReward: 200, icon: TrophyIcon },
    { id: 'main-13', tier: 2, title: 'Climbing the Ladder', description: 'Reach Level 25.', xpReward: 1000, crateReward: 'Level Up Crate', icon: Star },
    { id: 'main-14', tier: 2, title: 'Building a Bank', description: 'Accumulate 25,000 Coins.', xpReward: 750, coinReward: 500, icon: Gem },
    { id: 'main-15', tier: 2, title: 'Daily Dedication', description: 'Complete 20 Daily Missions.', xpReward: 500, icon: CheckCircle },
    { id: 'main-16', tier: 2, title: 'The Comeback', description: 'Win a bet on a team with odds of 2.5 or higher.', xpReward: 300, coinReward: 150, icon: TrophyIcon },
    { id: 'main-17', tier: 2, title: 'Hot Streak', description: 'Win 3 bets in a row.', xpReward: 400, coinReward: 200, icon: ZapIcon },
    { id: 'main-18', tier: 2, title: 'Crate Opener', description: 'Open 10 Crates.', xpReward: 200, icon: Gem },
    { id: 'main-19', tier: 2, title: 'Armory Started', description: 'Own 5 different skins.', xpReward: 150, icon: Shield },
    { id: 'main-20', tier: 2, title: 'The Alchemist', description: 'Complete your first Trade-Up Contract.', xpReward: 250, icon: ZapIcon },
    { id: 'main-21', tier: 2, title: 'Power Up', description: 'Purchase a perk from the shop.', xpReward: 100, icon: ShoppingBag },
    { id: 'main-22', tier: 2, title: 'Opinionated', description: 'Cast 50 community votes.', xpReward: 150, icon: Vote },
    { id: 'main-23', tier: 2, title: 'Show Off', description: 'Customize your profile showcase.', xpReward: 100, icon: UserIcon },
    { id: 'main-24', tier: 2, title: 'Community Member', description: 'Make 10 forum posts.', xpReward: 200, icon: Send },
    { id: 'main-25', tier: 2, title: 'The Recruiter', description: 'Successfully refer a friend.', xpReward: 1000, icon: UserIcon },

    { id: 'main-26', tier: 3, title: 'Serious Bettor', description: 'Place 100 bets.', xpReward: 1000, icon: SwordsIcon },
    { id: 'main-27', tier: 3, title: 'Skilled Predictor', description: 'Win 50 bets.', xpReward: 1500, icon: TrophyIcon },
    { id: 'main-28', tier: 3, title: 'Half-Century', description: 'Reach Level 50.', xpReward: 2500, crateReward: 'Prestige Crate', icon: Star },
    { id: 'main-29', tier: 3, title: 'Getting Rich', description: 'Accumulate 100,000 Coins.', xpReward: 2000, icon: Gem },
    { id: 'main-30', tier: 3, title: 'Unstoppable Force', description: 'Win 5 bets in a row.', xpReward: 1000, icon: ZapIcon },
    { id: 'main-31', tier: 3, title: 'Rare Collector', description: 'Own a Rare quality item or higher.', xpReward: 500, icon: Gem },
    { id: 'main-32', tier: 3, title: 'Trade Master', description: 'Complete 10 Trade-Up Contracts.', xpReward: 750, icon: ZapIcon },
    { id: 'main-33', tier: 3, title: 'Historian in the Making', description: 'Get 100 wins on a single StatTrak™ item.', xpReward: 1000, icon: BarChart2 },
    { id: 'main-34', tier: 3, title: 'Big Spender', description: 'Spend 50,000 Coins in the shop.', xpReward: 500, icon: ShoppingBag },
    { id: 'main-35', tier: 3, title: 'Weekly Contender', description: 'Finish in the Top 100 on the weekly leaderboard.', xpReward: 1000, icon: TrophyIcon },
    { id: 'main-36', tier: 3, title: 'Epic Collector', description: 'Own an Epic quality item or higher.', xpReward: 1500, icon: Gem },
    { id: 'main-37', tier: 3, title: 'Daily Expert', description: 'Complete 75 Daily Missions.', xpReward: 1000, icon: CheckCircle },
    { id: 'main-38', tier: 3, title: 'Forum Regular', description: 'Make 50 forum posts.', xpReward: 750, icon: Send },
    { id: 'main-39', tier: 3, title: 'Well-Equipped', description: 'Fill 20 inventory slots.', xpReward: 500, icon: Shield },
    { id: 'main-40', tier: 3, 'title': 'Elite Status', description: 'Reach Level 75.', xpReward: 5000, crateReward: 'Prestige Crate', icon: Star },

    { id: 'main-41', tier: 4, title: 'Betting Machine', description: 'Place 1,000 bets.', xpReward: 5000, icon: SwordsIcon },
    { id: 'main-42', tier: 4, title: 'Grandmaster Predictor', description: 'Win 500 bets.', xpReward: 7500, icon: TrophyIcon },
    { id: 'main-43', tier: 4, title: 'Max Level', description: 'Reach Level 100.', xpReward: 10000, crateReward: 'Prestige Crate', icon: CrownIcon },
    { id: 'main-44', tier: 4, title: 'Coin Baron', description: 'Accumulate 1,000,000 Coins.', xpReward: 10000, icon: Gem },
    { id: 'main-45', tier: 4, title: 'Impossible Streak', description: 'Win 10 bets in a row.', xpReward: 5000, icon: ZapIcon },
    { id: 'main-46', tier: 4, title: 'The Collector', description: 'Unbox a Knife or pair of Gloves.', xpReward: 2500, icon: Gem },
    { id: 'main-47', tier: 4, title: 'Daily Legend', description: 'Complete 250 Daily Missions.', xpReward: 5000, icon: CheckCircle },
    { id: 'main-48', tier: 4, title: 'Legendary Collector', description: 'Own 5 different Legendary quality items.', xpReward: 7500, icon: Gem },
    { id: 'main-49', tier: 4, title: 'Weekly Champion', description: 'Finish in the Top 10 on the weekly leaderboard.', xpReward: 5000, icon: TrophyIcon },
    { id: 'main-50', tier: 4, title: 'The Next Chapter', description: 'Achieve Prestige 1.', xpReward: 15000, icon: CrownIcon },
    
    // Arcade-specific missions
    { id: 'arcade-1', tier: 1, title: 'Arcade Rookie', description: 'Play your first arcade game.', xpReward: 100, coinReward: 50, icon: Gamepad2 },
    { id: 'arcade-2', tier: 1, title: 'Crash Landing', description: 'Cash out successfully in Crash 3 times in a row.', xpReward: 200, coinReward: 100, icon: Rocket },
    { id: 'arcade-3', tier: 1, title: 'Flip Master', description: 'Win 5 Coinflip games.', xpReward: 150, coinReward: 75, icon: Coins },
    { id: 'arcade-4', tier: 2, title: 'Plinko Pro', description: 'Get a 10x multiplier or higher in Plinko.', xpReward: 300, coinReward: 150, icon: Puzzle },
    { id: 'arcade-5', tier: 2, title: 'Mine Expert', description: 'Clear 15 tiles in Sweeper without hitting a mine.', xpReward: 250, coinReward: 125, icon: Bomb },
    { id: 'arcade-6', tier: 2, title: 'High Stakes', description: 'Place a bet of 500 coins or more in any arcade game.', xpReward: 200, coinReward: 100, icon: Gem },
    { id: 'arcade-7', tier: 3, title: 'Arcade Veteran', description: 'Play 50 arcade games total.', xpReward: 500, coinReward: 250, icon: Gamepad2 },
    { id: 'arcade-8', tier: 3, title: 'Lucky Streak', description: 'Win 10 arcade games in a row.', xpReward: 750, coinReward: 375, icon: ZapIcon },
    { id: 'arcade-9', tier: 4, title: 'Arcade Legend', description: 'Play 500 arcade games total.', xpReward: 2000, coinReward: 1000, icon: CrownIcon },
    { id: 'arcade-10', tier: 4, title: 'Ultimate Gambler', description: 'Win 100,000 coins from arcade games.', xpReward: 5000, coinReward: 2500, icon: Gem },
];

export const allMissions = [...dailyMissions, ...mainMissions];

export const achievements = {
    "Betting": [
        { title: "Getting Started", description: "Place your first bet on any match and kick off your betting adventure!" },
        { title: "First Victory", description: "Win your first bet and celebrate with a triumphant start." },
        { title: "Regular Bettor", description: "Place a total of 50 bets and earn recognition as a regular player." },
        { title: "Consistent Winner", description: "Win 50 bets total and prove your prediction skills." },
        { title: "Heating Up", description: "Win 3 bets in a row and feel the momentum building!" },
        { title: "Against The Odds", description: "Win a bet on a team with odds of 3.0 or higher—defy the odds!" },
        { title: "Seasoned Veteran", description: "Place 500 bets total and claim your veteran status." },
        { title: "Master Predictor", description: "Win 250 bets and showcase your mastery of predictions." },
        { title: "High Roller", description: "Win a single bet with a payout over 10,000 coins—big wins await!" },
        { title: "On Fire!", description: "Win 7 bets in a row and ignite your winning streak." },
        { title: "Community Pillar", description: "Participate in 10 different community-created bet pools and support the community." },
        { title: "Legendary Seer", description: "Win 1,000 bets total and ascend as a legendary predictor." },
        { title: "All In", description: "Place a single bet of 50,000 coins or more—go big or go home!" },
        { title: "Unstoppable", description: "Win 15 bets in a row and become truly unstoppable." },
        { title: "EquipGG Fixture", description: "Place 2,500 bets total and cement your place in EquipGG history." },
    ],
    "Economic": [
        { title: "Pocket Money", description: "Accumulate a total of 10,000 coins and start building your fortune." },
        { title: "First Sale", description: "Sell an item back to the shop for your first profitable trade." },
        { title: "Unboxer", description: "Open your first crate and discover the thrill of unboxing." },
        { title: "Perkaholic", description: "Buy any perk from the shop and enhance your gameplay." },
        { title: "Well Off", description: "Accumulate a total of 100,000 coins and enjoy your wealth." },
        { title: "Contractor", description: "Complete your first Trade-Up Contract and unlock crafting rewards." },
        { title: "Collector", description: "Own 5 different \"Rare\" quality items at the same time—build your collection!" },
        { title: "Crate Connoisseur", description: "Open 50 crates and become a crate-opening expert." },
        { title: "Master Crafter", description: "Complete 10 Trade-Up Contracts and master the art of crafting." },
        { title: "Jackpot!", description: "Unbox a Legendary item from a crate and hit the jackpot!" },
        { title: "Millionaire", description: "Accumulate a total of 1,000,000 coins and join the millionaire’s club." },
        { title: "Flipper", description: "Sell 50 items back to the shop and perfect your trading skills." },
        { title: "The Duo", description: "Own a Knife and a pair of Gloves at the same time—style and power combined!" },
        { title: "Tycoon", description: "Accumulate a total of 10,000,000 coins and rise as a tycoon." },
    ],
    "Progression": [
        { title: "Getting Serious", description: "Reach Level 10 and show you’re committed to the grind." },
        { title: "Daily Grind", description: "Complete 10 Daily Missions and build your daily routine." },
        { title: "Quarter Century Club", description: "Reach Level 25 and join the elite quarter-century club!" },
        { title: "Mission Accomplished", description: "Complete 5 Main Missions and start your epic campaign." },
        { title: "Halfway There", description: "Reach Level 50 and celebrate being halfway to the top!" },
        { title: "Loyalist", description: "Log in 7 days in a row and prove your loyalty." },
        { title: "Elite", description: "Reach Level 75 and claim your elite status." },
        { title: "The Pinnacle", description: "Reach Level 100 and stand at the peak of progression." },
        { title: "Habitual", description: "Log in 30 days in a row and make it a habit!" },
        { title: "Completionist", description: "Complete all 50 Main Missions and become a true completionist." },
        { title: "A New Beginning", description: "Achieve Prestige 1 and start a new chapter of greatness." },
        { title: "Ascended", description: "Achieve Prestige 5 and ascend to the highest ranks!" },
    ],
    "Social & Community": [
        { title: "Voice in the Crowd", description: "Make your first post on the forums and join the conversation." },
        { title: "Interior Decorator", description: "Customize your profile showcase for the first time and add your flair." },
        { title: "Contributor", description: "Make 25 posts on the forums and become a valued contributor." },
        { title: "Socialite", description: "Successfully refer a friend who reaches Level 10 and grow the community." },
        { title: "Weekly Top 10", description: "Finish in the Top 10 on the weekly leaderboard and shine!" },
        { title: "Forum Veteran", description: "Make 100 posts on the forums and earn veteran status." },
        { title: "Historian", description: "Get 100 wins on a single StatTrak™ item and record your legacy." },
        { title: "Taste Tester", description: "Buy at least one of every type of perk from the shop—try them all!" },
        { title: "Fully Decorated", description: "Unlock and fill every slot in the Veteran profile showcase—total customization!" },
    ]
};

export const achievedItems = new Set([
    // Betting
    "Getting Started", "First Victory", "Regular Bettor", "Consistent Winner", "Heating Up",
    // Economic
    "Pocket Money", "First Sale", "Unboxer", "Perkaholic", "Well Off", "Contractor", "Collector",
    // Progression
    "Getting Serious", "Daily Grind", "Quarter Century Club", "Mission Accomplished", "Halfway There", "Loyalist", "Elite",
    // Social
    "Voice in the Crowd", "Interior Decorator", "Contributor"
]);

export const badges = {
    "Level & Prestige": [
        { title: "Service Medal - Level 1", description: "Awarded for reaching Level 1—your first step into the EquipGG.net elite!" },
        { title: "Service Medal - Level 10", description: "Celebrate hitting Level 10 with this shiny service medal." },
        { title: "Service Medal - Level 25", description: "A badge of honor for reaching the impressive Level 25 milestone." },
        { title: "Service Medal - Level 50", description: "Mark your journey at Level 50 with this distinguished medal." },
        { title: "Service Medal - Level 75", description: "A prestigious badge for conquering Level 75 with skill." },
        { title: "Service Medal - Level 100", description: "The ultimate service medal for mastering Level 100!" },
        { title: "Prestige I", description: "A coveted badge for achieving the first Prestige rank." },
        { title: "Prestige II", description: "Show off your second Prestige achievement with this elite badge." },
        { title: "Prestige III", description: "Earned for reaching Prestige 3, a true mark of excellence." },
        { title: "Prestige IV", description: "A rare badge for attaining Prestige 4, a testament to your dominance." },
        { title: "Prestige V", description: "The pinnacle of prestige—wear this badge with pride at Prestige 5." },
        { title: "XP Millionaire", description: "Awarded for earning a total of 1,000,000 XP, a millionaire of experience!" },
        { title: "XP Tycoon", description: "A badge for amassing 5,000,000 XP, showcasing your tycoon status." },
        { title: "XP Baron", description: "Celebrate 10,000,000 XP with this noble XP Baron badge." },
        { title: "Founder", description: "A special badge for registering during the launch month of EquipGG.net." },
        { title: "Year 1 Veteran", description: "Honoring those who joined in the first year of operation." },
        { title: "Daily Devotion", description: "Earned by completing 100 Daily Missions—dedication pays off!" },
        { title: "Campaigner", description: "Awarded for completing 25 Main Missions, a campaign well-fought." },
        { title: "Grand Campaigner", description: "The ultimate badge for conquering all 50 Main Missions." },
        { title: "Dedicated", description: "A badge for achieving an impressive 30-day login streak." },
    ],
    "Coin & Wealth": [
        { title: "High Earner", description: "Awarded for possessing 100,000 coins at once—start your wealth journey!" },
        { title: "Wealthy", description: "A badge for holding 500,000 coins, a sign of prosperity." },
        { title: "Coin Millionaire", description: "Celebrate owning 1,000,000 coins with this millionaire badge." },
        { title: "Coin Baron", description: "A prestigious badge for possessing 10,000,000 coins at once." },
        { title: "Big Spender", description: "Earned by spending a total of 100,000 coins in the shop." },
        { title: "Shop VIP", description: "A VIP badge for spending 1,000,000 coins in the shop." },
        { title: "Major Payout", description: "Awarded for winning over 10,000 coins from a single bet." },
        { title: "Jackpot Winner", description: "A dazzling badge for winning over 50,000 coins in one bet." },
        { title: "Richest of the Week", description: "Finish #1 on the weekly coins leaderboard and claim this title!" },
        { title: "Sale Hunter", description: "Earned by purchasing 5 items during a Flash Sale—bargain master!" },
        { title: "Perk Addict", description: "Awarded for buying 25 perks from the shop, a true perk enthusiast." },
        { title: "Fully Loaded", description: "A badge for owning at least one of every type of perk." },
    ],
    "Collection & Inventory": [
        { title: "Pointy End", description: "Earned by owning any Knife skin—sharp style unlocked!" },
        { title: "Hand-in-Glove", description: "A badge for owning any pair of Gloves, adding flair to your hands." },
        { title: "Legendary Arsenal", description: "Awarded for owning 5 different Legendary items at once." },
        { title: "Hoarder", description: "A proud badge for filling every slot in your inventory (min. 50 slots)." },
        { title: "Master of Contracts", description: "Earned by completing 50 Trade-Up Contracts, a crafting legend!" },
        { title: "StatTrak™ Master", description: "A badge for accumulating 1,000 wins on a single StatTrak™ item." },
        { title: "Gambler", description: "Awarded for opening 100 crates—risk and reward in style!" },
        { title: "Operator", description: "Earned by owning your first Operator skin, stepping into elite territory." },
    ],
    "Betting Skill": [
        { title: "Untouchable", description: "A badge for achieving a 10-win betting streak—unbeatable!" },
        { title: "Giant Slayer", description: "Earned by winning 10 bets on underdog teams (odds > 3.0)." },
        { title: "Prophet", description: "A prophetic badge for winning 1,000 total bets." },
        { title: "The Regular", description: "Awarded for placing 5,000 total bets, a true betting regular." },
        { title: "Predictor of the Week", description: "Finish #1 on the weekly win-rate leaderboard and claim this title!" },
    ],
    "Community & Event": [
        { title: "Referral Master", description: "Earned by successfully referring 10 friends who reach Level 10." },
        { title: "Community Voice", description: "A badge for casting 500 community votes on matches—your voice counts!" },
        { title: "Moderator", description: "A staff-assigned badge for community moderators, a mark of authority." },
        { title: "Summer Offensive 2025", description: "Participated in the Summer 2025 event—wear this seasonal badge with pride!" },
        { title: "Winter Major 2025", description: "A badge for joining the Winter 2025 event, celebrating a major milestone." },
    ]
};

export const ranks = {
    "Silver Tier": [
        { title: "Silver I", description: "Levels 1-2" },
        { title: "Silver II", description: "Levels 3-4" },
        { title: "Silver III", description: "Levels 5-6" },
        { title: "Silver IV", description: "Levels 7-8" },
        { title: "Silver V", description: "Levels 9-10" },
        { title: "Silver VI", description: "Levels 11-12" },
        { title: "Silver VII", description: "Levels 13-14" },
        { title: "Silver VIII", description: "Levels 15-16" },
        { title: "Silver IX", description: "Levels 17-18" },
        { title: "Silver Elite", description: "Levels 19-20" },
    ],
    "Gold Nova Tier": [
        { title: "Gold Nova I", description: "Levels 21-22" },
        { title: "Gold Nova II", description: "Levels 23-24" },
        { title: "Gold Nova III", description: "Levels 25-26" },
        { title: "Gold Nova IV", description: "Levels 27-28" },
        { title: "Gold Nova V", description: "Levels 29-30" },
        { title: "Gold Nova VI", description: "Levels 31-32" },
        { title: "Gold Nova VII", description: "Levels 33-34" },
        { title: "Gold Nova VIII", description: "Levels 35-36" },
        { title: "Gold Nova IX", description: "Levels 37-38" },
        { title: "Gold Nova Master", description: "Levels 39-40" },
    ],
    "Master Guardian Tier": [
        { title: "Master Guardian I", description: "Levels 41-42" },
        { title: "Master Guardian II", description: "Levels 43-44" },
        { title: "Master Guardian III", description: "Levels 45-46" },
        { title: "Master Guardian IV", description: "Levels 47-48" },
        { title: "Master Guardian V", description: "Levels 49-50" },
        { title: "Master Guardian Elite I", description: "Levels 51-52" },
        { title: "Master Guardian Elite II", description: "Levels 53-54" },
        { title: "Master Guardian Elite III", description: "Levels 55-56" },
        { title: "Distinguished Master Guardian", description: "Levels 57-58" },
        { title: "Prime Master Guardian", description: "Levels 59-60" },
    ],
    "Legendary Tier": [
        { title: "Legendary Eagle I", description: "Levels 61-62" },
        { title: "Legendary Eagle II", description: "Levels 63-64" },
        { title: "Legendary Eagle III", description: "Levels 65-66" },
        { title: "Legendary Eagle Master I", description: "Levels 67-68" },
        { title: "Legendary Eagle Master II", description: "Levels 69-70" },
        { title: "Supreme Master First Class", description: "Levels 71-72" },
        { title: "Supreme Master Second Class", description: "Levels 73-74" },
        { title: "Supreme Master Guardian", description: "Levels 75-76" },
        { title: "Legendary Guardian", description: "Levels 77-78" },
        { title: "Mythic Guardian", description: "Levels 79-80" },
    ],
    "Global Elite Tier": [
        { title: "Global Initiate", description: "Levels 81-82" },
        { title: "Global Sentinel", description: "Levels 83-84" },
        { title: "Global Paragon", description: "Levels 85-86" },
        { title: "Global Vanguard", description: "Levels 87-88" },
        { title: "Global Warlord", description: "Levels 89-90" },
        { title: "Global Overlord", description: "Levels 91-92" },
        { title: "Global Elite Guardian", description: "Levels 93-94" },
        { title: "Global Elite Master", description: "Levels 95-96" },
        { title: "Supreme Global Elite", description: "Levels 97-98" },
        { title: "The Global Elite", description: "Levels 99-100" },
    ]
};

// Function to get rank based on level
export function getRankByLevel(level: number): string {
    // Clamp level between 1 and 100
    const clampedLevel = Math.max(1, Math.min(100, level));
    
    // Get all ranks in a flat array
    const allRanks = Object.values(ranks).flat();
    
    // Find the rank for the given level
    for (const rank of allRanks) {
        const levelRange = rank.description.match(/Levels? (\d+)(?:-(\d+))?/);
        if (levelRange) {
            const minLevel = parseInt(levelRange[1]);
            const maxLevel = levelRange[2] ? parseInt(levelRange[2]) : minLevel;
            
            if (clampedLevel >= minLevel && clampedLevel <= maxLevel) {
                return rank.title;
            }
        }
    }
    
    // Fallback to Silver I if no match found
    return "Silver I";
}

export const referrals = [
  { id: 1, name: "FriendOne", date: "2024-05-20", status: "Completed" },
  { id: 2, name: "NewGuy22", date: "2024-05-22", status: "Pending" },
  { id: 3, name: "GamerPal", date: "2024-06-01", status: "Completed" },
];


export type Bet = {
    id: string;
    match: Match;
    team: Team;
    amount: number;
    potentialWinnings: number;
    status: 'Active' | 'Won' | 'Lost';
};
export const yourBetsData: Bet[] = [
    { id: 'bet1', match: upcomingMatchesData[0], team: upcomingMatchesData[0].team1, amount: 500, potentialWinnings: 925, status: 'Active' },
    { id: 'bet2', match: liveMatchesData[0], team: liveMatchesData[0].team2, amount: 1000, potentialWinnings: 2150, status: 'Active' },
    { id: 'bet3', match: finishedMatchesData[0], team: finishedMatchesData[0].team1, amount: 250, potentialWinnings: 562.5, status: 'Won' },
];

export type CrateData = {
  id: string;
  name: string;
  key: string;
  image: string;
  dataAiHint: string;
  description: string;
  rarityChances: string;
  xpReward?: number;
  coinReward?: number;
  contents?: InventoryItem[];
};

export const availableCrates: CrateData[] = [
  { 
    id: 'level-up', 
    name: 'Level Up Crate', 
    key: 'Level Up Key',
    image: 'https://picsum.photos/200/200?random=501', 
    dataAiHint: "standard box",
    description: 'A standard crate awarded every time you level up, packed with a random item to boost your collection.',
    rarityChances: '70% Common, 20% Uncommon, 7% Rare, 2.5% Epic, 0.5% Legendary.',
    xpReward: 50,
    coinReward: 100,
    contents: [
      { id: 'lvl1', name: 'Glock-18 | Sand Dune', image: generateImageUrl('Glock-18 | Sand Dune', 'Pistol'), rarity: 'Common', type: 'Pistol', dataAiHint: "brown pistol" },
      { id: 'lvl2', name: 'USP-S | Forest Leaves', image: generateImageUrl('USP-S | Forest Leaves', 'Pistol'), rarity: 'Common', type: 'Pistol', dataAiHint: "green pistol" },
      { id: 'lvl3', name: 'P250 | Sand Dune', image: generateImageUrl('P250 | Sand Dune', 'Pistol'), rarity: 'Common', type: 'Pistol', dataAiHint: "brown p250" },
      { id: 'lvl4', name: 'AK-47 | Redline', image: generateImageUrl('AK-47 | Redline', 'Rifle'), rarity: 'Rare', type: 'Rifle', dataAiHint: "red stripe rifle" },
      { id: 'lvl5', name: 'M4A4 | Howl', image: generateImageUrl('M4A4 | Howl', 'Rifle'), rarity: 'Legendary', type: 'Rifle', dataAiHint: "roaring beast rifle" }
    ]
  },
  { 
    id: 'loyalty', 
    name: 'Weekly Loyalty Crate', 
    key: 'Loyalty Key',
    image: 'https://picsum.photos/200/200?random=502', 
    dataAiHint: "special chest",
    description: 'A special crate earned after a 7-day login streak, offering a much higher chance for rare and exciting items.',
    rarityChances: '60% Uncommon, 25% Rare, 12% Epic, 3% Legendary (no Common drops).',
    xpReward: 100,
    coinReward: 250,
    contents: [
      { id: 'loy1', name: 'USP-S | Neo-Noir', image: generateImageUrl('USP-S | Neo-Noir', 'Pistol'), rarity: 'Rare', type: 'Pistol', dataAiHint: "comic book pistol" },
      { id: 'loy2', name: 'AK-47 | Redline', image: generateImageUrl('AK-47 | Redline', 'Rifle'), rarity: 'Rare', type: 'Rifle', dataAiHint: "red stripe rifle" },
      { id: 'loy3', name: 'M4A4 | Howl', image: generateImageUrl('M4A4 | Howl', 'Rifle'), rarity: 'Legendary', type: 'Rifle', dataAiHint: "roaring beast rifle" },
      { id: 'loy4', name: 'AWP | Dragon Lore', image: generateImageUrl('AWP | Dragon Lore', 'Rifle'), rarity: 'Legendary', type: 'Rifle', dataAiHint: "golden dragon sniper" }
    ]
  },
  { 
    id: 'prestige', 
    name: 'Prestige Crate', 
    key: 'Prestige Key',
    image: 'https://picsum.photos/200/200?random=503', 
    dataAiHint: "ornate box",
    description: 'An elite crate unlocked only upon achieving Prestige, guaranteeing a high-tier item to showcase your mastery.',
    rarityChances: '50% Rare, 40% Epic, 10% Legendary (no Common or Uncommon drops).',
    xpReward: 500,
    coinReward: 1000,
    contents: [
      { id: 'pre1', name: 'Karambit | Doppler', image: generateImageUrl('Karambit | Doppler', 'Knife'), rarity: 'Legendary', type: 'Knife', dataAiHint: "nebula curved knife" },
      { id: 'pre2', name: 'Butterfly Knife | Fade', image: generateImageUrl('Butterfly Knife | Fade', 'Knife'), rarity: 'Legendary', type: 'Knife', dataAiHint: "gradient balisong knife" },
      { id: 'pre3', name: 'Sport Gloves | Pandora\'s Box', image: generateImageUrl('Sport Gloves | Pandora\'s Box', 'Gloves'), rarity: 'Legendary', type: 'Gloves', dataAiHint: "purple black gloves" },
      { id: 'pre4', name: 'AWP | Dragon Lore', image: generateImageUrl('AWP | Dragon Lore', 'Rifle'), rarity: 'Legendary', type: 'Rifle', dataAiHint: "golden dragon sniper" }
    ]
  },
  { 
    id: 'special-occasion', 
    name: 'Special Occasion Crate', 
    key: 'Special Key',
    image: 'https://picsum.photos/200/200?random=504', 
    dataAiHint: "decorated crate",
    description: 'A special occasion crate filled with better-than-average items to elevate your arsenal.',
    rarityChances: '20% Common, 50% Uncommon, 20% Rare, 8% Epic, 2% Legendary.',
    xpReward: 75,
    coinReward: 150,
    contents: [
      { id: 'spc1', name: 'Glock-18 | Fade', image: generateImageUrl('Glock-18 | Fade', 'Pistol'), rarity: 'Epic', type: 'Pistol', dataAiHint: "rainbow pistol" },
      { id: 'spc2', name: 'USP-S | Neo-Noir', image: generateImageUrl('USP-S | Neo-Noir', 'Pistol'), rarity: 'Rare', type: 'Pistol', dataAiHint: "comic book pistol" },
      { id: 'spc3', name: 'Desert Eagle | Blaze', image: generateImageUrl('Desert Eagle | Blaze', 'Pistol'), rarity: 'Legendary', type: 'Pistol', dataAiHint: "flame decal pistol" },
      { id: 'spc4', name: 'AK-47 | Redline', image: generateImageUrl('AK-47 | Redline', 'Rifle'), rarity: 'Rare', type: 'Rifle', dataAiHint: "red stripe rifle" }
    ]
  },
  { 
    id: 'event-2025', 
    name: 'Event 2025 Crate', 
    key: 'Event Key',
    image: 'https://picsum.photos/200/200?random=505', 
    dataAiHint: "festive case",
    description: 'A limited-time crate available during the Summer 2025 event, featuring exclusive items to celebrate the season.',
    rarityChances: '50% Common, 25% Uncommon, 15% Rare, 8% Epic, 2% Legendary.',
    xpReward: 150,
    coinReward: 300,
    contents: [
      { id: 'evt1', name: 'Glock-18 | Sand Dune', image: generateImageUrl('Glock-18 | Sand Dune', 'Pistol'), rarity: 'Common', type: 'Pistol', dataAiHint: "brown pistol" },
      { id: 'evt2', name: 'USP-S | Forest Leaves', image: generateImageUrl('USP-S | Forest Leaves', 'Pistol'), rarity: 'Uncommon', type: 'Pistol', dataAiHint: "green pistol" },
      { id: 'evt3', name: 'AK-47 | Redline', image: generateImageUrl('AK-47 | Redline', 'Rifle'), rarity: 'Rare', type: 'Rifle', dataAiHint: "red stripe rifle" },
      { id: 'evt4', name: 'M4A4 | Howl', image: generateImageUrl('M4A4 | Howl', 'Rifle'), rarity: 'Epic', type: 'Rifle', dataAiHint: "roaring beast rifle" },
      { id: 'evt5', name: 'AWP | Dragon Lore', image: generateImageUrl('AWP | Dragon Lore', 'Rifle'), rarity: 'Legendary', type: 'Rifle', dataAiHint: "golden dragon sniper" }
    ]
  },
];


// SHOP DATA
export type ShopItem = {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  type: string;
  image: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  dataAiHint: string;
  price: number;
  stock: number;
}

const generateShopItems = (category: string, items: { name: string, rarity: Rarity, description: string }[]): ShopItem[] => {
    return items.map((item, index) => {
        const rarityPrices: Record<Rarity, number> = {
            'Common': 50,
            'Uncommon': 150,
            'Rare': 500,
            'Epic': 2000,
            'Legendary': 10000,
        };
        
        // Generate placeholder image URLs to avoid 404s
        const getImageUrl = (itemName: string, category: string): string => {
            const itemHash = itemName.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
            
            if (category.includes('Knife') || category.includes('Knives')) {
                return `https://picsum.photos/seed/knife${itemHash}/300/200`;
            } else if (category.includes('Gloves')) {
                return `https://picsum.photos/seed/gloves${itemHash}/300/200`;
            } else if (category.includes('Operator') || category.includes('Agent')) {
                return `https://picsum.photos/seed/agent${itemHash}/300/200`;
            } else {
                // For weapon skins (Pistol, Rifle, SMG, Heavy, etc.)
                return `https://picsum.photos/seed/weapon${itemHash}/300/200`;
            }
        };
        
        return {
            id: `${category.toLowerCase().replace(/\s/g, '-')}-${index}`,
            name: item.name,
            description: item.description,
            rarity: item.rarity,
            type: category,
            image: getImageUrl(item.name, category),
            dataAiHint: 'cs2 skin',
            price: rarityPrices[item.rarity] || 50,
            stock: Math.floor(Math.random() * 100),
        }
    })
};

const commonSkinsRaw = [
    { name: 'P250 | Sand Dune', rarity: 'Common', description: 'A sleek, sandy finish for your P250, perfect for a subtle yet stylish start.' },
    { name: 'Nova | Polar Mesh', rarity: 'Common', description: 'A cool, mesh-patterned Nova skin to add a frosty edge to your loadout.' },
    { name: 'MP7 | Army Recon', rarity: 'Common', description: 'A rugged, military-inspired MP7 skin for the tactical player.' },
    { name: 'G3SG1 | Jungle Dashed', rarity: 'Common', description: 'A jungle-themed G3SG1 with dashed patterns for a wild look.' },
    { name: 'P90 | Ash Wood', rarity: 'Common', description: 'An ash-wood textured P90, blending nature with firepower.' },
    { name: 'Tec-9 | Urban DDPAT', rarity: 'Common', description: 'An urban camouflage Tec-9, ideal for city skirmishes.' },
    { name: 'UMP-45 | Carbon Fiber', rarity: 'Common', description: 'A sleek carbon fiber UMP-45 for a modern, lightweight feel.' },
    { name: 'MAC-10 | Tarnish', rarity: 'Common', description: 'A weathered MAC-10 with a tarnished finish for a gritty vibe.' },
    { name: 'XM1014 | Blue Spruce', rarity: 'Common', description: 'A blue spruce XM1014, bringing a touch of forest elegance.' },
    { name: 'Sawed-Off | Forest DDPAT', rarity: 'Common', description: 'A forest camouflage Sawed-Off, perfect for woodland battles.' },
    { name: 'Five-SeveN | Coolant', rarity: 'Common', description: 'A coolant-coated Five-SeveN with a refreshing, icy design.' },
    { name: 'MP9 | Storm', rarity: 'Common', description: 'A stormy MP9 skin, charged with dynamic energy.' },
    { name: 'Glock-18 | High Beam', rarity: 'Common', description: 'A high-beam Glock-18, lighting up your arsenal with style.' },
    { name: 'SSG 08 | Abyss', rarity: 'Common', description: 'An abyssal SSG 08, diving into deep, mysterious tones.' },
    { name: 'Dual Berettas | Contractor', rarity: 'Common', description: 'A contractor-grade Dual Berettas for a no-nonsense look.' },
    { name: 'Galil AR | Stone Cold', rarity: 'Common', description: 'A stone-cold Galil AR, carved with a rugged, icy edge.' },
    { name: 'M249 | Predator', rarity: 'Common', description: 'A predatory M249, ready to dominate with a fierce design.' },
    { name: 'FAMAS | Colony', rarity: 'Common', description: 'A colonial FAMAS skin, blending history with firepower.' },
    { name: 'SG 553 | Anodized Navy', rarity: 'Common', description: 'A navy-anodized SG 553, offering a sleek maritime style.' },
    { name: 'USP-S | Forest Leaves', rarity: 'Common', description: 'A forest-leaves USP-S, bringing natural beauty to your shots.' },
];

const legendaryKnivesRaw = [
    { name: 'Karambit | Doppler', rarity: 'Legendary', description: 'A dazzling Karambit with a Doppler effect, a true collector’s gem.' },
    { name: 'Butterfly Knife | Fade', rarity: 'Legendary', description: 'A stunning Butterfly Knife with a fade finish, radiating luxury.' },
    { name: 'M9 Bayonet | Lore', rarity: 'Legendary', description: 'An M9 Bayonet etched with lore, a legendary piece of art.' },
    { name: 'Talon Knife | Slaughter', rarity: 'Legendary', description: 'A Talon Knife with a slaughter pattern, fierce and bold.' },
    { name: 'Skeleton Knife | Crimson Web', rarity: 'Legendary', description: 'A Skeleton Knife with crimson webs, dripping with elegance.' },
    { name: 'Huntsman Knife | Tiger Tooth', rarity: 'Legendary', description: 'A Huntsman Knife with tiger tooth markings, wild and powerful.' },
    { name: 'Bowie Knife | Case Hardened', description: 'A Case Hardened Bowie Knife, tough and timeless.', rarity: 'Legendary' },
    { name: 'Falchion Knife | Marble Fade', description: 'A Falchion Knife with a marble fade, blending beauty and strength.', rarity: 'Legendary' },
    { name: 'Shadow Daggers | Autotronic', description: 'Shadow Daggers with an autotronic finish, sleek and futuristic.', rarity: 'Legendary' },
    { name: 'Ursus Knife | Ultraviolet', description: 'An Ursus Knife in ultraviolet, glowing with rare intensity.', rarity: 'Legendary' },
];

const glovesRaw = [
    { name: 'Sport Gloves | Pandora’s Box', rarity: 'Legendary', description: 'Sport Gloves with a Pandora’s Box design, a mythical masterpiece.' },
    { name: 'Specialist Gloves | Emerald Web', rarity: 'Legendary', description: 'Specialist Gloves with an emerald web, exuding rare elegance.' },
    { name: 'Moto Gloves | Spearmint', rarity: 'Epic', description: 'Moto Gloves in spearmint, offering a fresh and bold look.' },
    { name: 'Hand Wraps | Cobalt Skulls', rarity: 'Epic', description: 'Hand Wraps with a cobalt skulls, a striking and powerful choice.' },
    { name: 'Driver Gloves | King Snake', rarity: 'Epic', description: 'Driver Gloves with a king snake pattern, regal and commanding.' },
    { name: 'Broken Fang Gloves | Jade', rarity: 'Epic', description: 'Broken Fang Gloves in jade, blending toughness with beauty.' },
    { name: 'Bloodhound Gloves | Charred', rarity: 'Rare', description: 'Bloodhound Gloves with a charred finish, rugged and intense.' },
    { name: 'Hydra Gloves | Case Hardened', rarity: 'Rare', description: 'Hydra Gloves with a case-hardened style, durable and unique.' },
    { name: 'Hand Wraps | Duct Tape', rarity: 'Uncommon', description: 'Hand Wraps with a duct tape look, practical yet stylish.' },
    { name: 'Moto Gloves | Transport', rarity: 'Uncommon', description: 'Moto Gloves in a transport design, ready for any journey.' },
];

const awpSkinsRaw = [
    { name: 'AWP | Dragon Lore', rarity: 'Legendary', description: 'The iconic AWP Dragon Lore, a legendary sniper’s dream.' },
    { name: 'AWP | Gungnir', rarity: 'Legendary', description: 'An AWP Gungnir, forged with mythical power.' },
    { name: 'AWP | Medusa', rarity: 'Legendary', description: 'An AWP Medusa, turning foes to stone with its beauty.' },
    { name: 'AWP | Containment Breach', rarity: 'Epic', description: 'An AWP Containment Breach, radiating hazardous allure.' },
    { name: 'AWP | Hyper Beast', rarity: 'Epic', description: 'An AWP Hyper Beast, wild and ferocious in design.' },
    { name: 'AWP | Asiimov', rarity: 'Epic', description: 'An AWP Asiimov, futuristic and eye-catching.' },
    { name: 'AWP | Neo-Noir', rarity: 'Epic', description: 'An AWP Neo-Noir, blending dark elegance with style.' },
    { name: 'AWP | Wildfire', rarity: 'Epic', description: 'An AWP Wildfire, blazing with intense energy.' },
    { name: 'AWP | Redline', rarity: 'Rare', description: 'An AWP Redline, striking with a bold red streak.' },
    { name: 'AWP | Corticera', rarity: 'Rare', description: 'An AWP Corticera, featuring a unique bark-like pattern.' },
    { name: 'AWP | Elite Build', rarity: 'Rare', description: 'An AWP Elite Build, built for precision and prestige.' },
    { name: 'AWP | Fever Dream', rarity: 'Rare', description: 'An AWP Fever Dream, surreal and captivating.' },
    { name: 'AWP | Phobos', rarity: 'Rare', description: 'An AWP Phobos, inspired by the Martian moon’s mystique.' },
    { name: 'AWP | Atheris', rarity: 'Uncommon', description: 'An AWP Atheris, sleek with a snake-inspired design.' },
    { name: 'AWP | PAW', rarity: 'Uncommon', description: 'An AWP PAW, playful yet powerful.' },
    { name: 'AWP | Exoskeleton', rarity: 'Uncommon', description: 'An AWP Exoskeleton, armored and tough.' },
    { name: 'AWP | Capillary', rarity: 'Uncommon', description: 'An AWP Capillary, delicate yet deadly.' },
    { name: 'AWP | Chromatic Aberration', rarity: 'Epic', description: 'An AWP Chromatic Aberration, with a mesmerizing color shift.' },
    { name: 'AWP | POP AWP', rarity: 'Uncommon', description: 'An AWP POP AWP, vibrant and pop-art inspired.' },
    { name: 'AWP | Worm God', rarity: 'Uncommon', description: 'An AWP Worm God, earthy and otherworldly.' },
];

const operatorSkinsRaw = [
    { name: 'Sir Bloody Darryl', rarity: 'Epic', description: 'The legendary Sir Bloody Darryl, a fierce operator icon.' },
    { name: 'Agent Ava | FBI', rarity: 'Epic', description: 'Agent Ava from the FBI, ready for elite missions.' },
    { name: 'Number K | Sabre', rarity: 'Epic', description: 'Number K of Sabre, a tactical powerhouse.' },
    { name: 'Slingshot | Phoenix', rarity: 'Rare', description: 'Slingshot from Phoenix, agile and bold.' },
    { name: 'Frogman | SEAL Team 6', rarity: 'Rare', description: 'Frogman of SEAL Team 6, stealthy and skilled.' },
    { name: 'Officer | SAS', rarity: 'Rare', description: 'An SAS Officer, commanding with authority.' },
    { name: 'Swoop Squad | FBI', rarity: 'Rare', description: 'Swoop Squad from the FBI, swift and precise.' },
    { name: 'Gendarmerie Nationale', rarity: 'Uncommon', description: 'A Gendarmerie Nationale operator, disciplined and strong.' },
    { name: 'The Doctor | Professionals', rarity: 'Epic', description: 'The Doctor from the Professionals, healing with style.' },
    { name: 'Elite Crew | Phoenix', rarity: 'Rare', description: 'Elite Crew from Phoenix, a top-tier team player.' },
];

const ak47SkinsRaw = [
    { name: 'AK-47 | Fire Serpent', rarity: 'Legendary', description: 'An AK-47 Fire Serpent, blazing with fiery glory.' },
    { name: 'AK-47 | Wild Lotus', rarity: 'Legendary', description: 'An AK-47 Wild Lotus, blooming with rare beauty.' },
    { name: 'AK-47 | X-Ray', rarity: 'Legendary', description: 'An AK-47 X-Ray, revealing its inner power.' },
    { name: 'AK-47 | The Empress', rarity: 'Epic', description: 'An AK-47 The Empress, regal and commanding.' },
    { name: 'AK-47 | Asiimov', rarity: 'Epic', description: 'An AK-47 Asiimov, futuristic and fierce.' },
    { name: 'AK-47 | Bloodsport', rarity: 'Epic', description: 'An AK-47 Bloodsport, dripping with intensity.' },
    { name: 'AK-47 | Neon Rider', rarity: 'Epic', description: 'An AK-47 Neon Rider, glowing with neon vibes.' },
    { name: 'AK-47 | Case Hardened', rarity: 'Epic', description: 'An AK-47 Case Hardened, tough and timeless.' },
    { name: 'AK-47 | Redline', rarity: 'Rare', description: 'An AK-47 Redline, bold and striking.' },
    { name: 'AK-47 | Point Disarray', rarity: 'Rare', description: 'An AK-47 Point Disarray, chaotic and cool.' },
    { name: 'AK-47 | Elite Build', rarity: 'Rare', description: 'An AK-47 Elite Build, precision-crafted.' },
    { name: 'AK-47 | Phantom Disruptor', rarity: 'Rare', description: 'An AK-47 Phantom Disruptor, ghostly and powerful.' },
    { name: 'AK-47 | Frontside Misty', rarity: 'Rare', description: 'An AK-47 Frontside Misty, misty and mysterious.' },
    { name: 'AK-47 | Slate', rarity: 'Uncommon', description: 'An AK-47 Slate, sleek with a stone-like finish.' },
    { name: 'AK-47 | Safari Mesh', rarity: 'Uncommon', description: 'An AK-47 Safari Mesh, wild and adventurous.' },
    { name: 'AK-47 | Blue Laminate', rarity: 'Uncommon', description: 'An AK-47 Blue Laminate, cool and layered.' },
    { name: 'AK-47 | Uncharted', rarity: 'Uncommon', description: 'An AK-47 Uncharted, exploring new territories.' },
    { name: 'AK-47 | Ice Coaled', rarity: 'Uncommon', description: 'An AK-47 Ice Coaled, frozen with style.' },
    { name: 'AK-47 | Legion of Anubis', rarity: 'Epic', description: 'An AK-47 Legion of Anubis, ancient and epic.' },
    { name: 'AK-47 | Head Shot', rarity: 'Rare', description: 'An AK-47 Head Shot, precision in every shot.' },
];

const m4SkinsRaw = [
    { name: 'M4A4 | Howl', rarity: 'Legendary', description: 'The legendary M4A4 Howl, a roaring masterpiece.' },
    { name: 'M4A1-S | Printstream', rarity: 'Legendary', description: 'An M4A1-S Printstream, flowing with digital art.' },
    { name: 'M4A4 | Poseidon', rarity: 'Legendary', description: 'An M4A4 Poseidon, ruling the waves with power.' },
    { name: 'M4A1-S | Welcome to the Jungle', rarity: 'Legendary', description: 'An M4A1-S Welcome to the Jungle, wild and vibrant.' },
    { name: 'M4A4 | The Emperor', rarity: 'Epic', description: 'An M4A4 The Emperor, commanding with royalty.' },
    { name: 'M4A1-S | Hyper Beast', rarity: 'Epic', description: 'An M4A1-S Hyper Beast, ferocious and bold.' },
    { name: 'M4A4 | Asiimov', rarity: 'Epic', description: 'An M4A4 Asiimov, futuristic and striking.' },
    { name: 'M4A1-S | Player Two', rarity: 'Epic', description: 'An M4A1-S Player Two, playful yet powerful.' },
    { name: 'M4A4 | Neo-Noir', rarity: 'Epic', description: 'An M4A4 Neo-Noir, dark and stylish.' },
    { name: 'M4A1-S | Cyrex', rarity: 'Rare', description: 'An M4A1-S Cyrex, sleek with a tech edge.' },
    { name: 'M4A4 | Dragon King', rarity: 'Rare', description: 'An M4A4 Dragon King, majestic and fierce.' },
    { name: 'M4A1-S | Mecha Industries', rarity: 'Rare', description: 'An M4A1-S Mecha Industries, robotic and cool.' },
    { name: 'M4A4 | Desolate Space', rarity: 'Rare', description: 'An M4A4 Desolate Space, vast and mysterious.' },
    { name: 'M4A1-S | Nightmare', rarity: 'Rare', description: 'An M4A1-S Nightmare, hauntingly beautiful.' },
    { name: 'M4A4 | Magnesium', rarity: 'Uncommon', description: 'An M4A4 Magnesium, light and durable.' },
    { name: 'M4A1-S | Leaded Glass', rarity: 'Uncommon', description: 'An M4A1-S Leaded Glass, elegant and translucent.' },
    { name: 'M4A4 | Converter', rarity: 'Uncommon', description: 'An M4A4 Converter, modern and efficient.' },
    { name: 'M4A1-S | Moss Quartz', rarity: 'Uncommon', description: 'An M4A1-S Moss Quartz, natural and refined.' },
    { name: 'M4A4 | Poly Mag', rarity: 'Uncommon', description: 'An M4A4 Poly Mag, colorful and versatile.' },
    { name: 'M4A1-S | Night Terror', rarity: 'Uncommon', description: 'An M4A1-S Night Terror, dark and thrilling.' },
];


export const shopItems: ShopItem[] = [
    ...generateShopItems('Common Skins', commonSkinsRaw as { name: string, rarity: Rarity, description: string }[]),
    ...generateShopItems('Legendary Knives', legendaryKnivesRaw as { name: string, rarity: Rarity, description: string }[]),
    ...generateShopItems('Epic to Legendary Gloves', glovesRaw as { name: string, rarity: Rarity, description: string }[]),
    ...generateShopItems('AWP Skins', awpSkinsRaw as { name: string, rarity: Rarity, description: string }[]),
    ...generateShopItems('Operator Skins', operatorSkinsRaw as { name: string, rarity: Rarity, description: string }[]),
    ...generateShopItems('AK-47 Skins', ak47SkinsRaw as { name: string, rarity: Rarity, description: string }[]),
    ...generateShopItems('M4A1 / M4A4 Skins', m4SkinsRaw as { name: string, rarity: Rarity, description: string }[]),
];

export const shopItemCategories = {
    'Common Skins': generateShopItems('Common Skins', commonSkinsRaw as { name: string, rarity: Rarity, description: string }[]),
    'Legendary Knives': generateShopItems('Legendary Knives', legendaryKnivesRaw as { name: string, rarity: Rarity, description: string }[]),
    'Epic to Legendary Gloves': generateShopItems('Epic to Legendary Gloves', glovesRaw as { name: string, rarity: Rarity, description: string }[]),
    'AWP Skins': generateShopItems('AWP Skins', awpSkinsRaw as { name: string, rarity: Rarity, description: string }[]),
    'Operator Skins': generateShopItems('Operator Skins', operatorSkinsRaw as { name: string, rarity: Rarity, description: string }[]),
    'AK-47 Skins': generateShopItems('AK-47 Skins', ak47SkinsRaw as { name: string, rarity: Rarity, description: string }[]),
    'M4A1 / M4A4 Skins': generateShopItems('M4A1 / M4A4 Skins', m4SkinsRaw as { name: string, rarity: Rarity, description: string }[]),
};

export const shopFeatureHighlights = [
  {
    icon: Palette,
    title: 'Diverse Collection',
    description: 'From common skins to legendary knives, there’s something for every player.',
  },
  {
    icon: Sparkles,
    title: 'Showcase Your Style',
    description: 'Equip these items to your profile and stand out in the community.',
  },
  {
    icon: Repeat,
    title: 'Crafting Potential',
    description: 'Combine items to create rarer versions, adding strategy to your journey.',
  },
  {
    icon: Diamond,
    title: 'High Value',
    description: 'Earn or trade for these virtual treasures to build your in-game empire.',
  },
]

// PERKS
const perksRarityMap: Record<string, Rarity> = {
  '2x XP Boost (3 Hours)': 'Rare',
  '1.5x XP Boost (24 Hours)': 'Uncommon',
  'Mission XP Doubler (24 Hours)': 'Rare',
  '+10% Coin Wins (24 Hours)': 'Uncommon',
  'White Nickname Glow (7 Days)': 'Uncommon',
  'Orange Nickname Glow (7 Days)': 'Rare',
  'Purple Nickname Glow (7 Days)': 'Epic',
  'Animated Profile Background (14 Days)': 'Epic',
  'Orange Chat Color (14 Days)': 'Rare',
  'Supporter Chat Badge (30 Days)': 'Epic',
  '+1 Inventory Slot': 'Uncommon',
  '+5 Inventory Slots': 'Rare',
  'Rarity Booster (1 Crate)': 'Epic',
  'Resell Boost (24 Hours)': 'Rare',
  'StatTrak™ Application Tool': 'Legendary',
  'Bet Insurance (24 Hours)': 'Rare',
  'Free Bet Token (500 Coins)': 'Uncommon',
  'Free Bet Token (2500 Coins)': 'Epic',
  'Odds Booster (x0.1)': 'Uncommon',
  'Odds Booster (x0.3)': 'Rare',
  'Bet Refund Token': 'Epic',
};

const perksPriceMap: Record<string, number> = {
  '2x XP Boost (3 Hours)': 750,
  '1.5x XP Boost (24 Hours)': 1000,
  'Mission XP Doubler (24 Hours)': 1200,
  '+10% Coin Wins (24 Hours)': 1500,
  'White Nickname Glow (7 Days)': 250,
  'Orange Nickname Glow (7 Days)': 500,
  'Purple Nickname Glow (7 Days)': 1000,
  'Animated Profile Background (14 Days)': 1500,
  'Orange Chat Color (14 Days)': 750,
  'Supporter Chat Badge (30 Days)': 2500,
  '+1 Inventory Slot': 500,
  '+5 Inventory Slots': 2000,
  'Rarity Booster (1 Crate)': 3000,
  'Resell Boost (24 Hours)': 1800,
  'StatTrak™ Application Tool': 10000,
  'Bet Insurance (24 Hours)': 1250,
  'Free Bet Token (500 Coins)': 400,
  'Free Bet Token (2500 Coins)': 2000,
  'Odds Booster (x0.1)': 300,
  'Odds Booster (x0.3)': 800,
  'Bet Refund Token': 1500,
}

const xpCoinBoostsRaw = [
    { name: '2x XP Boost (3 Hours)', description: 'Double all the XP you earn from betting and missions for an intense 3-hour power-up. Perfect for a quick climb up the ranks!', icon: ChevronsUp },
    { name: '1.5x XP Boost (24 Hours)', description: 'Enjoy a 50% boost to all XP earned over a full day, giving you a steady edge in your progression.', icon: ChevronsUp },
    { name: 'Mission XP Doubler (24 Hours)', description: 'Double the XP rewards from completing daily and main missions for one day—maximize your mission mastery!', icon: Star },
    { name: '+10% Coin Wins (24 Hours)', description: 'Boost your coin earnings by 10% on every successful bet for a full day, stacking your virtual wealth.', icon: Coins },
];
const cosmeticEffectsRaw = [
    { name: 'White Nickname Glow (7 Days)', description: 'Make your nickname shine with a sleek white glow across the site, turning heads in chat and forums.', icon: Brush },
    { name: 'Orange Nickname Glow (7 Days)', description: 'Stand out with the signature EquipGG orange glow, adding a bold touch to your online presence.', icon: Brush },
    { name: 'Purple Nickname Glow (7 Days)', description: 'Radiate style with a vibrant purple glow, perfect for showing off your unique flair.', icon: Brush },
    { name: 'Animated Profile Background (14 Days)', description: 'Transform your profile with a dynamic animated background, making your showcase page pop!', icon: Sparkles },
    { name: 'Orange Chat Color (14 Days)', description: 'Light up conversations with the EquipGG orange chat color, ensuring your messages stand out.', icon: Palette },
    { name: 'Supporter Chat Badge (30 Days)', description: 'Proudly display a special supporter badge next to your name in chat, a mark of your dedication.', icon: Badge },
];
const utilityPerksRaw = [
    { name: '+1 Inventory Slot', description: 'Permanently expand your inventory by one slot, giving you more room for skins and treasures.', icon: FolderPlus },
    { name: '+5 Inventory Slots', description: 'Get a major inventory boost with five permanent slots, perfect for serious collectors.', icon: FolderPlus },
    { name: 'Rarity Booster (1 Crate)', description: 'Significantly increase your chances of unboxing a Rare or higher item from your next crate.', icon: Diamond },
    { name: 'Resell Boost (24 Hours)', description: 'Increase the coin value you receive from selling items back to the shop by 10% for one day.', icon: Gauge },
    { name: 'StatTrak™ Application Tool', description: 'Apply a StatTrak™ counter to any eligible skin, turning it into a trophy that tracks your victories.', icon: Repeat2 },
];
const bettingPerksRaw = [
    { name: 'Bet Insurance (24 Hours)', description: 'For 24 hours, if you lose a bet, receive 50% of your stake back. Caps at 1,000 coins per bet.', icon: LifeBuoy },
    { name: 'Free Bet Token (500 Coins)', description: 'A one-time token that lets you place a bet up to 500 coins on the house. If you win, you keep the profits!', icon: Ticket },
    { name: 'Free Bet Token (2500 Coins)', description: 'A high-value, one-time token for placing a bet up to 2500 coins. Go big with no risk!', icon: Ticket },
    { name: 'Odds Booster (x0.1)', description: 'Increase the odds on a single bet by 0.1, giving your potential payout a small but strategic bump.', icon: PercentCircle },
    { name: 'Odds Booster (x0.3)', description: 'Give your potential payout a significant lift by boosting the odds on a single bet by 0.3.', icon: PercentCircle },
    { name: 'Bet Refund Token', description: 'A one-time use token that fully refunds a single lost bet, no questions asked. Caps at 5,000 coins.', icon: Repeat },
];

interface IconProps {
  className?: string;
  size?: string | number;
  [key: string]: any;
}

const generatePerks = (category: string, perks: { name: string, description: string, icon: React.ComponentType<IconProps> }[]): ShopItem[] => {
    return perks.map((perk, index) => ({
        id: `perk-${category.toLowerCase().replace(/\s/g, '-')}-${index}`,
        name: perk.name,
        description: perk.description,
        rarity: perksRarityMap[perk.name] || 'Common',
        type: category,
        image: '',
        icon: perk.icon,
        dataAiHint: 'perk icon',
        price: perksPriceMap[perk.name] || 100,
        stock: 999, // Perks are usually unlimited
    }));
};

export const shopPerks: ShopItem[] = [
    ...generatePerks('XP & Coin Boosts', xpCoinBoostsRaw),
    ...generatePerks('Cosmetic Effects', cosmeticEffectsRaw),
    ...generatePerks('Utility Perks', utilityPerksRaw),
    ...generatePerks('Betting Perks', bettingPerksRaw),
];

export const shopPerkCategories = {
    'XP & Coin Boosts': generatePerks('XP & Coin Boosts', xpCoinBoostsRaw),
    'Cosmetic Effects': generatePerks('Cosmetic Effects', cosmeticEffectsRaw),
    'Utility Perks': generatePerks('Utility Perks', utilityPerksRaw),
    'Betting Perks': generatePerks('Betting Perks', bettingPerksRaw),
};

export const shopPerkHighlights = [
  {
    icon: ChevronsUp,
    title: 'Accelerate Progression',
    description: 'Level up faster with XP boosts and earn more coins to expand your collection.',
  },
  {
    icon: Brush,
    title: 'Customize Your Look',
    description: 'Stand out with glowing nicknames, animated profiles, and unique chat colors.',
  },
  {
    icon: LifeBuoy,
    title: 'Enhance Your Strategy',
    description: 'Gain an edge with inventory expansions, betting insurance, and rarity boosters.',
  },
  {
    icon: BrainCircuit,
    title: 'Bet Smarter',
    description: 'Use free bet tokens and odds boosters to maximize your winnings with less risk.',
  },
]

export type BettingHistoryItem = {
    id: string;
    match: Match;
    team: Team;
    amount: number;
    potentialWinnings: number;
    status: 'Active' | 'Won' | 'Lost';
}

export const bettingHistoryData: BettingHistoryItem[] = [
    { id: '1', match: finishedMatchesData[0], team: finishedMatchesData[0].team1, amount: 100, potentialWinnings: 225, status: 'Won' },
    { id: '2', match: liveMatchesData[0], team: liveMatchesData[0].team2, amount: 250, potentialWinnings: 537.5, status: 'Active' },
    { id: '3', match: upcomingMatchesData[1], team: upcomingMatchesData[1].team1, amount: 50, potentialWinnings: 105, status: 'Active' },
    { id: '4', match: { id: 'm4', team1: { name: 'Vitality', logo: 'https://picsum.photos/48/48?random=70', dataAiHint: 'esports team'}, team2: { name: 'Heroic', logo: 'https://picsum.photos/48/48?random=71', dataAiHint: 'hero logo'}, odds1: 1.5, odds2: 2.5, startTime: 'Yesterday', status: 'Finished' }, team: { name: 'Heroic', logo: 'https://picsum.photos/48/48?random=71', dataAiHint: 'hero logo'}, amount: 200, potentialWinnings: 500, status: 'Lost' },
];

export type TradeUpHistoryItem = {
    id: string;
    date: string;
    usedItems: InventoryItem[];
    receivedItem: InventoryItem;
}

export const tradeUpHistoryData: TradeUpHistoryItem[] = [
    {
        id: '1',
        date: '2024-07-28',
        usedItems: inventoryData.slice(0, 5),
        receivedItem: inventoryData[5]
    },
     {
        id: '2',
        date: '2024-07-27',
        usedItems: inventoryData.slice(6, 11),
        receivedItem: inventoryData[11]
    }
];

export const forumCategories = [
    {
        id: 'general',
        title: 'General Discussion',
        description: 'Talk about anything and everything related to CS2 and the community.',
        icon: MessageSquare,
        topics: 125,
        posts: 1582
    },
    {
        id: 'support',
        title: 'Support & Help',
        description: 'Get help with any issues or questions about the platform.',
        icon: HelpCircle,
        topics: 42,
        posts: 210
    },
    {
        id: 'suggestions',
        title: 'Suggestions & Feedback',
        description: 'Have an idea to improve the site? Share it here!',
        icon: Lightbulb,
        topics: 78,
        posts: 640
    }
];

export const recentTopics = [
    {
        id: '1',
        title: 'What\'s the most underrated skin?',
        category: 'General Discussion',
        author: {
            id: xpLeaderboardData[0].id!,
            displayName: xpLeaderboardData[0].name,
            avatarUrl: xpLeaderboardData[0].avatar
        },
        replies: 15,
        rep: 28
    },
    {
        id: '2',
        title: 'Idea: New Arcade Game - Case Battles',
        category: 'Suggestions & Feedback',
        author: {
            id: xpLeaderboardData[1].id!,
            displayName: xpLeaderboardData[1].name,
            avatarUrl: xpLeaderboardData[1].avatar
        },
        replies: 8,
        rep: 45
    },
    {
        id: '3',
        title: 'Can\'t claim my mission reward',
        category: 'Support & Help',
        author: {
            id: xpLeaderboardData[2].id!,
            displayName: xpLeaderboardData[2].name,
            avatarUrl: xpLeaderboardData[2].avatar
        },
        replies: 2,
        rep: -3
    },
     {
        id: '4',
        title: 'Who is everyone betting on for the major?',
        category: 'General Discussion',
        author: {
            id: xpLeaderboardData[3].id!,
            displayName: xpLeaderboardData[3].name,
            avatarUrl: xpLeaderboardData[3].avatar
        },
        replies: 32,
        rep: 19
    }
];

export const forumTopics = [
    {
        id: 't1',
        title: 'What\'s the most underrated skin in the game right now?',
        author: xpLeaderboardData[0],
        replies: 15,
        views: 289,
        lastPost: {
            time: '2 hours ago',
            author: xpLeaderboardData[2]
        },
        tags: ['Skins', 'Discussion'],
        pinned: true
    },
    {
        id: 't2',
        title: 'Trade-Up Contract strategy guide for beginners',
        author: xpLeaderboardData[1],
        replies: 8,
        views: 150,
        lastPost: {
            time: '5 hours ago',
            author: xpLeaderboardData[4]
        },
        tags: ['Guide', 'Trade-Up'],
        pinned: false
    },
    {
        id: 't3',
        title: 'Feature Request: Add more Arcade games',
        author: xpLeaderboardData[3],
        replies: 25,
        views: 450,
        lastPost: {
            time: '1 day ago',
            author: xpLeaderboardData[0]
        },
        tags: ['Suggestion', 'Arcade'],
        pinned: false
    },
    {
        id: 't4',
        title: 'Show off your best loadout!',
        author: xpLeaderboardData[2],
        replies: 42,
        views: 890,
        lastPost: {
            time: '1 day ago',
            author: xpLeaderboardData[1]
        },
        tags: ['Loadout', 'Showcase'],
        pinned: false
    }
];

export type SupportTicket = {
    id: string;
    subject: string;
    status: 'Open' | 'Solved' | 'Closed';
    lastUpdated: string;
    category: 'Billing' | 'Technical' | 'General';
};

export const supportTickets: SupportTicket[] = [
    { id: 'TKT-001', subject: 'I can\'t log in to my account', status: 'Solved', lastUpdated: '2024-07-28', category: 'Technical' },
    { id: 'TKT-002', subject: 'My last bet winnings are missing', status: 'Open', lastUpdated: '2024-07-30', category: 'Billing' },
    { id: 'TKT-003', subject: 'Suggestion: Add a new arcade game', status: 'Closed', lastUpdated: '2024-07-25', category: 'General' },
    { id: 'TKT-004', subject: 'How do I use a Bet Refund Token?', status: 'Solved', lastUpdated: '2024-07-29', category: 'General' },
    { id: 'TKT-005', subject: 'Website is slow on mobile', status: 'Open', lastUpdated: '2024-07-31', category: 'Technical' },
];

