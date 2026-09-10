async function testFallback() {
    const id = 'ykcktc4rumvd1';
    const urls = [
        `https://v.redd.it/${id}/DASH_720.mp4?source=fallback`,
        `https://v.redd.it/${id}/DASH_480.mp4?source=fallback`,
        `https://v.redd.it/${id}/DASH_360.mp4?source=fallback`,
        `https://v.redd.it/${id}/DASH_240.mp4?source=fallback`
    ];

    for (const u of urls) {
        try {
            const res = await fetch(u, {
                method: 'HEAD',
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            console.log(u, '-> status:', res.status, 'contentType:', res.headers.get('content-type'));
        } catch (err) {
            console.log(u, '-> err:', err.message);
        }
    }
}

testFallback().catch(console.error);
