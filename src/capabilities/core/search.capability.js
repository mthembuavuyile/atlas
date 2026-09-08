/**
 * Autonomous Live Web Search Capability
 * Allows the AI to search the internet whenever external or real-time grounding is needed.
 */

const searchService = require('../../services/search.service');

const schema = {
  type: 'function',
  function: {
    name: 'search_web',
    description: 'Search the live internet for real-time information, breaking news, upcoming release calendars, current facts, or whenever external web grounding is needed.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query to look up on the live internet.'
        }
      },
      required: ['query']
    }
  }
};

async function execute(args = {}) {
  const query = (args.query || '').trim();
  if (!query) {
    return { error: 'Search query is required.' };
  }

  try {
    const results = await searchService.searchWeb(query, 5);
    return {
      type: 'web_search_results',
      data: {
        query,
        count: results.length,
        results: results.map(r => ({
          title: r.title,
          snippet: r.snippet,
          url: r.url,
          source: r.source
        }))
      }
    };
  } catch (err) {
    console.error('[Search Capability Error]:', err.message);
    return { error: `Web search failed for "${query}": ${err.message}` };
  }
}

module.exports = {
  name: 'search_web',
  domain: 'core',
  schema,
  execute,
  slashCommand: 'websearch'
};
