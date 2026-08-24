const { fetchWithTimeout } = require('../utils/fetchWithTimeout');

class WidgetService {
    // 1. Weather
    async getWeather(city) {
        try {
            const geoRes = await fetchWithTimeout(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
            if (!geoRes.ok) throw new Error('Geocoding service unavailable');
            const geoData = await geoRes.json();
            
            if (!geoData.results?.length) {
                return { error: `Location "${city}" could not be found. Please verify the city name.` };
            }
            const { latitude, longitude, name, country, admin1, timezone } = geoData.results[0];
            
            const params = new URLSearchParams({
                latitude,
                longitude,
                current_weather: true,
                temperature_unit: 'celsius',
                wind_speed_unit: 'kmh',
                timezone: 'auto'
            });
            const weatherRes = await fetchWithTimeout(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
            const weatherData = await weatherRes.json();
            
            const current = weatherData.current_weather || {};
            const resolvedTimezone = weatherData.timezone || timezone || 'auto';
            const tzAbbr = weatherData.timezone_abbreviation || '';

            return {
                type: 'weather',
                data: {
                    name,
                    country,
                    admin1: admin1 || '',
                    timezone: resolvedTimezone,
                    timezone_abbreviation: tzAbbr,
                    utc_offset_seconds: weatherData.utc_offset_seconds || 0,
                    current: {
                        temperature: current.temperature,
                        windspeed: current.windspeed,
                        winddirection: current.winddirection,
                        weathercode: current.weathercode,
                        time: current.time,
                        local_time: current.time,
                        timezone: resolvedTimezone,
                        timezone_abbreviation: tzAbbr
                    }
                }
            };
        } catch (err) {
            console.error('[Weather Error]:', err.message);
            return { error: "Unable to retrieve meteorological data. Please try again shortly." };
        }
    }

    // 2. Crypto
    async getCryptoPrice(coin) {
        const coinMap = { 'btc': 'bitcoin', 'eth': 'ethereum', 'doge': 'dogecoin', 'sol': 'solana', 'xrp': 'ripple', 'ada': 'cardano' };
        const cleanCoin = (coin || 'bitcoin').trim().toLowerCase();
        const coinId = coinMap[cleanCoin] || cleanCoin;
        
        try {
            // Attempt CoinGecko
            const res = await fetchWithTimeout(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
            const data = await res.json();
            
            if (data[coinId]?.usd !== undefined) {
                return {
                    type: 'crypto',
                    data: { coin: coinId, price: data[coinId].usd, source: 'CoinGecko' }
                };
            }
        } catch (e) {
            // Fallback to CoinCap
        }

        try {
            const res = await fetchWithTimeout(`https://api.coincap.io/v2/assets/${coinId}`);
            if (res.ok) {
                const data = await res.json();
                const price = parseFloat(data.data?.priceUsd);
                if (!isNaN(price)) {
                    return {
                        type: 'crypto',
                        data: { coin: data.data.name || coinId, price, source: 'CoinCap' }
                    };
                }
            }
        } catch (e) {}

        return { error: `Unable to resolve cryptocurrency price data for "${coin}".` };
    }

    // 3. Bible
    async getBibleVerse(reference) {
        if (!reference) {
            const randomVerses = ["John 3:16", "Jeremiah 29:11", "Romans 8:28", "Genesis 1:1", "Psalm 23:1", "Proverbs 3:5-6"];
            reference = randomVerses[Math.floor(Math.random() * randomVerses.length)];
        }
        
        try {
            const res = await fetchWithTimeout(`https://bible-api.com/${encodeURIComponent(reference)}?translation=kjv`);
            if (!res.ok) return { error: `Reference "${reference}" could not be located.` };
            const data = await res.json();
            
            if (data.error) return { error: `Bible reference not found: "${reference}".` };
            
            return {
                type: 'bible',
                data: { reference: data.reference, text: data.text, translation: data.translation_name || 'KJV', verses: data.verses }
            };
        } catch (err) {
            return { error: "Bible text retrieval service is currently unavailable." };
        }
    }

    // 4. Images (Free Multi-Provider: Wikimedia Commons, Wikipedia, Unsplash, Pixabay)
    async searchImages(query, limit = 8) {
        const cleanQuery = (query || 'science').trim();
        const targetLimit = Math.min(Math.max(parseInt(limit, 10) || 8, 2), 12);
        const API_KEYS = {
            unsplash: process.env.UNSPLASH_ACCESS_KEY || '',
            pixabay: process.env.PIXABAY_API_KEY || ''
        };
        const allImages = [];
        const seenUrls = new Set();

        const addImage = (img) => {
            if (!img || !img.src || seenUrls.has(img.src)) return false;
            seenUrls.add(img.src);
            allImages.push(img);
            return true;
        };

        // 1. Unsplash (if key provided)
        if (API_KEYS.unsplash) {
            try {
                const res = await fetchWithTimeout(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(cleanQuery)}&per_page=${targetLimit}&client_id=${API_KEYS.unsplash}`);
                const data = await res.json();
                if (data.results?.length) {
                    for (const photo of data.results) {
                        addImage({
                            src: photo.urls.regular,
                            thumb: photo.urls.small || photo.urls.regular,
                            link: photo.links.html,
                            title: photo.alt_description || cleanQuery,
                            author: photo.user?.name || 'Photographer',
                            provider: 'Unsplash',
                            width: photo.width || 800,
                            height: photo.height || 600,
                            color: photo.color || '#0a2e5c'
                        });
                        if (allImages.length >= targetLimit) break;
                    }
                }
            } catch (e) {}
        }

        // 2. Pixabay (if key provided)
        if (API_KEYS.pixabay && allImages.length < targetLimit) {
            try {
                const remaining = targetLimit - allImages.length;
                const res = await fetchWithTimeout(`https://api.pixabay.com/api/?key=${API_KEYS.pixabay}&q=${encodeURIComponent(cleanQuery)}&image_type=photo&per_page=${remaining}&safesearch=true`);
                const data = await res.json();
                if (data.hits?.length) {
                    for (const hit of data.hits) {
                        addImage({
                            src: hit.largeImageURL,
                            thumb: hit.webformatURL || hit.largeImageURL,
                            link: hit.pageURL,
                            title: hit.tags || cleanQuery,
                            author: hit.user || 'Contributor',
                            provider: 'Pixabay',
                            width: hit.imageWidth || 800,
                            height: hit.imageHeight || 600,
                            color: '#0a2e5c'
                        });
                        if (allImages.length >= targetLimit) break;
                    }
                }
            } catch (e) {}
        }

        // 3. Free Wikimedia Commons API (High-performance thumbnail generation via iiurlwidth=800)
        if (allImages.length < targetLimit) {
            try {
                const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(cleanQuery)}&gsrlimit=24&gsrnamespace=6&prop=imageinfo&iiprop=url|mime|extmetadata|size&iiurlwidth=800&format=json`;
                const res = await fetchWithTimeout(wikiUrl, {
                    headers: { 'User-Agent': 'AtlasReasoningStudio/1.0 (https://vylex.co.za; hello@vylex.co.za)' }
                });
                if (res.ok) {
                    const data = await res.json();
                    const pages = Object.values(data.query?.pages || {});
                    
                    const validExtRegex = /\.(jpe?g|png|webp|gif)$/i;
                    const invalidMimeRegex = /tiff|svg|pdf|djvu|ogg|video|audio/i;

                    for (const page of pages) {
                        const info = page.imageinfo?.[0];
                        if (!info || !info.url) continue;

                        const mime = (info.mime || '').toLowerCase();
                        if (mime && !mime.startsWith('image/')) continue;
                        if (mime && invalidMimeRegex.test(mime)) continue;

                        const cleanUrl = info.url.split('?')[0];
                        if (!validExtRegex.test(cleanUrl)) continue;

                        const rawTitle = (page.title || '').replace(/^File:/i, '').replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
                        const cleanTitle = rawTitle.replace(/\s+/g, ' ').trim();
                        const artist = info.extmetadata?.Artist?.value
                            ? info.extmetadata.Artist.value.replace(/<[^>]*>?/gm, '').trim()
                            : '';

                        const thumbUrl = info.thumburl || info.url;
                        const fullUrl = info.url;

                        addImage({
                            src: fullUrl,
                            thumb: thumbUrl,
                            link: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`,
                            title: cleanTitle || cleanQuery,
                            author: artist || 'Wikimedia Commons',
                            provider: 'Wikimedia',
                            width: info.width || 800,
                            height: info.height || 600,
                            color: '#0a2e5c'
                        });

                        if (allImages.length >= targetLimit) break;
                    }
                }
            } catch (e) {
                console.error('[Wikimedia Image Error]:', e.message);
            }
        }

        // 4. Free Wikipedia Page Images Search (Augment if still below target)
        if (allImages.length < targetLimit) {
            try {
                const wpUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(cleanQuery)}&gsrlimit=10&prop=pageimages|extracts&pithumbsize=800&piprop=thumbnail|original&format=json`;
                const res = await fetchWithTimeout(wpUrl);
                if (res.ok) {
                    const data = await res.json();
                    const pages = Object.values(data.query?.pages || {});
                    for (const page of pages) {
                        const thumb = page.thumbnail?.source;
                        const original = page.original?.source || thumb;
                        if (thumb) {
                            addImage({
                                src: original,
                                thumb: thumb,
                                link: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
                                title: page.title || cleanQuery,
                                author: 'Wikipedia',
                                provider: 'Wikipedia',
                                width: page.thumbnail?.width || 800,
                                height: page.thumbnail?.height || 600,
                                color: '#0a2e5c'
                            });
                            if (allImages.length >= targetLimit) break;
                        }
                    }
                }
            } catch (e) {}
        }

        // 5. Fallback Visual Generation if absolutely zero images found
        if (allImages.length === 0) {
            const visualUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanQuery)}?width=800&height=500&nologo=true`;
            addImage({
                src: visualUrl,
                thumb: visualUrl,
                link: visualUrl,
                title: `${cleanQuery} Visual Concept`,
                author: 'Scientific Visualizer',
                provider: 'Vylex Visual Core',
                width: 800,
                height: 500,
                color: '#0a2e5c'
            });
        }

        return {
            type: 'image',
            data: {
                query: cleanQuery,
                total: allImages.length,
                images: allImages
            }
        };
    }

    // 5. Space News
    async getSpaceNews(topic = '') {
        let apiUrl = `https://api.spaceflightnewsapi.net/v4/articles/?limit=5&ordering=-published_at`;
        if (topic) apiUrl += `&search=${encodeURIComponent(topic)}`;
        
        try {
            const res = await fetchWithTimeout(apiUrl);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            
            if (!data.results || !data.results.length) {
                return { error: "No recent aerospace news found for the requested topic." };
            }
            return { type: 'news', data: { topic, articles: data.results } };
        } catch (err) {
            return { error: "Failed to fetch live aerospace news data." };
        }
    }

    // 6. Reddit & Community Discussions
    async getRedditPosts(subreddit) {
        const rawSub = (subreddit || 'news').toString().trim();
        const cleanSub = rawSub.replace(/^\/?r\//i, '').replace(/^[#@]/, '').replace(/\/+$/, '').trim();
        const finalSub = cleanSub || 'news';
        const posts = [];
        let sourceName = 'Community Discussions';

        // Tier 1: Photon / Arctic Shift Reddit API (High Reliability & Real-Time)
        try {
            const photonRes = await fetchWithTimeout(`https://arctic-shift.photon-reddit.com/api/posts/search?subreddit=${encodeURIComponent(finalSub)}&limit=15`, {}, 4000);
            if (photonRes.ok) {
                const data = await photonRes.json();
                if (Array.isArray(data.data) && data.data.length > 0) {
                    for (const p of data.data) {
                        if (!p.title || p.title.startsWith('[ Removed') || p.title.startsWith('[ Deleted') || p.author === '[deleted]' || p.title.trim().length < 4) {
                            continue;
                        }
                        let imageUrl = null;
                        if (p.preview?.images?.[0]?.source?.url) {
                            imageUrl = p.preview.images[0].source.url.replace(/&amp;/g, '&');
                        } else if (p.thumbnail && p.thumbnail.startsWith('http')) {
                            imageUrl = p.thumbnail;
                        } else if (p.url && /\.(jpeg|jpg|png|webp|gif)(\?.*)?$/i.test(p.url)) {
                            imageUrl = p.url;
                        }

                        const permalink = p.permalink 
                            ? (p.permalink.startsWith('http') ? p.permalink : `https://www.reddit.com${p.permalink}`)
                            : (p.url || `https://www.reddit.com/r/${finalSub}`);

                        posts.push({
                            title: p.title,
                            url: permalink,
                            ups: p.score || p.ups || 0,
                            comments: p.num_comments || 0,
                            author: p.author ? `u/${p.author.replace(/^u\//, '')}` : 'u/reddit_user',
                            subreddit: p.subreddit_name_prefixed || `r/${finalSub}`,
                            source: 'Reddit',
                            created_at: p.created_utc ? new Date(p.created_utc * 1000).toLocaleDateString() : 'Recent',
                            image: imageUrl
                        });
                    }
                }
            }
        } catch (e) {}

        // Tier 2: Direct Reddit API with custom User-Agent
        if (posts.length === 0) {
            try {
                const redditRes = await fetchWithTimeout(`https://www.reddit.com/r/${encodeURIComponent(finalSub)}/hot.json?limit=10&raw_json=1`, {
                    headers: { 'User-Agent': 'web:atlasapp:v1.2.0 (by /u/atlas_agent)' }
                }, 3500);
                if (redditRes.ok) {
                    const data = await redditRes.json();
                    if (data.data?.children?.length) {
                        for (const child of data.data.children) {
                            const postData = child.data;
                            if (!postData.title || postData.title.startsWith('[ Removed') || postData.author === '[deleted]') continue;
                            let imageUrl = null;
                            if (postData.preview?.images?.[0]?.source?.url) {
                                imageUrl = postData.preview.images[0].source.url.replace(/&amp;/g, '&');
                            } else if (postData.thumbnail && postData.thumbnail.startsWith('http')) {
                                imageUrl = postData.thumbnail;
                            }
                            posts.push({
                                title: postData.title,
                                url: `https://www.reddit.com${postData.permalink}`,
                                ups: postData.ups || postData.score || 0,
                                comments: postData.num_comments || 0,
                                author: `u/${postData.author}`,
                                subreddit: postData.subreddit_name_prefixed || `r/${finalSub}`,
                                source: 'Reddit',
                                created_at: new Date(postData.created_utc * 1000).toLocaleDateString(),
                                image: imageUrl
                            });
                        }
                    }
                }
            } catch (e) {}
        }

        // Tier 3: Lemmy Federated Community Discussions Fallback
        if (posts.length === 0) {
            try {
                const lemmyRes = await fetchWithTimeout(`https://lemmy.world/api/v3/post/list?community_name=${encodeURIComponent(finalSub)}&limit=10`, {}, 3000);
                if (lemmyRes.ok) {
                    const lemmyData = await lemmyRes.json();
                    if (lemmyData.posts?.length) {
                        sourceName = 'Lemmy Discussions';
                        for (const item of lemmyData.posts) {
                            const post = item.post;
                            if (!post?.name) continue;
                            posts.push({
                                title: post.name,
                                url: post.ap_id || post.url || `https://lemmy.world/c/${finalSub}`,
                                ups: item.counts?.score || item.counts?.upvotes || 0,
                                comments: item.counts?.comments || 0,
                                author: item.creator?.name ? `u/${item.creator.name}` : 'community',
                                subreddit: `c/${item.community?.name || finalSub}`,
                                source: 'Lemmy',
                                created_at: post.published ? new Date(post.published).toLocaleDateString() : 'Recent',
                                image: post.thumbnail_url || null
                            });
                        }
                    }
                }
            } catch (e) {}
        }

        // Tier 4: Hacker News Discussions Fallback
        if (posts.length === 0) {
            try {
                const hnRes = await fetchWithTimeout(`https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(finalSub)}&tags=story&hitsPerPage=10`, {}, 3000);
                if (hnRes.ok) {
                    const hnData = await hnRes.json();
                    if (hnData.hits?.length) {
                        sourceName = 'Hacker News';
                        for (const item of hnData.hits) {
                            if (!item.title) continue;
                            posts.push({
                                title: item.title,
                                url: item.url || `https://news.ycombinator.com/item?id=${item.objectID}`,
                                ups: item.points || 0,
                                comments: item.num_comments || 0,
                                author: item.author || 'hn_user',
                                subreddit: 'Hacker News',
                                source: 'Hacker News',
                                created_at: item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent',
                                image: null
                            });
                        }
                    }
                }
            } catch (e) {}
        }

        if (posts.length > 0) {
            return {
                type: 'reddit',
                data: {
                    subreddit: `r/${finalSub}`,
                    posts: posts.slice(0, 5),
                    source: sourceName
                }
            };
        }

        return {
            type: 'reddit',
            data: {
                error: `Could not retrieve live discussions for "r/${finalSub}". Please verify the community name or try again shortly.`
            }
        };
    }

    // 7. Dictionary
    async defineWord(word) {
        try {
            const res = await fetchWithTimeout(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
            if (!res.ok) return { error: `No definition found for "${word}".` };
            const [entry] = await res.json();
            return { type: 'dictionary', data: { entry } };
        } catch (err) {
            return { error: "Lexical definition service is unavailable." };
        }
    }

    // 8. Currency
    async convertCurrency(amount, from, to) {
        try {
            from = (from || 'USD').toUpperCase();
            to = (to || 'EUR').toUpperCase();
            const numAmount = parseFloat(amount) || 1;
            const res = await fetchWithTimeout(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            const rate = data.rates?.[to];
            if (!rate) throw new Error();
            return { type: 'currency', data: { amount: numAmount, from, to, rate, converted: numAmount * rate, source: 'Frankfurter (ECB)' } };
        } catch (e) {
            try {
                const res2 = await fetchWithTimeout(`https://open.er-api.com/v6/latest/${from}`);
                if (!res2.ok) throw new Error();
                const data2 = await res2.json();
                const rate2 = data2.rates?.[to];
                if (!rate2) throw new Error();
                return { type: 'currency', data: { amount: parseFloat(amount) || 1, from, to, rate: rate2, converted: (parseFloat(amount) || 1) * rate2, source: 'ExchangeRate-API' } };
            } catch (e2) {
                return { error: `Unable to compute currency conversion for ${from} → ${to}.` };
            }
        }
    }

    // 9. Math Solver
    async solveMath(expression, operation = 'simplify') {
        const opMap = { 'derivative': 'derive', 'integral': 'integrate', 'factorize': 'factor', 'calculate': 'simplify', 'compute': 'simplify' };
        const apiOperation = opMap[operation] || operation;
        
        let cleanedExpr = (expression || '').replace(/\s*=\s*$/, '').replace(/×/g, '*').replace(/÷/g, '/');
        if (cleanedExpr.includes('=')) {
            const parts = cleanedExpr.split('=');
            if (parts.length === 2) {
                const lhs = parts[0].trim();
                const rhs = parts[1].trim();
                cleanedExpr = (rhs === '0') ? lhs : `(${lhs})-(${rhs})`;
                if (apiOperation === 'simplify') operation = 'solve';
            }
        }

        // 1. Try Newton API (vercel.app / now.sh)
        try {
            let res = await fetchWithTimeout(`https://newton.vercel.app/api/v2/${apiOperation}/${encodeURIComponent(cleanedExpr)}`, { signal: AbortSignal.timeout(4000) });
            if (!res.ok) {
                res = await fetchWithTimeout(`https://newton.now.sh/api/v2/${apiOperation}/${encodeURIComponent(cleanedExpr)}`, { signal: AbortSignal.timeout(3000) });
            }
            if (res.ok) {
                const data = await res.json();
                if (data && data.result !== undefined && !data.error) {
                    return { type: 'math', data: { operation: apiOperation, expression: data.expression || expression, result: String(data.result) } };
                }
            }
        } catch (err) {}

        // 2. Safe arithmetic-only evaluation fallback (no eval/Function)
        try {
            const sanitized = cleanedExpr.replace(/[^0-9+\-*/().^ eE]/g, '');
            if (sanitized && !/[a-zA-Z]/.test(sanitized)) {
                const val = this.safeEvaluateArithmetic(sanitized);
                if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
                    return {
                        type: 'math',
                        data: {
                            operation: apiOperation,
                            expression: expression,
                            result: String(Number.isInteger(val) ? val : val.toFixed(6).replace(/\.?0+$/, ''))
                        }
                    };
                }
            }
        } catch (e) {}

        return { error: `Could not analytically compute "${expression}".` };
    }

    // 10. Joke
    async tellJoke() {
        try {
            const res = await fetchWithTimeout('https://v2.jokeapi.dev/joke/Any?blacklistFlags=nsfw,religious,political,racist,sexist,explicit');
            if (!res.ok) throw new Error();
            const joke = await res.json();
            if (joke.error) throw new Error();
            return { type: 'joke', data: joke };
        } catch (err) {
            return {
                type: 'joke',
                data: {
                    type: 'twopart',
                    setup: 'Why do programmers prefer dark mode?',
                    delivery: 'Because light attracts bugs.'
                }
            };
        }
    }

    // 11. Advice
    async giveAdvice() {
        try {
            const res = await fetchWithTimeout(`https://api.adviceslip.com/advice?t=${Date.now()}`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            if (!data?.slip?.advice) throw new Error();
            return { type: 'advice', data: data.slip };
        } catch (err) {
            return {
                type: 'advice',
                data: {
                    advice: 'Simplicity is prerequisite for reliability.'
                }
            };
        }
    }

    /**
     * Safe stack-based arithmetic evaluator (no eval/Function)
     * Supports: +, -, *, /, ^, parentheses, unary minus
     * @param {string} expr - Sanitized arithmetic expression
     * @returns {number}
     */
    safeEvaluateArithmetic(expr) {
        const tokens = expr.replace(/\s+/g, '').match(/(\d+\.?\d*(?:[eE][+-]?\d+)?|[+\-*/^()])/g);
        if (!tokens) throw new Error('Invalid expression');
        let pos = 0;

        const peek = () => tokens[pos];
        const consume = () => tokens[pos++];

        const parseNumber = () => {
            if (peek() === '(') {
                consume(); // '('
                const val = parseAddSub();
                if (peek() === ')') consume();
                return val;
            }
            if (peek() === '-') {
                consume();
                return -parseNumber();
            }
            if (peek() === '+') {
                consume();
                return parseNumber();
            }
            return parseFloat(consume());
        };

        const parsePower = () => {
            let base = parseNumber();
            while (peek() === '^') {
                consume();
                base = Math.pow(base, parseNumber());
            }
            return base;
        };

        const parseMulDiv = () => {
            let left = parsePower();
            while (peek() === '*' || peek() === '/') {
                const op = consume();
                const right = parsePower();
                left = op === '*' ? left * right : left / right;
            }
            return left;
        };

        const parseAddSub = () => {
            let left = parseMulDiv();
            while (peek() === '+' || peek() === '-') {
                const op = consume();
                const right = parseMulDiv();
                left = op === '+' ? left + right : left - right;
            }
            return left;
        };

        return parseAddSub();
    }

    // 12. OCR
    async scanOcr() {
        return { type: 'ocr', data: { action: 'open_ocr_modal' } };
    }
}

module.exports = new WidgetService();
