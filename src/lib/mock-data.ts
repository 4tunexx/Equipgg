// Mock data for development and testing
export const achievements = [
  {
    id: 1,
    title: "First Win",
    description: "Win your first match",
    icon: "🏆",
    rarity: "common",
    xp_reward: 50,
    coin_reward: 10
  },
  {
    id: 2,
    title: "Winning Streak",
    description: "Win 5 matches in a row",
    icon: "🔥",
    rarity: "rare",
    xp_reward: 150,
    coin_reward: 25
  },
  {
    id: 3,
    title: "High Roller",
    description: "Spend 1000 coins in the shop",
    icon: "💰",
    rarity: "epic",
    xp_reward: 300,
    coin_reward: 50
  }
];

export const shopPerks = [
  {
    id: 1,
    name: "XP Booster",
    description: "Double XP for 24 hours",
    price: 500,
    duration: 86400, // 24 hours in seconds
    type: "booster"
  },
  {
    id: 2,
    name: "Coin Multiplier",
    description: "2x coin rewards for 24 hours",
    price: 750,
    duration: 86400,
    type: "booster"
  }
];

export const allMissions = [
  {
    id: 1,
    title: "Daily Login",
    description: "Log in for 7 consecutive days",
    type: "daily",
    tier: 1,
    xp_reward: 100,
    coin_reward: 20,
    target_value: 7,
    requirements: "Login daily"
  },
  {
    id: 2,
    title: "First Victory",
    description: "Win your first match",
    type: "main",
    tier: 1,
    xp_reward: 200,
    coin_reward: 50,
    target_value: 1,
    requirements: "Win 1 match"
  }
];

export const ranks = [
  {
    id: 1,
    name: "Bronze",
    min_xp: 0,
    max_xp: 100,
    tier: 1,
    image_url: "/ranks/bronze.png"
  },
  {
    id: 2,
    name: "Silver",
    min_xp: 100,
    max_xp: 300,
    tier: 2,
    image_url: "/ranks/silver.png"
  },
  {
    id: 3,
    name: "Gold",
    min_xp: 300,
    max_xp: 600,
    tier: 3,
    image_url: "/ranks/gold.png"
  },
  {
    id: 4,
    name: "Platinum",
    min_xp: 600,
    max_xp: 1000,
    tier: 4,
    image_url: "/ranks/platinum.png"
  },
  {
    id: 5,
    name: "Diamond",
    min_xp: 1000,
    max_xp: null,
    tier: 5,
    image_url: "/ranks/diamond.png"
  }
];

export const upcomingMatchesData = [
  {
    id: 1,
    team1: "Team Alpha",
    team2: "Team Beta",
    start_time: "2024-01-15T18:00:00Z",
    tournament: "Weekly Championship",
    odds: { team1: 1.8, team2: 2.1 }
  }
];

export const liveMatchesData = [
  {
    id: 2,
    team1: "Team Gamma",
    team2: "Team Delta",
    current_score: "12-8",
    time_remaining: "15:32",
    tournament: "Pro League",
    odds: { team1: 1.5, team2: 2.8 }
  }
];

export const finishedMatchesData = [
  {
    id: 3,
    team1: "Team Epsilon",
    team2: "Team Zeta",
    final_score: "16-12",
    winner: "Team Epsilon",
    tournament: "Monthly Cup",
    completed_at: "2024-01-14T20:30:00Z"
  }
];

export const shopItems = [
  {
    id: 1,
    name: "Mystery Box",
    description: "Contains random items",
    price: 100,
    category: "crates",
    rarity: "common",
    image_url: "/items/mystery-box.png"
  },
  {
    id: 2,
    name: "XP Potion",
    description: "Grants 500 XP instantly",
    price: 200,
    category: "consumables",
    rarity: "rare",
    image_url: "/items/xp-potion.png"
  }
];

export const xpLeaderboardData = [
  {
    rank: 1,
    username: "ProGamer123",
    xp: 15420,
    level: 15,
    avatar_url: "/avatars/user1.png"
  },
  {
    rank: 2,
    username: "SkillMaster",
    xp: 14850,
    level: 14,
    avatar_url: "/avatars/user2.png"
  },
  {
    rank: 3,
    username: "ChampionPlayer",
    xp: 14200,
    level: 14,
    avatar_url: "/avatars/user3.png"
  }
];

export const shopItemCategories = [
  { id: "crates", name: "Crates", icon: "📦" },
  { id: "consumables", name: "Consumables", icon: "🧪" },
  { id: "cosmetics", name: "Cosmetics", icon: "👕" },
  { id: "perks", name: "Perks", icon: "⚡" }
];

export enum Rarity {
  COMMON = "common",
  RARE = "rare",
  EPIC = "epic",
  LEGENDARY = "legendary"
}

export const availableCrates = [
  {
    id: 1,
    name: "Starter Crate",
    description: "Perfect for new players",
    price: 50,
    rarity: Rarity.COMMON,
    items: ["Common Skin", "XP Boost", "Coins"],
    image_url: "/crates/starter.png"
  },
  {
    id: 2,
    name: "Pro Crate",
    description: "For experienced players",
    price: 150,
    rarity: Rarity.RARE,
    items: ["Rare Skin", "XP Potion", "Coin Multiplier"],
    image_url: "/crates/pro.png"
  }
];

export const supportTickets = [
  {
    id: 1,
    title: "Payment Issue",
    description: "Unable to complete purchase",
    status: "open",
    priority: "high",
    created_at: "2024-01-14T10:30:00Z",
    user_id: "user123"
  },
  {
    id: 2,
    title: "Bug Report",
    description: "Game crashes on startup",
    status: "in_progress",
    priority: "medium",
    created_at: "2024-01-13T15:45:00Z",
    user_id: "user456"
  }
];

export const recentTopics = [
  {
    id: 1,
    title: "Tournament Discussion",
    author: "ModGamer",
    replies: 23,
    last_reply: "2024-01-14T12:00:00Z",
    category: "tournaments"
  },
  {
    id: 2,
    title: "New Update Feedback",
    author: "BetaTester",
    replies: 45,
    last_reply: "2024-01-14T11:30:00Z",
    category: "general"
  }
];