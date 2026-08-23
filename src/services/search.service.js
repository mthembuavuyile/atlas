/**
 * Atlas Web Search & Real-Time Grounding Engine
 * ─────────────────────────────────────────────────────────────
 * Zero-config, 100% free web search provider using DuckDuckGo
 * HTML endpoints and safe webpage text extraction.
 */

class SearchService {
  /**
   * Search the web for a query and return structured organic results
   * @param {string} query
   * @param {number} maxResults
   * @returns {Promise<Array<{title: string, snippet: string, url: string}>>}
   */
  async searchWeb(query, maxResults = 5) {
    if (!query || typeof query !== 'string' || !query.trim()) {
      return [];
    }

    try {
      const cleanQuery = query.trim().slice(0, 200);
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(cleanQuery)}`;

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        }
      });

      if (!res.ok) {
        throw new Error(`Search provider returned HTTP ${res.status}`);
      }

      const html = await res.text();
      const results = [];

      // Primary extraction using DDG web-result blocks
      const resultBlockRegex = /<div class="result results_links results_links_deep web-result[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g;
      const blocks = html.match(resultBlockRegex) || [];

      for (const block of blocks) {
        if (results.length >= maxResults) break;

        const titleMatch = block.match(/<a[^>]+class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/) ||
                           block.match(/<a[^>]+class="result__snippet[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/) ||
                           block.match(/<a[^>]+class="result__url[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);

        const snippetMatch = block.match(/<a class="result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/) ||
                             block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\//);

        if (titleMatch) {
          let rawUrl = titleMatch[1];
          if (rawUrl.includes('uddg=')) {
            const uddgMatch = rawUrl.match(/uddg=([^&]+)/);
            if (uddgMatch) {
              rawUrl = decodeURIComponent(uddgMatch[1]);
            }
          }

          const rawTitle = titleMatch[2].replace(/<[^>]+>/g, '').trim();
          const rawSnippet = snippetMatch ? snippetMatch[1].replace(/<[^>]+>/g, '').trim() : '';

          if (rawUrl && rawTitle && !rawUrl.startsWith('/')) {
            results.push({
              title: this.cleanHtmlEntities(rawTitle),
              snippet: this.cleanHtmlEntities(rawSnippet),
              url: rawUrl
            });
          }
        }
      }

      // Fallback regex if HTML layout shifts
      if (results.length === 0) {
        const fallbackRegex = /<a class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
        let m;
        while ((m = fallbackRegex.exec(html)) !== null && results.length < maxResults) {
          let rawUrl = m[1];
          if (rawUrl.includes('uddg=')) {
            const u = rawUrl.match(/uddg=([^&]+)/);
            if (u) rawUrl = decodeURIComponent(u[1]);
          }
          results.push({
            title: this.cleanHtmlEntities(m[2].replace(/<[^>]+>/g, '').trim()),
            snippet: this.cleanHtmlEntities(m[3].replace(/<[^>]+>/g, '').trim()),
            url: rawUrl
          });
        }
      }

      return results;
    } catch (err) {
      console.warn('[SearchService Warning]:', err.message);
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
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        signal: AbortSignal.timeout(8000)
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const html = await res.text();

      // Strip head, scripts, styles, navigation, footer
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
   * Format grounding search results into a clean system context injection
   * @param {Array<{title: string, snippet: string, url: string}>} results
   * @param {string} query
   * @returns {string}
   */
  formatGroundingContext(results, query) {
    if (!results || results.length === 0) {
      return '';
    }

    let context = `[REAL-TIME INTERNET SEARCH GROUNDING]\n`;
    context += `Search Query: "${query}"\n`;
    context += `Timestamp: ${new Date().toUTCString()}\n\n`;
    context += `Verified Live Web Sources:\n`;

    results.forEach((item, index) => {
      context += `${index + 1}. [${item.title}](${item.url})\n`;
      if (item.snippet) {
        context += `   Summary: ${item.snippet}\n`;
      }
      context += `\n`;
    });

    context += `INSTRUCTIONS FOR GROUNDED RESPONSE:\n`;
    context += `- Synthesize your answer using the real-time search context above.\n`;
    context += `- Cite your sources using standard Markdown links [Source Title](URL).\n`;
    context += `- If the search results do not contain relevant details, state what was found objectively.\n`;

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
