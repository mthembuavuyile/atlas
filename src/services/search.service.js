/**
 * Atlas Multi-Source Search & Scientific Grounding Engine
 * ─────────────────────────────────────────────────────────────
 * Resilient multi-provider search integrating:
 * 1. DuckDuckGo Instant Answers API
 * 2. Wikipedia Search API (Scientific / Encyclopedic knowledge)
 * 3. OpenAlex Scholarly API (Scientific papers, research & citations)
 * 4. HackerNews Algolia API (Tech & engineering discussions)
 * 5. Safe webpage content extraction
 */

const { fetchWithTimeout } = require('../utils/fetchWithTimeout');

class SearchService {
  /**
   * Search across verified free APIs with intelligent fallbacks
   * @param {string} query
   * @param {number} maxResults
   * @returns {Promise<Array<{title: string, snippet: string, url: string, source: string}>>}
   */
  async searchWeb(query, maxResults = 5) {
    if (!query || typeof query !== 'string' || !query.trim()) {
      return [];
    }

    const cleanQuery = query.trim().slice(0, 200);
    const results = [];
    const seenUrls = new Set();

    const addResult = (title, snippet, url, source) => {
      if (!url || seenUrls.has(url) || results.length >= maxResults) return;
      seenUrls.add(url);
      results.push({
        title: this.cleanHtmlEntities(title),
        snippet: this.cleanHtmlEntities(snippet),
        url,
        source: source || 'Web'
      });
    };

    // 1. Parallel query across dependable open APIs
    const tasks = [
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

    // 2. If results are still sparse, attempt DuckDuckGo HTML search
    if (results.length < maxResults) {
      try {
        const ddgResults = await this.searchDuckDuckGoHtml(cleanQuery, maxResults - results.length);
        for (const item of ddgResults) {
          addResult(item.title, item.snippet, item.url, 'DuckDuckGo');
        }
      } catch (e) {
        // Fallback gracefully
      }
    }

    return results.slice(0, maxResults);
  }

  /**
   * DuckDuckGo Instant Answer API
   */
  async searchDuckDuckGoInstant(query) {
    try {
      const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
      const res = await fetchWithTimeout(url, { signal: AbortSignal.timeout(4000) });
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
      const res = await fetchWithTimeout(url, { signal: AbortSignal.timeout(4000) });
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
      const res = await fetchWithTimeout(url, { signal: AbortSignal.timeout(4000) });
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
      const res = await fetchWithTimeout(url, { signal: AbortSignal.timeout(4000) });
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
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        signal: AbortSignal.timeout(4000)
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
   * Fetch and extract clean textual content from any target webpage URL
   * @param {string} url
   * @param {number} maxChars
   * @returns {Promise<string>}
   */
  async fetchPageText(url, maxChars = 2500) {
    try {
      const res = await fetchWithTimeout(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        signal: AbortSignal.timeout(6000)
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

      return this.cleanHtmlEntities(cleaned.slice(0, maxChars));
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
