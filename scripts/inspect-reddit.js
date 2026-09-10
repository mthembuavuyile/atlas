const widgetService = require('../src/services/widget.service.js');

async function inspect() {
    console.log('--- Testing searchReddit("funny") ---');
    const funny = await widgetService.searchReddit('funny', 5);
    for (const p of funny.data?.posts || []) {
        console.log({
            title: p.title?.slice(0, 40),
            url: p.url,
            image: p.image?.slice(0, 70),
            video: p.video?.slice(0, 70),
            is_gif: p.is_gif
        });
    }

    console.log('\n--- Testing searchReddit("fail video") ---');
    const failVideo = await widgetService.searchReddit('fail video', 5);
    for (const p of failVideo.data?.posts || []) {
        console.log({
            title: p.title?.slice(0, 40),
            url: p.url,
            image: p.image?.slice(0, 70),
            video: p.video?.slice(0, 70),
            is_gif: p.is_gif
        });
    }
}

inspect().catch(console.error);
