const http = require('http');

console.log('Testing coinflip POST API to debug 400 error...');

const postData = JSON.stringify({
    betAmount: 50,
    side: 'heads'
});

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/coinflip/lobbies',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Cookie': 'equipgg_session={"user_id":"8b07e938-1c15-4850-9216-68926bf1b41a","email":"admin@equipgg.net","role":"admin","displayName":"Admin User","avatarUrl":"/uploads/avatars/avatar_8b07e938-1c15-4850-9216-68926bf1b41a_1759004461350_ilcpyvm7sjb.png","level":1,"xp":1010,"provider":"email","steamVerified":true,"expires_at":1760301955243}',
        'User-Agent': 'test-script'
    },
    timeout: 10000
};

const req = http.request(options, (res) => {
    console.log('Status:', res.statusCode);
    console.log('Headers:', res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('Raw Response:', data);
        try {
            const parsed = JSON.parse(data);
            console.log('Parsed Response:', JSON.stringify(parsed, null, 2));
        } catch (error) {
            console.log('Failed to parse JSON:', error.message);
        }
    });
});

req.on('error', (error) => {
    console.log('Request error:', error.message);
});

req.on('timeout', () => {
    console.log('Request timed out');
    req.destroy();
});

console.log('Sending POST request with data:', postData);
req.write(postData);
req.end();