

import axios from 'axios';

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
