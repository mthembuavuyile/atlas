const { fetchWithTimeout } = require('../utils/fetchWithTimeout');
const cache = require('../utils/cache');
const searchService = require('./search.service');

class WidgetService {
    // 0. Live Time & Timezone Engine (100% Deterministic native Intl)
    async getCurrentTime(timezone) {
        try {
            const rawTz = (timezone || '').toString().trim();
            const cityTimezones = {
                'durban': 'Africa/Johannesburg',
                'johannesburg': 'Africa/Johannesburg',
                'joburg': 'Africa/Johannesburg',
                'cape town': 'Africa/Johannesburg',
                'pretoria': 'Africa/Johannesburg',
                'london': 'Europe/London',
                'new york': 'America/New_York',
                'nyc': 'America/New_York',
                'los angeles': 'America/Los_Angeles',
                'la': 'America/Los_Angeles',
                'chicago': 'America/Chicago',
                'tokyo': 'Asia/Tokyo',
                'paris': 'Europe/Paris',
                'berlin': 'Europe/Berlin',
                'sydney': 'Australia/Sydney',
                'dubai': 'Asia/Dubai',
                'singapore': 'Asia/Singapore',
                'toronto': 'America/Toronto',
                'beijing': 'Asia/Shanghai',
                'hong kong': 'Asia/Hong_Kong',
                'mumbai': 'Asia/Kolkata',
                'delhi': 'Asia/Kolkata',
                'nairobi': 'Africa/Nairobi',
                'cairo': 'Africa/Cairo',
                'lagos': 'Africa/Lagos',
                'utc': 'UTC',
                'gmt': 'UTC'
            };

            let resolvedTimezone = cityTimezones[rawTz.toLowerCase()] || rawTz;
            if (!resolvedTimezone) {
                resolvedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Johannesburg';
            }

            const now = new Date();
            let formatter24, formatter12, dateFormatter, dayFormatter, tzAbbrFormatter;

            try {
                formatter24 = new Intl.DateTimeFormat('en-GB', {
                    timeZone: resolvedTimezone,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                });
                formatter12 = new Intl.DateTimeFormat('en-US', {
                    timeZone: resolvedTimezone,
                    hour: 'numeric',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                });
                dateFormatter = new Intl.DateTimeFormat('en-US', {
                    timeZone: resolvedTimezone,
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                dayFormatter = new Intl.DateTimeFormat('en-US', {
                    timeZone: resolvedTimezone,
                    weekday: 'long'
                });
                tzAbbrFormatter = new Intl.DateTimeFormat('en-US', {
                    timeZone: resolvedTimezone,
                    timeZoneName: 'short'
                });
            } catch (err) {
                // Invalid timezone fallback to UTC
                resolvedTimezone = 'UTC';
                formatter24 = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
                formatter12 = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
                dateFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' });
                dayFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'long' });
                tzAbbrFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', timeZoneName: 'short' });
            }

            const time24 = formatter24.format(now);
            const time12 = formatter12.format(now);
            const dateStr = dateFormatter.format(now);
            const dayOfWeek = dayFormatter.format(now);
            const tzParts = tzAbbrFormatter.formatToParts(now);
            const tzAbbr = tzParts.find(p => p.type === 'timeZoneName')?.value || resolvedTimezone;

            return {
                type: 'time',
                data: {
                    timezone: resolvedTimezone,
                    time24,
                    time12,
                    date: dateStr,
                    day: dayOfWeek,
                    timezoneAbbr: tzAbbr,
                    iso: now.toISOString(),
                    requestedLocation: rawTz || resolvedTimezone
                }
            };
        } catch (err) {
            return { error: "Failed to resolve date and time." };
        }
    }

