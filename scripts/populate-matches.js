// Script to populate matches table with sample data
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sampleMatches = [
  {
    team_a_name: "Team Liquid",
    team_a_logo: "https://img-cdn.hltv.org/teamlogo/hn_hYpPQeYB1rbp85ZKbWKhJ.png",
    team_a_odds: 1.8,
    team_b_name: "Astralis",
    team_b_logo: "https://img-cdn.hltv.org/teamlogo/9bgdSeIL6CqWRwJz13gHXP.svg",
    team_b_odds: 2.2,
    event_name: "IEM Cologne 2025",
    map: "Mirage",
    match_date: "2025-10-05",
    start_time: "14:00:00",
    stream_url: "https://twitch.tv/esl_csgo",
    status: "upcoming",
    is_visible: true
  },
  {
    team_a_name: "NAVI",
    team_a_logo: "https://img-cdn.hltv.org/teamlogo/9bgdSeIL6CqWRwJz13gHXP.svg",
    team_a_odds: 1.5,
    team_b_name: "G2 Esports",
    team_b_logo: "https://img-cdn.hltv.org/teamlogo/hn_hYpPQeYB1rbp85ZKbWKhJ.png",
    team_b_odds: 2.8,
    event_name: "BLAST Premier",
    map: "Dust2",
    match_date: "2025-10-05",
    start_time: "16:30:00",
    stream_url: "https://twitch.tv/blast",
    status: "upcoming",
    is_visible: true
  },
  {
    team_a_name: "FaZe Clan",
    team_a_logo: "https://img-cdn.hltv.org/teamlogo/9bgdSeIL6CqWRwJz13gHXP.svg",
    team_a_odds: 2.1,
    team_b_name: "Vitality",
    team_b_logo: "https://img-cdn.hltv.org/teamlogo/hn_hYpPQeYB1rbp85ZKbWKhJ.png",
    team_b_odds: 1.9,
    event_name: "ESL Pro League",
    map: "Inferno",
    match_date: "2025-10-06",
    start_time: "13:00:00",
    stream_url: "https://twitch.tv/esl_csgo",
    status: "upcoming",
    is_visible: true
  },
  {
    team_a_name: "Cloud9",
    team_a_logo: "https://img-cdn.hltv.org/teamlogo/9bgdSeIL6CqWRwJz13gHXP.svg",
    team_a_odds: 3.2,
    team_b_name: "MOUZ",
    team_b_logo: "https://img-cdn.hltv.org/teamlogo/hn_hYpPQeYB1rbp85ZKbWKhJ.png",
    team_b_odds: 1.4,
    event_name: "PGL Major",
    map: "Cache",
    match_date: "2025-10-06",
    start_time: "18:00:00",
    stream_url: "https://twitch.tv/pgl",
    status: "upcoming",
    is_visible: true
  },
  {
    team_a_name: "Fnatic",
    team_a_logo: "https://img-cdn.hltv.org/teamlogo/9bgdSeIL6CqWRwJz13gHXP.svg",
    team_a_odds: 2.5,
    team_b_name: "NIP",
    team_b_logo: "https://img-cdn.hltv.org/teamlogo/hn_hYpPQeYB1rbp85ZKbWKhJ.png",
    team_b_odds: 1.6,
    event_name: "DreamHack Masters",
    map: "Overpass",
    match_date: "2025-10-07",
    start_time: "15:30:00",
    stream_url: "https://twitch.tv/dreamhackcs",
    status: "upcoming",
    is_visible: true
  },
  // Add a completed match
  {
    team_a_name: "ENCE",
    team_a_logo: "https://img-cdn.hltv.org/teamlogo/9bgdSeIL6CqWRwJz13gHXP.svg",
    team_a_odds: 1.7,
    team_b_name: "Spirit",
    team_b_logo: "https://img-cdn.hltv.org/teamlogo/hn_hYpPQeYB1rbp85ZKbWKhJ.png",
    team_b_odds: 2.3,
    event_name: "BLAST Premier",
    map: "Vertigo",
    match_date: "2025-10-03",
    start_time: "12:00:00",
    stream_url: "https://twitch.tv/blast",
    status: "completed",
    is_visible: true,
    winner: "team_a",
    team_a_score: 16,
    team_b_score: 12,
    completed_at: "2025-10-03T14:30:00Z"
  }
];

async function populateMatches() {
  try {
    console.log('🎮 Populating matches table with sample data...');
    
    const { data, error } = await supabase
      .from('matches')
      .insert(sampleMatches)
      .select();
    
    if (error) {
      console.error('❌ Error inserting matches:', error);
      process.exit(1);
    }
    
    console.log('✅ Successfully inserted', data.length, 'matches');
    console.log('Matches created:', data.map(m => `${m.team_a_name} vs ${m.team_b_name}`));
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

populateMatches();