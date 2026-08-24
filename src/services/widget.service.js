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
    async searchImages(query) {
        const cleanQuery = (query || 'science').trim();
        const API_KEYS = {
            unsplash: process.env.UNSPLASH_ACCESS_KEY || '',
            pixabay: process.env.PIXABAY_API_KEY || ''
        };
        const allImages = [];

        // 1. Unsplash (if key provided)
        if (API_KEYS.unsplash) {
            try {
                const res = await fetchWithTimeout(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(cleanQuery)}&per_page=4&client_id=${API_KEYS.unsplash}`);
                const data = await res.json();
                if (data.results?.length) {
                    data.results.forEach(photo => allImages.push({
                        src: photo.urls.regular,
                        thumb: photo.urls.small || photo.urls.regular,
                        link: photo.links.html,
                        title: photo.alt_description || cleanQuery,
                        author: photo.user?.name || 'Photographer',
                        provider: 'Unsplash',
                        color: photo.color || '#0a2e5c'
                    }));
                }
            } catch (e) {}
        }

        // 2. Pixabay (if key provided)
        if (API_KEYS.pixabay && allImages.length < 4) {
            try {
                const res = await fetchWithTimeout(`https://api.pixabay.com/api/?key=${API_KEYS.pixabay}&q=${encodeURIComponent(cleanQuery)}&image_type=photo&per_page=4&safesearch=true`);
                const data = await res.json();
                if (data.hits?.length) {
                    data.hits.forEach(hit => allImages.push({
                        src: hit.largeImageURL,
                        thumb: hit.webformatURL || hit.largeImageURL,
                        link: hit.pageURL,
                        title: hit.tags || cleanQuery,
                        author: hit.user || 'Contributor',
                        provider: 'Pixabay',
                        color: '#0a2e5c'
                    }));
                }
            } catch (e) {}
        }

        // 3. Free Wikimedia Commons API (Zero API key required, high-resolution scientific/encyclopedic images)
        if (allImages.length < 4) {
            try {
                const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(cleanQuery)}&gsrlimit=6&gsrnamespace=6&prop=imageinfo&iiprop=url|mime|extmetadata&format=json`;
                const res = await fetchWithTimeout(wikiUrl);
                if (res.ok) {
                    const data = await res.json();
                    const pages = Object.values(data.query?.pages || {});
                    for (const page of pages) {
                        const info = page.imageinfo?.[0];
                        if (info?.url && !info.url.endsWith('.svg') && !info.url.endsWith('.tif')) {
                            const cleanTitle = (page.title || '').replace(/^File:/i, '').replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
                            allImages.push({
                                src: info.url,
                                thumb: info.url,
                                link: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`,
                                title: cleanTitle || cleanQuery,
                                author: info.extmetadata?.Artist?.value ? info.extmetadata.Artist.value.replace(/<[^>]*>?/gm, '') : 'Wikimedia Commons',
                                provider: 'Wikimedia',
                                color: '#0a2e5c'
                            });
                            if (allImages.length >= 4) break;
                        }
                    }
                }
            } catch (e) {}
        }

        // 4. Free Wikipedia Page Lead Image API
        if (allImages.length === 0) {
            try {
                const wpUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(cleanQuery)}&prop=pageimages|extracts&pithumbsize=600&format=json`;
                const res = await fetchWithTimeout(wpUrl);
                if (res.ok) {
                    const data = await res.json();
                    const pages = Object.values(data.query?.pages || {});
                    for (const page of pages) {
                        if (page.thumbnail?.source) {
                            allImages.push({
                                src: page.thumbnail.source,
                                thumb: page.thumbnail.source,
                                link: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
                                title: page.title,
                                author: 'Wikipedia',
                                provider: 'Wikipedia',
                                color: '#0a2e5c'
                            });
                        }
                    }
                }
            } catch (e) {}
        }

        // 5. Fallback visual generation prompt
        if (allImages.length === 0) {
            const visualUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanQuery)}?width=600&height=400&nologo=true`;
            allImages.push({
                src: visualUrl,
                thumb: visualUrl,
                link: visualUrl,
                title: `${cleanQuery} Visual Model`,
                author: 'Scientific Visualizer',
                provider: 'Vylex Visual Core',
                color: '#0a2e5c'
            });
        }

        return { type: 'image', data: { query: cleanQuery, images: allImages } };
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
        const cleanSub = (subreddit || 'technology').replace(/^r\//i, '').trim();
        const posts = [];

        // 1. HackerNews Algolia Discussion API
        try {
            const hnUrl = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(cleanSub)}&tags=story&hitsPerPage=5`;
            const res = await fetchWithTimeout(hnUrl);
            if (res.ok) {
                const data = await res.json();
                if (data.hits?.length) {
                    data.hits.slice(0, 5).forEach(h => {
                        posts.push({
                            title: h.title || 'Discussion Topic',
                            url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
                            ups: h.points || 0,
                            comments: h.num_comments || 0,
                            author: h.author || 'contributor',
                            subreddit: `r/${cleanSub}`,
                            source: 'Community Forum',
                            created_at: h.created_at ? new Date(h.created_at).toLocaleDateString() : 'Recent'
                        });
                    });
                }
            }
        } catch (e) {}

        // 2. Dev.to Community API (if additional posts needed)
        if (posts.length < 3) {
            try {
                const devRes = await fetchWithTimeout(`https://dev.to/api/articles?tag=${encodeURIComponent(cleanSub)}&per_page=4`);
                if (devRes.ok) {
                    const devData = await devRes.json();
                    if (Array.isArray(devData)) {
                        devData.forEach(art => {
                            posts.push({
                                title: art.title,
                                url: art.url,
                                ups: art.public_reactions_count || art.positive_reactions_count || 0,
                                comments: art.comments_count || 0,
                                author: art.user?.name || 'Developer',
                                subreddit: `r/${cleanSub}`,
                                source: 'Dev Community',
                                created_at: art.readable_publish_date || 'Recent'
                            });
                        });
                    }
                }
            } catch (e) {}
        }

        if (posts.length > 0) {
            return { type: 'reddit', data: { subreddit: `r/${cleanSub}`, posts: posts.slice(0, 5), source: 'Community Discussions' } };
        }

        return { error: `Could not retrieve live discussions for "r/${cleanSub}".` };
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

        // 1. Try Newton API
        try {
            const res = await fetchWithTimeout(`https://newton.now.sh/api/v2/${apiOperation}/${encodeURIComponent(cleanedExpr)}`, { signal: AbortSignal.timeout(4000) });
            if (res.ok) {
                const data = await res.json();
                if (data && data.result !== undefined && !data.error) {
                    return { type: 'math', data: { operation: apiOperation, expression: data.expression || expression, result: String(data.result) } };
                }
            }
        } catch (err) {}

        // 2. Safe local mathematical evaluation fallback
        try {
            const sanitized = cleanedExpr.replace(/[^0-9+\-*/().^ eE]/g, '');
            if (sanitized && !/[a-zA-Z]/.test(sanitized)) {
                const safeEvalExpr = sanitized.replace(/\^/g, '**');
                // evaluate arithmetic only
                const fn = new Function(`return (${safeEvalExpr})`);
                const val = fn();
                if (typeof val === 'number' && !isNaN(val)) {
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

    // 12. OCR
    async scanOcr() {
        return { type: 'ocr', data: { action: 'open_ocr_modal' } };
    }
}

module.exports = new WidgetService();
