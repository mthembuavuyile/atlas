const widgetService = require('../src/services/widget.service.js');

async function verifyMedia() {
    console.log('=== Verifying getRedditPosts("pics", 3) ===');
    const pics = await widgetService.getRedditPosts('pics', 3);
    for (const p of pics.data?.posts || []) {
        console.log({
            title: p.title?.slice(0, 45),
            hasImage: !!p.image,
            image: p.image?.slice(0, 60),
            hasVideo: !!p.video,
            is_gif: p.is_gif
        });
    }

    console.log('\n=== Verifying getRedditPosts("memes", 3) ===');
    const memes = await widgetService.getRedditPosts('memes', 3);
    for (const p of memes.data?.posts || []) {
        console.log({
            title: p.title?.slice(0, 45),
            hasImage: !!p.image,
            image: p.image?.slice(0, 60),
            hasVideo: !!p.video,
            is_gif: p.is_gif
        });
    }

    console.log('\n=== Verifying searchReddit("cars", 3) ===');
    const search = await widgetService.searchReddit('cars', 3);
    for (const p of search.data?.posts || []) {
        console.log({
            title: p.title?.slice(0, 45),
            hasImage: !!p.image,
            image: p.image?.slice(0, 60),
            hasVideo: !!p.video,
            is_gif: p.is_gif
        });
    }
}

verifyMedia();