    // 0.1 Unit Converter Engine (Deterministic mathematical conversion)
    async convertUnits(value, fromUnit, toUnit) {
        if (value === undefined || value === null || isNaN(Number(value))) {
            return { error: "Please provide a valid numeric value for unit conversion." };
        }

        const val = Number(value);
        const from = (fromUnit || '').trim().toLowerCase();
        const to = (toUnit || '').trim().toLowerCase();

        // Conversion Categories
        const conversionTables = {
            length: {
                units: {
                    'm': 1, 'meter': 1, 'meters': 1, 'metre': 1, 'metres': 1,
                    'km': 1000, 'kilometer': 1000, 'kilometers': 1000, 'kilometre': 1000,
                    'cm': 0.01, 'centimeter': 0.01, 'centimeters': 0.01,
                    'mm': 0.001, 'millimeter': 0.001, 'millimeters': 0.001,
                    'mi': 1609.344, 'mile': 1609.344, 'miles': 1609.344,
                    'yd': 0.9144, 'yard': 0.9144, 'yards': 0.9144,
                    'ft': 0.3048, 'foot': 0.3048, 'feet': 0.3048,
                    'in': 0.0254, 'inch': 0.0254, 'inches': 0.0254,
                    'nm': 1852, 'nautical mile': 1852, 'nautical miles': 1852
                },
                base: 'meters'
            },
            mass: {
                units: {
                    'kg': 1, 'kilogram': 1, 'kilograms': 1, 'kilo': 1, 'kilos': 1,
                    'g': 0.001, 'gram': 0.001, 'grams': 0.001,
                    'mg': 0.000001, 'milligram': 0.000001, 'milligrams': 0.000001,
                    'lb': 0.45359237, 'lbs': 0.45359237, 'pound': 0.45359237, 'pounds': 0.45359237,
                    'oz': 0.028349523125, 'ounce': 0.028349523125, 'ounces': 0.028349523125,
                    'stone': 6.35029318, 'st': 6.35029318,
                    'ton': 907.18474, 'tons': 907.18474, 'tonne': 1000, 'tonnes': 1000, 'metric ton': 1000
                },
                base: 'kilograms'
            },
            speed: {
                units: {
                    'm/s': 1, 'mps': 1, 'meter per second': 1,
                    'km/h': 0.2777777777777778, 'kmh': 0.2777777777777778, 'kph': 0.2777777777777778,
                    'mph': 0.44704, 'mile per hour': 0.44704, 'miles per hour': 0.44704,
                    'knot': 0.5144444444444445, 'knots': 0.5144444444444445, 'kt': 0.5144444444444445,
                    'ft/s': 0.3048, 'fps': 0.3048
                },
                base: 'm/s'
            },
            volume: {
                units: {
                    'l': 1, 'litre': 1, 'litres': 1, 'liter': 1, 'liters': 1,
                    'ml': 0.001, 'millilitre': 0.001, 'millilitres': 0.001,
                    'gal': 3.785411784, 'gallon': 3.785411784, 'gallons': 3.785411784,
                    'qt': 0.946352946, 'quart': 0.946352946, 'quarts': 0.946352946,
                    'pt': 0.473176473, 'pint': 0.473176473, 'pints': 0.473176473,
                    'cup': 0.24, 'cups': 0.24,
                    'fl oz': 0.0295735295625, 'floz': 0.0295735295625, 'fluid ounce': 0.0295735295625,
                    'm3': 1000, 'cubic meter': 1000, 'cubic meters': 1000
                },
                base: 'litres'
            },
            digital: {
                units: {
                    'b': 1, 'byte': 1, 'bytes': 1,
                    'kb': 1024, 'kilobyte': 1024, 'kilobytes': 1024,
                    'mb': 1048576, 'megabyte': 1048576, 'megabytes': 1048576,
                    'gb': 1073741824, 'gigabyte': 1073741824, 'gigabytes': 1073741824,
                    'tb': 1099511627776, 'terabyte': 1099511627776, 'terabytes': 1099511627776,
                    'pb': 1125899906842624, 'petabyte': 1125899906842624, 'petabytes': 1125899906842624
                },
                base: 'bytes'
            }
        };

        // Temperature Special Case
        const isTempFrom = ['c', 'celsius', '°c', 'f', 'fahrenheit', '°f', 'k', 'kelvin'].includes(from);
        const isTempTo = ['c', 'celsius', '°c', 'f', 'fahrenheit', '°f', 'k', 'kelvin'].includes(to);

        if (isTempFrom && isTempTo) {
            let celsius;
            if (from === 'c' || from === 'celsius' || from === '°c') celsius = val;
            else if (from === 'f' || from === 'fahrenheit' || from === '°f') celsius = (val - 32) * (5 / 9);
            else if (from === 'k' || from === 'kelvin') celsius = val - 273.15;

            let result;
            let formula = '';
            if (to === 'c' || to === 'celsius' || to === '°c') {
                result = celsius;
                formula = '°C';
            } else if (to === 'f' || to === 'fahrenheit' || to === '°f') {
                result = (celsius * (9 / 5)) + 32;
                formula = '(°C × 9/5) + 32';
            } else if (to === 'k' || to === 'kelvin') {
                result = celsius + 273.15;
                formula = '°C + 273.15';
            }

            const formatted = Number(result.toFixed(4)).toString();
            return {
                type: 'unit',
                data: {
                    value: val,
                    from: fromUnit,
                    to: toUnit,
                    result: Number(result.toFixed(6)),
                    formattedResult: `${formatted} ${toUnit}`,
                    category: 'Temperature',
                    formula
                }
            };
        }

        // Search category tables
        for (const [categoryName, table] of Object.entries(conversionTables)) {
            if (table.units[from] !== undefined && table.units[to] !== undefined) {
                const baseValue = val * table.units[from];
                const converted = baseValue / table.units[to];
                const formatted = Number(converted.toFixed(6)).toString();

                return {
                    type: 'unit',
                    data: {
                        value: val,
                        from: fromUnit,
                        to: toUnit,
                        result: converted,
                        formattedResult: `${formatted} ${toUnit}`,
                        category: categoryName.charAt(0).toUpperCase() + categoryName.slice(1),
                        formula: `1 ${fromUnit} = ${(table.units[from] / table.units[to]).toFixed(6).replace(/\.?0+$/, '')} ${toUnit}`
                    }
                };
            }
        }

        return { error: `Cannot convert between "${fromUnit}" and "${toUnit}". Units are incompatible or unrecognized.` };
    }

