const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSteamAuth() {
  // Simulate Steam user data
  const steamUser = {
    steamId: '76561198001993310',
    username: '42une',
    avatar: 'https://avatars.steamstatic.com/ef51ab8508a2b715278ea19b6b82d6ebf33675ce_full.jpg',
    profileUrl: 'https://steamcommunity.com/profiles/76561198001993310'
  };
  
  const email = `${steamUser.steamId}@steam.local`;
  console.log('Looking for user with email:', email);
  
  // First check by Steam ID
  console.log('\n1. Looking up by Steam ID...');
  const { data: existingSteamUsers, error: steamLookupError } = await supabase
    .from('users')
    .select('id, email, steam_id')
    .eq('steam_id', steamUser.steamId)
    .limit(1);
    
  if (steamLookupError) {
    console.log('Steam lookup error:', steamLookupError);
  } else {
    console.log('Steam lookup result:', existingSteamUsers);
  }
  
  // Then check by email
  console.log('\n2. Looking up by email...');
  const { data: existingEmailUsers, error: emailLookupError } = await supabase
    .from('users')
    .select('id, email, steam_id, username, displayname')
    .eq('email', email)
    .limit(1);
    
  if (emailLookupError) {
    console.log('Email lookup error:', emailLookupError);
  } else {
    console.log('Email lookup result:', existingEmailUsers);
  }
  
  if (existingEmailUsers && existingEmailUsers.length > 0) {
    console.log('\n3. Found existing user by email, would update with Steam info...');
    const userId = existingEmailUsers[0].id;
    
    // Show what update would be performed
    const updateData = {
      steam_id: steamUser.steamId,
      steam_verified: true,
      username: steamUser.username, // Update username from displayname
      avatar_url: steamUser.avatar,
      account_status: 'active', // Use correct column name
      last_login_at: new Date().toISOString() // Use correct column name
    };
    
    console.log('Would update user with data:', updateData);
    
    // Actually perform the update to test it
    const { error: linkError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);
      
    if (linkError) {
      console.log('Link error:', linkError);
    } else {
      console.log('Successfully linked Steam to existing user:', userId);
      
      // Show the updated user
      const { data: updatedUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (fetchError) {
        console.log('Error fetching updated user:', fetchError);
      } else {
        console.log('\nUpdated user data:');
        console.log(JSON.stringify(updatedUser, null, 2));
      }
    }
  }
}

testSteamAuth().catch(console.error);