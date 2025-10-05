# Database Schema Analysis Report

## Complete Table Analysis from all2.txt

### User Management Tables:
- **users**: Main user table with id, email, displayname, role, xp, level, coins, gems, steam_id, etc.
- **sessions**: User authentication sessions (token, user_id)
- **user_settings**: User preferences (notifications, sound, theme, language)
- **user_moderation**: User moderation actions
- **user_stats**: User statistics (bets, winnings, win_percentage, etc.)

### Gaming & Betting Tables:
- **matches**: CS:GO match data (team_a_name, team_b_name, odds, status, etc.)
- **match_votes**: User predictions on matches
- **match_vote_stats**: Vote statistics per match
- **user_bets**: User betting history
- **bets**: Legacy betting table
- **game_history**: Game play history
- **game_sessions**: Game session data
- **game_results**: Provably fair game results

### Inventory & Items:
- **items**: All game items (name, category, rarity, prices, etc.)
- **inventory_items**: User inventory (user_id, item_id, quantity)
- **user_inventory**: Alternative inventory table
- **shop_items**: Shop item listings
- **user_transactions**: Transaction history

### Crates & Rewards:
- **crates**: Crate definitions
- **crate_items**: Items in crates with drop chances
- **crate_openings**: Crate opening history
- **user_crates**: User's crate inventory
- **user_keys**: Crate keys

### Missions & Achievements:
- **missions**: Mission definitions
- **user_missions**: User mission progress
- **user_mission_progress**: Alternative mission progress table
- **achievements**: Achievement definitions
- **user_achievements**: User unlocked achievements
- **badges**: Badge definitions
- **user_badges**: User earned badges

### Economy:
- **gem_packages**: Purchasable gem packages
- **gem_transactions**: Gem transaction history
- **gem_settings**: Gem system configuration
- **exchange_rates**: Currency exchange rates
- **payment_intents**: Payment processing
- **payment_settings**: Payment configuration
- **flash_sales**: Time-limited sales
- **perks**: Purchasable perks
- **user_perks**: User's active perks
- **user_perk_claims**: Perk claim history

### Social Features:
- **chat_messages**: In-game chat
- **forum_categories**: Forum structure
- **forum_topics**: Forum topics
- **forum_posts**: Forum posts
- **forum_post_reactions**: Post reactions
- **activity_feed**: User activity feed
- **notifications**: User notifications

### Trading:
- **trade_offers**: P2P trading
- **trade_up_contracts**: Item trade-up system
- **steam_trade_offers**: Steam integration
- **cs2_skins**: CS2 skin marketplace
- **cs2_skin_deliveries**: Skin delivery tracking

### Admin & Support:
- **support_tickets**: Support system
- **admin_logs**: Admin action logs
- **site_settings**: Site configuration
- **landing_panels**: Homepage panels
- **ranks**: User rank system
- **user_rewards**: Reward system
- **user_reward_claims**: Reward claims

### Provably Fair:
- **server_seeds**: Server-side randomness
- **client_seeds**: Client-side randomness
- **coinflip_lobbies**: Coinflip game lobbies

### Polls:
- **polls**: Site polls
- **poll_options**: Poll choices
- **poll_votes**: User votes

Now I'll scan the website to verify alignment...