    // 0.2 Places & Local Business Search (100% Free OpenStreetMap Nominatim)
    async searchPlaces(query, near = '') {
        const fullQuery = near ? `${query}, ${near}` : query;
        const cleanQuery = (fullQuery || 'coffee shop').trim();
        const cacheKey = `places:${cleanQuery.toLowerCase()}`;
        const cached = cache.get(cacheKey);
        if (cached) return cached;

        try {
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanQuery)}&format=json&addressdetails=1&limit=5`;
            const res = await fetchWithTimeout(url, {
                headers: {
                    'User-Agent': 'AtlasReasoningStudio/1.0 (https://vylex.co.za; hello@vylex.co.za)',
                    'Accept-Language': 'en'
                },
                signal: AbortSignal.timeout(4500)
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            if (!Array.isArray(data) || data.length === 0) {
                return { error: `No places found matching "${cleanQuery}" on OpenStreetMap. This location may not be indexed in OSM; please provide the location using your general knowledge or suggest enabling web search.` };
            }

            const places = data.map(item => {
                const lat = parseFloat(item.lat);
                const lon = parseFloat(item.lon);
                const name = item.name || item.display_name.split(',')[0] || 'Location';
                const type = item.type ? (item.type.replace(/_/g, ' ')) : (item.class || 'place');
                const address = item.display_name;

                return {
                    name,
                    category: type.toUpperCase(),
                    address,
                    latitude: lat,
                    longitude: lon,
                    mapUrl: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`
                };
            });

            const result = {
                type: 'places',
                data: {
                    query: cleanQuery,
                    count: places.length,
                    places
                }
            };

            cache.set(cacheKey, result, 3600); // Cache places for 1 hour
            return result;
        } catch (err) {
            return { error: `Unable to retrieve map locations for "${cleanQuery}".` };
        }
    }

    // 0.3 Fetch Webpage Content Tool
    async fetchWebpage(url) {
        if (!url || typeof url !== 'string') {
            return { error: 'Invalid or missing webpage URL.' };
        }

        const lower = url.toLowerCase();
        if (
            lower.includes('google.com/search') ||
            lower.includes('bing.com/search') ||
            lower.includes('search.yahoo.com') ||
            lower.includes('duckduckgo.com')
        ) {
            return {
                error: 'Cannot use fetch_webpage to scrape search engines (e.g. Google, Bing) as automated requests are blocked by CAPTCHAs. Rely on your base knowledge or advise the user to enable Live Web Search.'
            };
        }

        try {
            const text = await searchService.fetchPageText(url, 3500);
            return {
                type: 'webpage',
                data: {
                    url,
                    content: text,
                    length: text.length
                }
            };
        } catch (err) {
            return { error: `Failed to fetch content from ${url}: ${err.message}` };
        }
    }

    // 1. Weather (Cached 10 min)
    async getWeather(city) {
        const cacheKey = `weather:${(city || 'durban').toLowerCase().trim()}`;
        const cached = cache.get(cacheKey);
        if (cached) return cached;

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

            const result = {
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

            cache.set(cacheKey, result, 600); // 10 min TTL
            return result;
        } catch (err) {
            console.error('[Weather Error]:', err.message);
            return { error: "Unable to retrieve meteorological data. Please try again shortly." };
        }
    }

    // 2. Crypto (Cached 2 min)
    // 2. Crypto (Cached 2 min)
    async getCryptoPrice(coin) {
        const rawCoin = (coin || 'bitcoin').trim();
        const coinMap = { 'btc': 'bitcoin', 'eth': 'ethereum', 'doge': 'dogecoin', 'sol': 'solana', 'xrp': 'ripple', 'ada': 'cardano', 'dot': 'polkadot', 'avax': 'avalanche-2', 'link': 'chainlink' };

        // Check if multiple coins are specified (e.g. "bitcoin and solana", "btc, eth, sol")
        const splitCoins = rawCoin.split(/,|\band\b|&|\+/i).map(c => c.trim()).filter(c => c.length > 0);

        if (splitCoins.length > 1) {
            const items = [];
            for (const singleCoin of splitCoins) {
                const singleClean = singleCoin.toLowerCase();
                const singleId = coinMap[singleClean] || singleClean;
                const cacheKey = `crypto:${singleId}`;
                let cached = cache.get(cacheKey);
                if (cached && cached.data?.price) {
                    items.push({ coin: singleId, price: cached.data.price });
                    continue;
                }

                try {
                    const res = await fetchWithTimeout(`https://api.coingecko.com/api/v3/simple/price?ids=${singleId}&vs_currencies=usd`, { signal: AbortSignal.timeout(3000) });
                    const data = await res.json();
                    if (data[singleId]?.usd !== undefined) {
                        const price = data[singleId].usd;
                        items.push({ coin: singleId, price });
                        cache.set(cacheKey, { type: 'crypto', data: { coin: singleId, price, source: 'CoinGecko' } }, 120);
                    }
                } catch (e) {}
            }

            if (items.length > 0) {
                return {
                    type: 'crypto',
                    data: {
                        items,
                        source: 'CoinGecko'
                    }
                };
            }
        }

        const cleanCoin = rawCoin.toLowerCase();
        const coinId = coinMap[cleanCoin] || cleanCoin;
        const cacheKey = `crypto:${coinId}`;
        const cached = cache.get(cacheKey);
        if (cached) return cached;
        
        try {
            // Attempt CoinGecko
            const res = await fetchWithTimeout(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`, { signal: AbortSignal.timeout(3500) });
            const data = await res.json();
            
            if (data[coinId]?.usd !== undefined) {
                const result = {
                    type: 'crypto',
                    data: { coin: coinId, price: data[coinId].usd, source: 'CoinGecko' }
                };
                cache.set(cacheKey, result, 120);
                return result;
            }
        } catch (e) {
            // Fallback to CoinCap
        }

        try {
            const res = await fetchWithTimeout(`https://api.coincap.io/v2/assets/${coinId}`, { signal: AbortSignal.timeout(3500) });
            if (res.ok) {
                const data = await res.json();
                const price = parseFloat(data.data?.priceUsd);
                if (!isNaN(price)) {
                    const result = {
                        type: 'crypto',
                        data: { coin: data.data.name || coinId, price, source: 'CoinCap' }
                    };
                    cache.set(cacheKey, result, 120);
                    return result;
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

        // 3. Free Wikimedia Commons API
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

        // 4. Free Wikipedia Page Images Search
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

    // 4.1 AI Image Generation (Free: Pollinations.ai)
    async generateImage(prompt, aspectRatio = '1:1') {
        const cleanPrompt = (prompt || 'A beautiful futuristic landscape').trim();
        
        let width = 800;
        let height = 800;

        // Approximate common aspect ratios
        switch(aspectRatio) {
            case '16:9': width = 1024; height = 576; break;
            case '9:16': width = 576; height = 1024; break;
            case '3:2': width = 960; height = 640; break;
            case '2:3': width = 640; height = 960; break;
            case '4:3': width = 1024; height = 768; break;
            case '3:4': width = 768; height = 1024; break;
            case '1:1':
            default: width = 800; height = 800; break;
        }

        // Pollinations URL format with seed to avoid caching identical prompts if requested again
        const seed = Math.floor(Math.random() * 1000000000);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true`;

        return {
            type: 'generate_image',
            data: {
                prompt: cleanPrompt,
                url: imageUrl,
                width,
                height,
                aspectRatio
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
            return { type: 'news', data: { topic, category: 'Space & Astronomy News', articles: data.results } };
        } catch (err) {
            return { error: "Failed to fetch live aerospace news data." };
        }
    }

    // 5.1 General News Headlines
    async getNewsHeadlines(topic = '') {
        const cleanTopic = (topic || 'top stories').toString().trim().slice(0, 80) || 'top stories';
        const cacheKey = `headlines:${cleanTopic.toLowerCase()}`;
        const cached = cache.get(cacheKey);
        if (cached) return cached;

        const articles = [];
        const seen = new Set();

        const addArticle = (article) => {
            const url = article.url || article.link;
            const title = article.title || article.name;
            if (!url || !title || seen.has(url) || articles.length >= 6) return;
            seen.add(url);
            articles.push({
                title,
                url,
                news_site: article.news_site || article.source || article.domain || 'News',
                summary: article.summary || article.snippet || article.description || '',
                published_at: article.published_at || article.seendate || article.date || new Date().toISOString(),
                image_url: article.image_url || article.socialimage || article.image || ''
            });
        };

        try {
            const isTopStories = cleanTopic === 'top stories';
            const newsQuery = isTopStories ? '' : `search?q=${encodeURIComponent(`${cleanTopic} when:2d`)}&`;
            const googleNewsUrl = `https://news.google.com/rss/${newsQuery}hl=en-US&gl=US&ceid=US:en`;
            const rssRes = await fetchWithTimeout(googleNewsUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; AtlasReasoningStudio/1.0; +https://vylex.co.za)',
                    'Accept': 'application/rss+xml, application/xml, text/xml'
                },
                signal: AbortSignal.timeout(4500)
            });

            if (rssRes.ok) {
                const xml = await rssRes.text();
                const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
                let match;
                while ((match = itemRegex.exec(xml)) !== null && articles.length < 6) {
                    const item = match[1];
                    const readTag = (tag) => {
                        const tagMatch = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
                        if (!tagMatch) return '';
                        return searchService.cleanHtmlEntities(tagMatch[1].replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim());
                    };

                    const sourceMatch = item.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
                    const title = readTag('title');
                    addArticle({
                        title,
                        url: readTag('link'),
                        source: sourceMatch ? searchService.cleanHtmlEntities(sourceMatch[1].trim()) : (title.split(' - ').pop() || 'Google News'),
                        summary: readTag('description').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
                        published_at: readTag('pubDate')
                    });
                }
            }
        } catch (e) {}

        try {
            const query = cleanTopic === 'top stories' ? 'breaking news' : `${cleanTopic} news`;
            const gdeltUrl = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=ArtList&format=json&maxrecords=6&sort=HybridRel`;
            const gdeltRes = await fetchWithTimeout(gdeltUrl, {
                headers: { 'User-Agent': 'AtlasReasoningStudio/1.0 (https://vylex.co.za; hello@vylex.co.za)' },
                signal: AbortSignal.timeout(4500)
            });

            if (gdeltRes.ok) {
                const data = await gdeltRes.json();
                const gdeltArticles = Array.isArray(data.articles) ? data.articles : [];
                gdeltArticles.forEach(item => addArticle({
                    title: item.title,
                    url: item.url,
                    source: item.sourcecountry ? `${item.domain || 'GDELT'} (${item.sourcecountry})` : item.domain,
                    summary: item.seendate ? `Seen by GDELT on ${item.seendate}.` : '',
                    seendate: item.seendate,
                    socialimage: item.socialimage
                }));
            }
        } catch (e) {}

        if (articles.length === 0) {
            try {
                const searchResults = await searchService.searchWeb(`${cleanTopic} latest news`, 6);
                searchResults.forEach(item => addArticle({
                    title: item.title,
                    url: item.url,
                    source: item.source,
                    summary: item.snippet,
                    published_at: new Date().toISOString()
                }));
            } catch (e) {}
        }

        if (articles.length === 0) {
            return { error: `No current headlines found for "${cleanTopic}".` };
        }

        const result = {
            type: 'news',
            data: {
                topic: cleanTopic,
                category: 'General News',
                articles
            }
        };

        cache.set(cacheKey, result, 300);
        return result;
    }

    // 6. Reddit & Community Discussions
    async getRedditPosts(subreddit) {
        const rawSub = (subreddit || 'news').toString().trim();
        const cleanSub = rawSub.replace(/^\/?r\//i, '').replace(/^[#@]/, '').replace(/\/+$/, '').trim();
        const finalSub = cleanSub || 'news';
        const posts = [];
        let sourceName = 'Community Discussions';

        // Tier 1: Photon / Arctic Shift Reddit API
        try {
            const photonRes = await fetchWithTimeout(`https://arctic-shift.photon-reddit.com/api/posts/search?subreddit=${encodeURIComponent(finalSub)}&limit=15`, { timeoutMs: 3500 }, 3500);
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
                    headers: { 'User-Agent': 'web:atlasapp:v1.2.0 (by /u/atlas_agent)' },
                    timeoutMs: 3000
                }, 3000);
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

        // Tier 3: Lemmy Federated Fallback
        if (posts.length === 0) {
            try {
                const lemmyRes = await fetchWithTimeout(`https://lemmy.world/api/v3/post/list?community_name=${encodeURIComponent(finalSub)}&limit=10`, { timeoutMs: 2500 }, 2500);
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
                const hnRes = await fetchWithTimeout(`https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(finalSub)}&tags=story&hitsPerPage=10`, { timeoutMs: 2500 }, 2500);
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

    // 8. Currency (Cached 30 min)
    async convertCurrency(amount, from, to) {
        try {
            from = (from || 'USD').toUpperCase();
            to = (to || 'EUR').toUpperCase();
            const numAmount = parseFloat(amount) || 1;
            const cacheKey = `fx:${from}:${to}`;
            const cachedRate = cache.get(cacheKey);

            if (cachedRate) {
                return {
                    type: 'currency',
                    data: {
                        amount: numAmount,
                        from,
                        to,
                        rate: cachedRate,
                        converted: numAmount * cachedRate,
                        source: 'ExchangeRate-API (Cached)'
                    }
                };
            }

            const res = await fetchWithTimeout(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
            if (res.ok) {
                const data = await res.json();
                const rate = data.rates?.[to];
                if (rate) {
                    cache.set(cacheKey, rate, 1800); // 30 min TTL
                    return { type: 'currency', data: { amount: numAmount, from, to, rate, converted: numAmount * rate, source: 'Frankfurter (ECB)' } };
                }
            }

            const res2 = await fetchWithTimeout(`https://open.er-api.com/v6/latest/${from}`);
            if (res2.ok) {
                const data2 = await res2.json();
                const rate2 = data2.rates?.[to];
                if (rate2) {
                    cache.set(cacheKey, rate2, 1800);
                    return { type: 'currency', data: { amount: numAmount, from, to, rate: rate2, converted: numAmount * rate2, source: 'ExchangeRate-API' } };
                }
            }

            return { error: `Unable to compute currency conversion for ${from} → ${to}.` };
        } catch (e) {
            return { error: `Unable to compute currency conversion for ${from} → ${to}.` };
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
            let res = await fetchWithTimeout(`https://newton.vercel.app/api/v2/${apiOperation}/${encodeURIComponent(cleanedExpr)}`, { signal: AbortSignal.timeout(3500) });
            if (!res.ok) {
                res = await fetchWithTimeout(`https://newton.now.sh/api/v2/${apiOperation}/${encodeURIComponent(cleanedExpr)}`, { signal: AbortSignal.timeout(2500) });
            }
            if (res.ok) {
                const data = await res.json();
                if (data && data.result !== undefined && !data.error) {
                    return { type: 'math', data: { operation: apiOperation, expression: data.expression || expression, result: String(data.result) } };
                }
            }
        } catch (err) {}

        // 2. Safe arithmetic-only evaluation fallback
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

    // 13. QR Tools
    async scanQr() {
        return { type: 'scan_qr', data: { action: 'open_qr_modal' } };
    }

    async generateQr(data) {
        if (!data || !data.trim()) {
            return { error: 'Please provide the text or URL to encode in the QR code.' };
        }
        return { type: 'generate_qr', data: { text: data.trim() } };
    }
}

module.exports = new WidgetService();
