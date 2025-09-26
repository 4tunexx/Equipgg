// Clear Steam cookies script
const fs = require('fs');
const path = require('path');

console.log('🧹 Clearing Steam session cookies...');

// Clear cookies by setting them to expire
document.cookie = 'equipgg_steam_session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
document.cookie = 'equipgg_steam_email=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
document.cookie = 'equipgg_user_id=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
document.cookie = 'equipgg_user_email=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';

console.log('✅ Steam cookies cleared!');
console.log('Please refresh your browser and log in again.');