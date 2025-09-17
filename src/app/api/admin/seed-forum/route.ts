import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth-utils';
import { getDb, run } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session) {
      return createUnauthorizedResponse();
    }

    if (session.role !== 'admin') {
      return createForbiddenResponse('Only admins can seed forum');
    }

    console.log('💬 Seeding forum...');
    const db = await getDb();

    // Clear existing forum data
    await run('DELETE FROM forum_topics');
    await run('DELETE FROM forum_categories');
    console.log('✅ Cleared existing forum data');

    // Create forum categories
    const categories = [
      {
        id: 'cat-general',
        name: 'General Discussion',
        description: 'General chat about anything and everything',
        icon: '💬',
        display_order: 1
      },
      {
        id: 'cat-strategy',
        name: 'Game Strategy',
        description: 'Share your winning strategies and tips',
        icon: '🎯',
        display_order: 2
      },
      {
        id: 'cat-support',
        name: 'Technical Support',
        description: 'Get help with technical issues',
        icon: '🔧',
        display_order: 3
      },
      {
        id: 'cat-announcements',
        name: 'Announcements',
        description: 'Official announcements and updates',
        icon: '📢',
        display_order: 4
      },
      {
        id: 'cat-tournaments',
        name: 'Tournaments',
        description: 'Tournament discussions and updates',
        icon: '🏆',
        display_order: 5
      },
      {
        id: 'cat-feedback',
        name: 'Feedback & Suggestions',
        description: 'Share your feedback and suggestions',
        icon: '💡',
        display_order: 6
      }
    ];

    // Insert categories
    for (const category of categories) {
      await run(`
        INSERT INTO forum_categories (id, name, description, icon, display_order, topic_count, post_count)
        VALUES (?, ?, ?, ?, ?, 0, 0)
      `, [category.id, category.name, category.description, category.icon, category.display_order]);
    }

    // Create forum topics
    const topics = [
      {
        id: 'topic-welcome',
        title: 'Welcome to EquipGG.net! 🎉',
        content: `Welcome to the official EquipGG.net forum! This is your place to discuss everything related to CS2 betting, share strategies, and connect with other players.

## What you can do here:
- Share your betting strategies and tips
- Discuss upcoming matches and tournaments
- Get help with technical issues
- Provide feedback and suggestions
- Stay updated with official announcements

## Community Guidelines:
- Be respectful to other members
- Keep discussions relevant to CS2 and betting
- No spam or inappropriate content
- Help new players learn the ropes

Looking forward to seeing you around! 🚀`,
        category_id: 'cat-announcements',
        author_id: session.user_id, // Use admin user as author
        reply_count: 0,
        view_count: 0
      },
      {
        id: 'topic-betting-guide',
        title: 'Complete Betting Guide for Beginners 📚',
        content: `# Complete Betting Guide for Beginners

## Getting Started
1. **Understand the Basics**: Learn about odds, payouts, and different bet types
2. **Start Small**: Begin with small bets to learn the system
3. **Research Teams**: Study team performance, recent form, and head-to-head records
4. **Manage Your Bankroll**: Never bet more than you can afford to lose

## Betting Strategies
- **Value Betting**: Look for odds that are higher than the actual probability
- **Bankroll Management**: Use a percentage of your total balance for each bet
- **Research**: Check team stats, recent performance, and player changes
- **Avoid Emotional Betting**: Don't bet on your favorite team just because you like them

## Common Mistakes to Avoid
- Betting too much on a single match
- Chasing losses with bigger bets
- Not doing proper research
- Ignoring bankroll management

Good luck and bet responsibly! 🍀`,
        category_id: 'cat-strategy',
        author_id: session.user_id,
        reply_count: 0,
        view_count: 0
      },
      {
        id: 'topic-site-updates',
        title: 'Latest Site Updates & New Features 🆕',
        content: `# Latest Site Updates

## New Features Added:
- **Mission System**: Complete daily and main missions to earn rewards
- **Enhanced Betting**: Improved odds calculation and betting interface
- **Crate System**: Open crates to get amazing skins and items
- **XP System**: Level up by playing games and placing bets
- **Forum**: This new forum for community discussions

## Upcoming Features:
- **Tournament Brackets**: Visual tournament brackets and predictions
- **Live Chat**: Real-time chat during matches
- **Mobile App**: Native mobile application
- **Steam Integration**: Direct skin trading and inventory sync

## Bug Fixes:
- Fixed balance update issues after purchases
- Improved image loading performance
- Enhanced security measures
- Better error handling

Stay tuned for more updates! 🔄`,
        category_id: 'cat-announcements',
        author_id: session.user_id,
        reply_count: 0,
        view_count: 0
      },
      {
        id: 'topic-tournament-schedule',
        title: 'Upcoming Tournaments & Events 🏆',
        content: `# Upcoming Tournaments & Events

## This Week:
- **ESL Pro League Season 19**: Daily matches with top teams
- **IEM Katowice 2024**: Major tournament with huge prize pool
- **BLAST Premier Spring 2024**: High-stakes matches

## Next Week:
- **PGL Major Copenhagen 2024**: Major championship event
- **ESL Challenger League**: Rising teams competition

## How to Participate:
1. Check the betting page for available matches
2. Research teams and their recent performance
3. Place your bets before match start time
4. Watch live streams and track your bets
5. Collect your winnings!

## Tournament Prizes:
- **Major Tournaments**: Up to $1,000,000 prize pool
- **Pro League**: $750,000 prize pool
- **Challenger Events**: $100,000+ prize pool

Good luck with your predictions! 🎯`,
        category_id: 'cat-tournaments',
        author_id: session.user_id,
        reply_count: 0,
        view_count: 0
      },
      {
        id: 'topic-technical-help',
        title: 'Technical Support & FAQ ❓',
        content: `# Technical Support & FAQ

## Common Issues & Solutions:

### Login Problems:
- Clear your browser cache and cookies
- Try using a different browser
- Check if your account is properly registered

### Balance Issues:
- Refresh the page after transactions
- Check your transaction history
- Contact support if balance doesn't update

### Betting Issues:
- Ensure you have sufficient balance
- Check if the match is still open for betting
- Verify your bet amount and odds

### Performance Issues:
- Try refreshing the page
- Clear browser cache
- Disable browser extensions temporarily

## Contact Support:
- **Email**: support@equipgg.net
- **Discord**: Join our Discord server
- **Forum**: Post in the Technical Support category

## System Requirements:
- **Browser**: Chrome, Firefox, Safari, Edge (latest versions)
- **JavaScript**: Must be enabled
- **Cookies**: Must be enabled for login

We're here to help! 🛠️`,
        category_id: 'cat-support',
        author_id: session.user_id,
        reply_count: 0,
        view_count: 0
      },
      {
        id: 'topic-community-guidelines',
        title: 'Community Guidelines & Rules 📋',
        content: `# Community Guidelines & Rules

## General Rules:
1. **Be Respectful**: Treat all members with respect and kindness
2. **Stay On Topic**: Keep discussions relevant to CS2 and betting
3. **No Spam**: Avoid repetitive or irrelevant posts
4. **No Harassment**: Bullying, trolling, or harassment will not be tolerated
5. **No Cheating**: Discussion of cheating, exploits, or unfair play is prohibited

## Betting Rules:
- **Age Requirement**: Must be 18+ to participate in betting
- **Responsible Gambling**: Bet responsibly and within your means
- **No Match Fixing**: Discussion of match fixing is strictly prohibited
- **Fair Play**: All bets must be placed fairly and honestly

## Content Guidelines:
- **No NSFW Content**: Keep content appropriate for all ages
- **No Personal Information**: Don't share personal information publicly
- **No Advertising**: No unauthorized advertising or promotion
- **Original Content**: Don't copy content from other sources without permission

## Enforcement:
- **Warnings**: First offense may result in a warning
- **Temporary Ban**: Repeated violations may result in temporary suspension
- **Permanent Ban**: Severe violations may result in permanent ban

Let's keep this community awesome! 🌟`,
        category_id: 'cat-announcements',
        author_id: session.user_id,
        reply_count: 0,
        view_count: 0
      }
    ];

    // Insert topics
    for (const topic of topics) {
      await run(`
        INSERT INTO forum_topics (id, title, content, category_id, author_id, reply_count, view_count, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `, [topic.id, topic.title, topic.content, topic.category_id, topic.author_id, topic.reply_count, topic.view_count]);
    }

    // Update category counts
    for (const category of categories) {
      const topicCount = topics.filter(t => t.category_id === category.id).length;
      await run(
        'UPDATE forum_categories SET topic_count = ? WHERE id = ?',
        [topicCount, category.id]
      );
    }

    console.log(`✅ Seeded ${categories.length} categories and ${topics.length} topics`);
    
    // Persist changes
    await db.export();
    console.log('✅ Database changes persisted');

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${categories.length} categories and ${topics.length} topics`,
      categories: categories.length,
      topics: topics.length
    });

  } catch (error) {
    console.error('❌ Error seeding forum:', error);
    return NextResponse.json(
      { error: 'Failed to seed forum' },
      { status: 500 }
    );
  }
}

