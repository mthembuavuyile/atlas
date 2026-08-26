/**
 * Atlas Multi-Source Search & Scientific Grounding Engine
 * ─────────────────────────────────────────────────────────────
 * Resilient multi-provider search & page extraction integrating:
 * 1. Jina AI Reader API (Full headless JS rendering & markdown extraction)
 * 2. SearXNG Public JSON Metasearch (Google/Bing/DDG multi-engine aggregation)
 * 3. DuckDuckGo Lite Parser (Bypass anti-bot scraping restrictions)
 * 4. Wikipedia Search API (Scientific / Encyclopedic knowledge)
 * 5. OpenAlex Scholarly API (Scientific papers, research & citations)
 * 6. HackerNews Algolia API (Tech & engineering discussions)
 * 7. In-memory TTL Caching Layer
 */

const { fetchWithTimeout } = require('../utils/fetchWithTimeout');
const cache = require('../utils/cache');

class SearchService {
  /**
   * Search across verified free APIs with intelligent multi-source aggregation
   * @param {string} query
   * @param {number} maxResults
   * @returns {Promise<Array<{title: string, snippet: string, url: string, source: string}>>}
   */
  async searchWeb(query, maxResults = 5) {
    if (!query || typeof query !== 'string' || !query.trim()) {
      return [];
    }

    const cleanQuery = query.trim().slice(0, 200);
    const cacheKey = `search:${cleanQuery.toLowerCase()}`;
    const cached = cache.get(cacheKey);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached.slice(0, maxResults);
    }

    const results = [];
    const seenUrls = new Set();

    const addResult = (title, snippet, url, source) => {
      if (!url || typeof url !== 'string' || !url.startsWith('http') || seenUrls.has(url) || results.length >= maxResults) return;
      seenUrls.add(url);
      results.push({
        title: this.cleanHtmlEntities(title || 'Web Result'),
        snippet: this.cleanHtmlEntities(snippet || ''),
        url,
        source: source || 'Web'
      });
    };

    // 1. Parallel query across dependable open search & scientific engines
    const tasks = [
      this.searchSearXNG(cleanQuery),
      this.searchDuckDuckGoLite(cleanQuery),
      this.searchDuckDuckGoInstant(cleanQuery),
      this.searchWikipedia(cleanQuery),
      this.searchOpenAlex(cleanQuery),
      this.searchHackerNews(cleanQuery)
    ];

