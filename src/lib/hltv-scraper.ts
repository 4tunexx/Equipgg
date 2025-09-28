

import axios from 'axios';
import { secureDb } from './secure-db';

export interface HLTVMatchOdds {
  matchId: string;
  odds: {
    [team: string]: number;
  };
  bookmaker: string;
}

export async function scrapeHLTVOdds(matchId: string): Promise<HLTVMatchOdds | null> {
  try {
    const url = `https://www.hltv.org/matches/${matchId}/_`;
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EquipggBot/1.0)'
      }
    });
    // Remove /s flag for compatibility, use [\s\S] instead of .
    const oddsRegex = /<div class="provider"[\s\S]*?<img[\s\S]*?alt="([^"]+)"[\s\S]*?<div class="odds">([\d.]+)<\/div>[\s\S]*?<div class="odds">([\d.]+)<\/div>/;
    const oddsMatch = oddsRegex.exec(html);
    if (!oddsMatch) return null;
    const bookmaker = oddsMatch[1];
    const team1Odds = parseFloat(oddsMatch[2]);
    const team2Odds = parseFloat(oddsMatch[3]);
    return {
      matchId,
      odds: {
        team1: team1Odds,
        team2: team2Odds
      },
      bookmaker
    };
  } catch (error) {
    console.error('Failed to scrape HLTV odds:', error);
    return null;
  }
}

// Sync odds from HLTV for all matches
export async function syncOddsFromHLTV(): Promise<void> {
  try {
    console.log('Syncing odds from HLTV...');

    // Get all matches
    const allMatches = await secureDb.findMany('matches');

    // Filter for matches that have a pandascore_id
    const matches = allMatches.filter(match => match.pandascore_id != null);

    if (matches.length === 0) {
      console.log('No matches found with pandascore_id');
      return;
    }

    console.log(`Found ${matches.length} matches to sync odds for`);

    let updatedCount = 0;

    for (const match of matches) {
      try {
        console.log(`Scraping odds for match ${match.pandascore_id} (${match.team_a_name} vs ${match.team_b_name})`);

        const oddsData = await scrapeHLTVOdds(match.pandascore_id.toString());

        if (oddsData && oddsData.odds.team1 && oddsData.odds.team2) {
          // Update the match with scraped odds
          await secureDb.update('matches', { id: match.id }, {
            team_a_odds: oddsData.odds.team1,
            team_b_odds: oddsData.odds.team2
          });

          console.log(`Updated odds for match ${match.pandascore_id}: ${oddsData.odds.team1} / ${oddsData.odds.team2} (${oddsData.bookmaker})`);
          updatedCount++;
        } else {
          console.log(`No odds found for match ${match.pandascore_id}`);
        }

        // Add a small delay to avoid overwhelming HLTV
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (matchError) {
        console.error(`Error processing match ${match.pandascore_id}:`, matchError);
        // Continue with other matches
      }
    }

    console.log(`Successfully updated odds for ${updatedCount} out of ${matches.length} matches`);

  } catch (error) {
    console.error('Failed to sync odds from HLTV:', error);
    throw error;
  }
}
