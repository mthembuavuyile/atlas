async function inspectRaw() {
    const res = await fetch('https://api.pullpush.io/reddit/search/submission/?q=funny&size=3');
    const data = await res.json();
    console.log('Pullpush result count:', data.data?.length);
    if (data.data && data.data[0]) {
        console.log('Keys of first post:', Object.keys(data.data[0]));
        console.log('Post 0 sample:', {
            url: data.data[0].url,
            is_video: data.data[0].is_video,
            media: data.data[0].media,
            preview: data.data[0].preview,
            thumbnail: data.data[0].thumbnail
        });
    }
    if (data.data && data.data[1]) {
        console.log('Post 1 sample:', {
            url: data.data[1].url,
            is_video: data.data[1].is_video,
            media: data.data[1].media,
            preview: data.data[1].preview,
            thumbnail: data.data[1].thumbnail
        });
    }
}

inspectRaw().catch(console.error);
