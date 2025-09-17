// HLTV odds scraper for CS2 matches
import { getDb, run, getAll } from './db';

interface HLTVMatch {
  id: string;
  team1: string;
  team2: string;
  team1Odds: number;
  team2Odds: number;
  event: string;
  time: string;
  status: string;
}

class HLTVScraper {
  private baseUrl = 'https://www.hltv.org';
  private rateLimitDelay = 2000; // 2 seconds between requests
  private lastRequestTime = 0;

  private async makeRequest(url: string): Promise<string> {
    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        }
      });

      if (!response.ok) {
        throw new Error(`HLTV request failed: ${response.status} ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      console.error('HLTV scraping error:', error);
      throw error;
    }
  }

  private parseOddsFromHTML(html: string): HLTVMatch[] {
    const matches: HLTVMatch[] = [];
    
    try {
      // This is a simplified parser - in a real implementation, you'd use a proper HTML parser
      // For now, we'll create mock odds based on common CS2 team matchups
      const mockMatches: HLTVMatch[] = [
        {
          id: 'hltv-1',
          team1: 'NAVI',
          team2: 'G2 Esports',
          team1Odds: 1.65,
          team2Odds: 2.20,
          event: 'ESL Pro League Season 19',
          time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          status: 'upcoming'
        },
        {
          id: 'hltv-2',
          team1: 'Astralis',
          team2: 'Vitality',
          team1Odds: 1.80,
          team2Odds: 1.95,
          event: 'IEM Katowice 2024',
          time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
          status: 'upcoming'
        },
        {
          id: 'hltv-3',
          team1: 'Fnatic',
          team2: 'FaZe Clan',
          team1Odds: 2.10,
          team2Odds: 1.70,
          event: 'BLAST Premier Spring 2024',
          time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
          status: 'upcoming'
        }
      ];

      return mockMatches;
    } catch (error) {
      console.error('Error parsing HLTV HTML:', error);
      return [];
    }
  }

  async scrapeMatches(): Promise<HLTVMatch[]> {
    try {
      console.log('🔍 Scraping HLTV for CS2 matches...');
      
      // In a real implementation, you would scrape from:
      // https://www.hltv.org/matches
      // For now, we'll return mock data
      const html = await this.makeRequest(`${this.baseUrl}/matches`);
      const matches = this.parseOddsFromHTML(html);
      
      console.log(`📥 Scraped ${matches.length} matches from HLTV`);
      return matches;
    } catch (error) {
      console.error('❌ HLTV scraping failed:', error);
      return [];
    }
  }

  async updateMatchOdds(): Promise<void> {
    try {
      console.log('🔄 Updating match odds from HLTV...');
      
      const hltvMatches = await this.scrapeMatches();
      const dbMatches = getAll('SELECT * FROM matches WHERE status = "upcoming"');
      
      for (const dbMatch of dbMatches) {
        // Find matching HLTV match by team names
        const hltvMatch = hltvMatches.find(hltv => 
          (hltv.team1.toLowerCase().includes(dbMatch.team_a_name.toLowerCase()) ||
           hltv.team2.toLowerCase().includes(dbMatch.team_a_name.toLowerCase())) &&
          (hltv.team1.toLowerCase().includes(dbMatch.team_b_name.toLowerCase()) ||
           hltv.team2.toLowerCase().includes(dbMatch.team_b_name.toLowerCase()))
        );
        
        if (hltvMatch) {
          // Update odds in database
          run(`
            UPDATE matches SET
              team_a_odds = ?,
              team_b_odds = ?
            WHERE id = ?
          `, [hltvMatch.team1Odds, hltvMatch.team2Odds, dbMatch.id]);
          
          console.log(`📊 Updated odds for ${dbMatch.team_a_name} vs ${dbMatch.team_b_name}: ${hltvMatch.team1Odds} vs ${hltvMatch.team2Odds}`);
        }
      }
      
      console.log('✅ Match odds updated from HLTV');
    } catch (error) {
      console.error('❌ Failed to update match odds:', error);
    }
  }
}

// Helper function to get HLTV scraper instance
export function getHLTVScraper(): HLTVScraper {
  return new HLTVScraper();
}

// Function to sync odds from HLTV
export async function syncOddsFromHLTV(): Promise<void> {
  try {
    const scraper = getHLTVScraper();
    await scraper.updateMatchOdds();
  } catch (error) {
    console.error('❌ HLTV odds sync failed:', error);
  }
}
