const { fetchWithTimeout } = require('../../utils/fetchWithTimeout');
const cache = require('../../utils/cache');

const OMDB_API_KEY = process.env.OMDB_API_KEY || '798172ac';

const schema = {
  type: 'function',
  function: {
    name: 'get_movie_info',
    description: 'Get detailed movie metadata, IMDb rating, cast, plot, and poster when the user asks about a film or movie.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Title of the movie to search, e.g. "Interstellar", "Oppenheimer", "The Matrix"'
        }
      },
      required: ['title']
    }
  }
};

async function execute(args = {}) {
  const title = (args.title || '').trim();
  if (!title) {
    return { error: 'Movie title is required.' };
  }

  const cacheKey = `movie:${title.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${OMDB_API_KEY}&plot=full`;
    const res = await fetchWithTimeout(url, {}, 6000);
    const data = await res.json();

    if (data.Response === 'False') {
      return { error: data.Error || `Movie "${title}" not found.` };
    }

    const result = {
      type: 'movie',
      data: {
        title: data.Title,
        year: data.Year,
        rated: data.Rated,
        runtime: data.Runtime,
        genre: data.Genre,
        director: data.Director,
        actors: data.Actors,
        plot: data.Plot,
        poster: data.Poster && data.Poster !== 'N/A' ? data.Poster : null,
        imdbRating: data.imdbRating,
        imdbVotes: data.imdbVotes,
        boxOffice: data.BoxOffice && data.BoxOffice !== 'N/A' ? data.BoxOffice : null,
        imdbID: data.imdbID
      }
    };

    // Cache movies for 24 hours (86400s) as metadata is static
    cache.set(cacheKey, result, 86400);
    return result;
  } catch (err) {
    console.error('[Movie Capability Error]:', err.message);
    return { error: `Failed to fetch movie information for "${title}".` };
  }
}

module.exports = {
  name: 'get_movie_info',
  domain: 'media',
  schema,
  execute,
  slashCommand: 'movie'
};
