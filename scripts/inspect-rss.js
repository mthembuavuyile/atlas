const https = require('https');

async function testFetch() {
    const url = 'https://www.reddit.com/search.rss?q=funny&limit=5';
    const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const xml = await res.text();
    console.log(xml.slice(0, 3000));
}

testFetch().catch(console.error);
