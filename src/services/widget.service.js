const { fetchWithTimeout } = require('../utils/fetchWithTimeout');

class WidgetService {
    // 1. Weather
    async getWeather(city) {
        try {
            const geoRes = await fetchWithTimeout(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
            if (!geoRes.ok) throw new Error('Geocoding service down');
            const geoData = await geoRes.json();
            
            if (!geoData.results?.length) {
                return { error: `Sorry, I couldn't find "${city}". Check the spelling?` };
            }
            const { latitude, longitude, name, country } = geoData.results[0];
            
            const params = new URLSearchParams({
                latitude, longitude, current_weather: true,
                temperature_unit: 'celsius', wind_speed_unit: 'kmh'
            });
            const weatherRes = await fetchWithTimeout(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
            const weatherData = await weatherRes.json();
            
            return {
                type: 'weather',
                data: { name, country, current: weatherData.current_weather }
            };
        } catch (err) {
            console.error("Weather Error:", err);
            return { error: "I'm having trouble fetching the weather. Please try again in a moment." };
        }
    }

    // 2. Crypto
    async getCryptoPrice(coin) {
        const coinMap = { 'btc': 'bitcoin', 'eth': 'ethereum', 'doge': 'dogecoin' };
        const coinId = coinMap[coin.toLowerCase()] || coin.toLowerCase();
        
        try {
            const res = await fetchWithTimeout(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
            const data = await res.json();
            
            if (!data[coinId]) {
                return { error: `Sorry, I couldn't find pricing data for "${coin}".` };
            }
            return {
                type: 'crypto',
                data: { coin: coinId, price: data[coinId].usd }
            };
        } catch (err) {
            return { error: "The crypto market API is currently unreachable." };
        }
    }

    // 3. Bible
    async getBibleVerse(reference) {
        if (!reference) {
            const randomVerses = ["John 3:16", "Jeremiah 29:11", "Romans 8:28", "Genesis 1:1", "Psalm 23:1"];
            reference = randomVerses[Math.floor(Math.random() * randomVerses.length)];
        }
        
        try {
            const res = await fetchWithTimeout(`https://bible-api.com/${encodeURIComponent(reference)}?translation=kjv`);
            if (!res.ok) return { error: `I couldn't find the verse "${reference}".` };
            const data = await res.json();
            
            if (data.error) return { error: `Bible reference not found: "${reference}".` };
            
            return {
                type: 'bible',
                data: { reference: data.reference, text: data.text, translation: data.translation_name || 'KJV', verses: data.verses }
            };
        } catch (err) {
            return { error: "The Bible service is currently unavailable." };
        }
    }

    // 4. Images
    async searchImages(query) {
        const API_KEYS = {
            unsplash: process.env.UNSPLASH_ACCESS_KEY || '',
            pixabay: process.env.PIXABAY_API_KEY || ''
        };
        const allImages = [];
        
        if (API_KEYS.unsplash) {
            try {
                const res = await fetchWithTimeout(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=3&client_id=${API_KEYS.unsplash}`);
                const data = await res.json();
                if (data.results?.length) {
                    data.results.forEach(photo => allImages.push({
                        src: photo.urls.regular, thumb: photo.urls.small, link: photo.links.html,
                        author: photo.user?.name || '', provider: 'Unsplash', color: photo.color || '#888'
                    }));
                }
            } catch (e) { console.warn('Unsplash failed:', e); }
        }
        
        if (API_KEYS.pixabay) {
            try {
                const res = await fetchWithTimeout(`https://api.pixabay.com/api/?key=${API_KEYS.pixabay}&q=${encodeURIComponent(query)}&image_type=photo&per_page=3&safesearch=true`);
                const data = await res.json();
                if (data.hits?.length) {
                    data.hits.forEach(hit => allImages.push({
                        src: hit.largeImageURL, thumb: hit.webformatURL, link: hit.pageURL,
                        author: hit.user || '', provider: 'Pixabay', color: '#888'
                    }));
                }
            } catch (e) { console.warn('Pixabay failed:', e); }
        }
        
        if (!allImages.length) {
            return { error: `Sorry, I couldn't find any images of "${query}" right now.` };
        }
        return { type: 'image', data: { query, images: allImages } };
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
                return { error: "No recent space news found at the moment." };
            }
            return { type: 'news', data: { topic, articles: data.results } };
        } catch (err) {
            return { error: "Failed to fetch live space news." };
        }
    }

    // 6. Reddit
    async getRedditPosts(subreddit) {
        try {
            const target = `https://www.reddit.com/r/${subreddit}/hot.json?limit=10&raw_json=1`;
            const res = await fetchWithTimeout(target, { headers: { 'Accept': 'application/json' } });
            const data = await res.json();
            
            if (data?.reason === 'private' || data?.error === 403) return { error: `r/${subreddit} is private` };
            if (data?.error === 404) return { error: `r/${subreddit} not found` };
            
            const posts = data?.data?.children;
            if (!posts?.length) return { error: 'No posts returned' };
            
            const formatted = posts.slice(0, 5).map(({ data: p }) => ({
                title: p.title, url: `https://reddit.com${p.permalink}`, ups: p.ups, comments: p.num_comments,
                author: p.author, flair: p.link_flair_text || '', thumbnail: p.thumbnail?.startsWith('http') ? p.thumbnail : null
            }));
            return { type: 'reddit', data: { subreddit, posts: formatted } };
        } catch (err) {
            return { error: `Couldn't load r/${subreddit} right now.` };
        }
    }

    // 7. Dictionary
    async defineWord(word) {
        try {
            const res = await fetchWithTimeout(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
            if (!res.ok) return { error: `I couldn't find a definition for "${word}".` };
            const [entry] = await res.json();
            return { type: 'dictionary', data: { entry } };
        } catch (err) {
            return { error: "Dictionary service is down." };
        }
    }

    // 8. Currency
    async convertCurrency(amount, from, to) {
        try {
            from = from.toUpperCase();
            to = to.toUpperCase();
            const res = await fetchWithTimeout(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            const rate = data.rates?.[to];
            if (!rate) throw new Error();
            return { type: 'currency', data: { amount, from, to, rate, converted: amount * rate, source: 'Frankfurter (ECB)' } };
        } catch (e) {
            try {
                const res2 = await fetchWithTimeout(`https://open.er-api.com/v6/latest/${from}`);
                if (!res2.ok) throw new Error();
                const data2 = await res2.json();
                const rate2 = data2.rates?.[to];
                if (!rate2) throw new Error();
                return { type: 'currency', data: { amount, from, to, rate: rate2, converted: amount * rate2, source: 'ExchangeRate-API' } };
            } catch (e2) {
                return { error: `Sorry, I couldn't fetch the exchange rate for ${from} → ${to} right now.` };
            }
        }
    }

    // 9. Math
    async solveMath(expression, operation = 'simplify') {
        const opMap = { 'derivative': 'derive', 'integral': 'integrate', 'factorize': 'factor', 'calculate': 'simplify', 'compute': 'simplify' };
        const apiOperation = opMap[operation] || operation;
        
        let cleanedExpr = expression.replace(/\s*=\s*$/, '').replace(/×/g, '*').replace(/÷/g, '/');
        if (cleanedExpr.includes('=')) {
            const parts = cleanedExpr.split('=');
            if (parts.length === 2) {
                const lhs = parts[0].trim();
                const rhs = parts[1].trim();
                cleanedExpr = (rhs === '0') ? lhs : `(${lhs})-(${rhs})`;
                if (apiOperation === 'simplify') operation = 'solve';
            }
        }

        try {
            const res = await fetchWithTimeout(`https://newton.now.sh/api/v2/${apiOperation}/${encodeURIComponent(cleanedExpr)}`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            if (!data || data.result === undefined || data.error) throw new Error();
            return { type: 'math', data: { operation: apiOperation, expression: data.expression, result: data.result } };
        } catch (err) {
            return { error: `Hmm, I couldn't compute "${expression}".` };
        }
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
            return { error: "Couldn't fetch a joke right now." };
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
            return { error: "The advice service is unavailable." };
        }
    }

    // 12. OCR
    async scanOcr() {
        return { type: 'ocr', data: { action: 'open_ocr_modal' } };
    }
}

module.exports = new WidgetService();