    const settled = await Promise.allSettled(tasks);
    for (const res of settled) {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        for (const item of res.value) {
          addResult(item.title, item.snippet, item.url, item.source);
        }
      }
    }

    // 2. If results are still sparse, attempt standard DuckDuckGo HTML search
    if (results.length < maxResults) {
      try {
        const ddgResults = await this.searchDuckDuckGoHtml(cleanQuery, maxResults - results.length);
        for (const item of ddgResults) {
          addResult(item.title, item.snippet, item.url, 'DuckDuckGo');
        }
      } catch (e) {}
    }

    const finalResults = results.slice(0, maxResults);
    if (finalResults.length > 0) {
      cache.set(cacheKey, finalResults, 300); // Cache search queries for 5 mins
    }

    return finalResults;
  }

  /**
   * SearXNG Public JSON Metasearch
   */
  async searchSearXNG(query) {
    const instances = [
      'https://searx.be',
      'https://search.ononoki.org',
      'https://northboot.xyz'
    ];

    for (const instance of instances) {
      try {
        const url = `${instance}/search?q=${encodeURIComponent(query)}&format=json&categories=general`;
        const res = await fetchWithTimeout(url, {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(3500)
        });

        if (!res.ok) continue;
        const data = await res.json();
        const items = Array.isArray(data.results) ? data.results : [];

        if (items.length > 0) {
          return items.slice(0, 4).map(item => ({
            title: item.title,
            snippet: item.content || item.snippet || '',
            url: item.url,
            source: `SearXNG (${item.engine || 'Web'})`
          }));
        }
      } catch (err) {
        // Try next instance
      }
    }
    return [];
  }

  /**
   * DuckDuckGo Lite Parser (Text-only endpoint, high resilience against scraping blocks)
   */
  async searchDuckDuckGoLite(query) {
    try {
      const url = 'https://lite.duckduckgo.com/lite/';
      const res = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html'
        },
        body: `q=${encodeURIComponent(query)}&kl=wt-wt`,
        signal: AbortSignal.timeout(3500)
      });

      if (!res.ok) return [];
      const html = await res.text();
      const items = [];

      // Match result link table rows
      const regex = /<a[^>]+class=['"]result-link['"][^>]*href=['"]([^'"]+)['"][^>]*>([\s\S]*?)<\/a>[\s\S]*?<td[^>]+class=['"]result-snippet['"][^>]*>([\s\S]*?)<\/td>/gi;
      let match;
      while ((match = regex.exec(html)) !== null && items.length < 4) {
        let rawUrl = match[1];
        if (rawUrl.includes('uddg=')) {
          const m = rawUrl.match(/uddg=([^&]+)/);
          if (m) rawUrl = decodeURIComponent(m[1]);
        }
        const title = match[2].replace(/<[^>]+>/g, '').trim();
        const snippet = match[3].replace(/<[^>]+>/g, '').trim();

        if (rawUrl && title && !rawUrl.startsWith('/')) {
          items.push({
            title,
            snippet,
            url: rawUrl,
            source: 'DuckDuckGo'
          });
        }
      }

      return items;
    } catch (err) {
      return [];
    }
  }

  /**
   * DuckDuckGo Instant Answer API
   */
  async searchDuckDuckGoInstant(query) {
    try {
      const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
      const res = await fetchWithTimeout(url, { signal: AbortSignal.timeout(3500) });
      if (!res.ok) return [];
      const data = await res.json();
      const items = [];

      if (data.AbstractText && data.AbstractURL) {
        items.push({
          title: data.Heading || query,
          snippet: data.AbstractText,
          url: data.AbstractURL,
          source: 'DuckDuckGo Knowledge'
        });
      }

      if (Array.isArray(data.RelatedTopics)) {
        for (const topic of data.RelatedTopics) {
          if (topic.Text && topic.FirstURL) {
            items.push({
              title: topic.Text.split(' - ')[0] || topic.Text.slice(0, 50),
              snippet: topic.Text,
              url: topic.FirstURL,
              source: 'DuckDuckGo'
            });
          }
        }
      }

      return items;
    } catch (err) {
      return [];
    }
  }

  /**
   * Wikipedia Search API
   */
  async searchWikipedia(query) {
    try {
      const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=3`;
      const res = await fetchWithTimeout(url, { signal: AbortSignal.timeout(3500) });
      if (!res.ok) return [];
      const data = await res.json();
      const searchItems = data.query?.search || [];

      return searchItems.map(item => ({
        title: item.title,
        snippet: item.snippet.replace(/<[^>]+>/g, ''),
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/\s+/g, '_'))}`,
        source: 'Wikipedia'
      }));
    } catch (err) {
      return [];
    }
  }

  /**
   * OpenAlex Scholarly Paper Search API
   */
  async searchOpenAlex(query) {
    try {
      const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=3&mailto=hello@vylex.co.za`;
      const res = await fetchWithTimeout(url, { signal: AbortSignal.timeout(3500) });
      if (!res.ok) return [];
      const data = await res.json();
      const results = data.results || [];

      return results.map(work => {
        let snippet = work.publication_year ? `Published in ${work.publication_year}. ` : '';
        if (work.cited_by_count) snippet += `Cited by ${work.cited_by_count} papers. `;
        if (work.primary_location?.source?.display_name) snippet += `Journal: ${work.primary_location.source.display_name}. `;

        return {
          title: work.display_name || work.title || 'Scholarly Publication',
          snippet: snippet || 'Open scientific publication reference.',
          url: work.doi ? `https://doi.org/${work.doi.replace('https://doi.org/', '')}` : work.id,
          source: 'OpenAlex Research'
        };
      });
    } catch (err) {
      return [];
    }
  }

  /**
   * HackerNews Algolia Search API
   */
  async searchHackerNews(query) {
    try {
      const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=3`;
      const res = await fetchWithTimeout(url, { signal: AbortSignal.timeout(3500) });
      if (!res.ok) return [];
      const data = await res.json();
      const hits = data.hits || [];

      return hits
        .filter(hit => hit.title && (hit.url || hit.objectID))
        .map(hit => ({
          title: hit.title,
          snippet: `Points: ${hit.points || 0} • Comments: ${hit.num_comments || 0} • Author: ${hit.author || 'unknown'}`,
          url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
          source: 'Hacker News'
        }));
    } catch (err) {
      return [];
    }
  }

  /**
   * Fallback DuckDuckGo HTML scraper
   */
  async searchDuckDuckGoHtml(query, maxResults = 3) {
    try {
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const res = await fetchWithTimeout(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        signal: AbortSignal.timeout(3500)
      });

      if (!res.ok) return [];
      const html = await res.text();
      const results = [];
      const blocks = html.match(/<div class="result results_links results_links_deep web-result[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g) || [];

      for (const block of blocks) {
        if (results.length >= maxResults) break;
        const titleMatch = block.match(/<a[^>]+class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
        const snippetMatch = block.match(/<a class="result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/);

        if (titleMatch) {
          let rawUrl = titleMatch[1];
          if (rawUrl.includes('uddg=')) {
            const m = rawUrl.match(/uddg=([^&]+)/);
            if (m) rawUrl = decodeURIComponent(m[1]);
          }
          const rawTitle = titleMatch[2].replace(/<[^>]+>/g, '').trim();
          const rawSnippet = snippetMatch ? snippetMatch[1].replace(/<[^>]+>/g, '').trim() : '';

          if (rawUrl && rawTitle && !rawUrl.startsWith('/')) {
            results.push({
              title: rawTitle,
              snippet: rawSnippet,
              url: rawUrl,
              source: 'DuckDuckGo'
            });
          }
        }
      }
      return results;
    } catch (err) {
      return [];
    }
  }

  /**
   * Fetch and extract clean markdown/text content from any target webpage URL
   * Prioritizes Jina AI Reader (headless browser rendering for SPAs, ads/clutter removal).
   * @param {string} url
   * @param {number} maxChars
   * @returns {Promise<string>}
   */
  async fetchPageText(url, maxChars = 3500) {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return 'Invalid or missing webpage URL.';
    }

    const cacheKey = `page:${url.trim()}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // 1. Primary: Jina AI Reader API (100% free, headless browser execution, clean Markdown output)
    try {
      const jinaUrl = `https://r.jina.ai/${encodeURI(url.trim())}`;
      const jinaRes = await fetchWithTimeout(jinaUrl, {
        headers: {
          'Accept': 'text/plain',
          'X-No-Cache': 'false'
        },
        signal: AbortSignal.timeout(6500)
      });

      if (jinaRes.ok) {
        const markdown = await jinaRes.text();
        if (markdown && markdown.trim().length > 50) {
          const cleanText = this.cleanHtmlEntities(markdown.slice(0, maxChars).trim());
          cache.set(cacheKey, cleanText, 600); // Cache page content for 10 mins
          return cleanText;
        }
      }
    } catch (e) {
      // Fallback to direct fetch
    }

    // 2. Fallback: Direct fetch with HTML cleaning
    try {
      const res = await fetchWithTimeout(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        signal: AbortSignal.timeout(5000)
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const html = await res.text();

      const cleaned = html
        .replace(/<head[\s\S]*?<\/head>/gi, '')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[\s\S]*?<\/nav>/gi, '')
        .replace(/<footer[\s\S]*?<\/footer>/gi, '')
        .replace(/<header[\s\S]*?<\/header>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const output = this.cleanHtmlEntities(cleaned.slice(0, maxChars));
      if (output) {
        cache.set(cacheKey, output, 600);
      }
      return output;
    } catch (err) {
      return `Failed to retrieve content from ${url}: ${err.message}`;
    }
  }

  /**
   * Format grounding search results into clean system context injection
   * @param {Array<{title: string, snippet: string, url: string, source: string}>} results
   * @param {string} query
   * @returns {string}
   */
  formatGroundingContext(results, query) {
    if (!results || results.length === 0) {
      return '';
    }

    let context = `[REAL-TIME SEARCH & SCIENTIFIC GROUNDING]\n`;
    context += `Query: "${query}"\n`;
    context += `Timestamp: ${new Date().toUTCString()}\n\n`;
    context += `Verified Live Sources:\n`;

    results.forEach((item, index) => {
      context += `${index + 1}. [${item.title}](${item.url}) (${item.source || 'Web'})\n`;
      if (item.snippet) {
        context += `   Summary: ${item.snippet}\n`;
      }
      context += `\n`;
    });

    context += `INSTRUCTIONS:\n`;
    context += `- Synthesize the answer accurately using the real-time search context above.\n`;
    context += `- Cite sources using standard Markdown links [Source Title](URL).\n`;
    context += `- If the search results do not cover every detail, acknowledge what was found objectively.\n`;

    return context;
  }

  /**
   * Decode common HTML entities
   * @param {string} str
   * @returns {string}
   */
  cleanHtmlEntities(str) {
    if (!str) return '';
    return str
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ');
  }
}

module.exports = new SearchService();
