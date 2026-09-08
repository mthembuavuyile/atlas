/**
 * Movie Discovery & Curated Collections Capability
 * Provides movie suggestions, franchise collections, and upcoming release slates.
 */

const { fetchWithTimeout } = require('../../utils/fetchWithTimeout');
const cache = require('../../utils/cache');
const searchService = require('../../services/search.service');

const OMDB_API_KEY = process.env.OMDB_API_KEY || '798172ac';

// Authoritative curated slate for confirmed 2026 theatrical tentpoles
const SLATE_2026 = [
  {
    title: 'Avengers: Doomsday',
    year: '2026',
    releaseDate: 'May 1, 2026',
    director: 'Anthony & Joe Russo',
    studio: 'Marvel Studios',
    genre: 'Action, Sci-Fi, Adventure',
    plot: 'The Avengers assemble across the multiverse to confront Victor Von Doom (Robert Downey Jr.).',
    cast: 'Robert Downey Jr., Benedict Cumberbatch, Pedro Pascal',
    poster: 'https://m.media-amazon.com/images/M/MV5BNGE0YTVjNzUtNzJjOS00NGNlLTgxMzctZTY4YTE1Y2Y1ZTU4XkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg',
    status: 'Confirmed Release'
  },
  {
    title: 'The Batman Part II',
    year: '2026',
    releaseDate: 'October 2, 2026',
    director: 'Matt Reeves',
    studio: 'DC Studios / Warner Bros.',
    genre: 'Action, Crime, Drama',
    plot: 'Bruce Wayne continues his vigilante crusade into the deeper corruption and criminal underworld of Gotham City.',
    cast: 'Robert Pattinson, Colin Farrell, Andy Serkis, Jeffrey Wright',
    poster: 'https://m.media-amazon.com/images/M/MV5BMDdmMTBiNTYtMGMzYS00ODg0LTgwNTMtMmU0MDQ2OGNmZjRhXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg',
    status: 'Confirmed Release'
  },
  {
    title: 'Star Wars: The Mandalorian & Grogu',
    year: '2026',
    releaseDate: 'May 22, 2026',
    director: 'Jon Favreau',
    studio: 'Lucasfilm / Disney',
    genre: 'Sci-Fi, Action, Adventure',
    plot: 'Din Djarin and his young apprentice Grogu embark on a new feature-film journey across the outer rim of the galaxy.',
    cast: 'Pedro Pascal, Sigourney Weaver',
    poster: 'https://m.media-amazon.com/images/M/MV5BYjRkYzAzNjktZmRhMy00NjRiLWE0OTMtYmRmMTE5NDkzY2NlXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg',
    imdbID: 'tt30825738',
    status: 'Confirmed Release'
  },
  {
    title: 'Supergirl: Woman of Tomorrow',
    year: '2026',
    releaseDate: 'June 26, 2026',
    director: 'Craig Gillespie',
    studio: 'DC Studios',
    genre: 'Action, Sci-Fi, Adventure',
    plot: 'Kara Zor-El travels the cosmos with Krypto on a sci-fi revenge journey across alien worlds.',
    cast: 'Milly Alcock, Matthias Schoenaerts, Eve Ridley',
    poster: 'https://m.media-amazon.com/images/M/MV5BMmJkOTE0MWUtY2E5OS00NzEyLWI4NjEtYzQzYzFmMjk5ODE3XkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg',
    imdbID: 'tt8814476',
    status: 'Confirmed Release'
  },
  {
    title: 'Spider-Man 4',
    year: '2026',
    releaseDate: 'July 24, 2026',
    director: 'Destin Daniel Cretton',
    studio: 'Sony Pictures / Marvel Studios',
    genre: 'Action, Adventure, Sci-Fi',
    plot: 'Peter Parker navigates a new era in New York following the multiversal spell, facing street-level and cosmic threats.',
    cast: 'Tom Holland, Zendaya',
    poster: 'https://m.media-amazon.com/images/M/MV5BOWNjYWM3NWItOGE0ZS00MWRjLThiZWEtYjc4ZmNmMmU5ZTVmXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg',
    imdbID: 'tt22084616',
    status: 'Slated Release'
  },
  {
    title: 'Toy Story 5',
    year: '2026',
    releaseDate: 'June 19, 2026',
    director: 'Andrew Stanton',
    studio: 'Pixar Animation Studios',
    genre: 'Animation, Adventure, Comedy',
    plot: 'Woody, Buzz, and the gang confront the ultimate modern challenge: kids obsession with electronics and tablet screens.',
    cast: 'Tom Hanks, Tim Allen',
    poster: 'https://m.media-amazon.com/images/M/MV5BZTI1YTBiNmEtYWUxZi00YzFkLWIzNjMtMmZjMmY2NzM0ZWMzXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg',
    imdbID: 'tt29355505',
    status: 'Confirmed Release'
  },
  {
    title: 'Shrek 5',
    year: '2026',
    releaseDate: 'July 10, 2026',
    director: 'Walt Dohrn',
    studio: 'DreamWorks Animation',
    genre: 'Animation, Adventure, Comedy',
    plot: 'Shrek, Donkey, and Princess Fiona return for a brand-new adventure in the kingdom of Far Far Away.',
    cast: 'Mike Myers, Eddie Murphy, Cameron Diaz',
    poster: 'https://m.media-amazon.com/images/M/MV5BNmNkNmRkNDAtOTMzNC00MWYzLWJhNjMtYjNkZTNjODVhOTg2XkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg',
    imdbID: 'tt6113186',
    status: 'Confirmed Release'
  },
  {
    title: 'Dune: Messiah',
    year: '2026',
    releaseDate: 'December 2026 (Targeted)',
    director: 'Denis Villeneuve',
    studio: 'Legendary / Warner Bros.',
    genre: 'Sci-Fi, Drama, Adventure',
    plot: 'Twelve years into Paul Atreides reign as Emperor, holy war rages across the known universe as conspiracies threaten Arrakis.',
    cast: 'Timothée Chalamet, Zendaya, Florence Pugh, Anya Taylor-Joy',
    poster: 'https://m.media-amazon.com/images/M/MV5BZTJkYjdmYjYtOGMyNC00ZGU1LThkY2ItYTc1OTVlMmE2YWY1XkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg',
    status: 'In Development'
  }
];

const schema = {
  type: 'function',
  function: {
    name: 'discover_movies',
    description: 'Discover, suggest, or list movies based on release year (e.g. 2026, 2025), genre, franchise, or user recommendations (e.g. "2026 movies", "upcoming releases", "sci-fi movies like Interstellar"). ALWAYS call this tool when the user asks for movie recommendations or upcoming films for a year.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query, theme, or franchise, e.g. "upcoming releases", "Christopher Nolan", "marvel", "sci-fi"'
        },
        year: {
          type: 'string',
          description: 'Release year, e.g. "2026", "2025"'
        },
        genre: {
          type: 'string',
          description: 'Optional genre filter, e.g. "sci-fi", "action", "animation"'
        }
      }
    }
  }
};

async function execute(args = {}) {
  const query = (args.query || '').trim();
  const year = (args.year || (query.match(/\b(202[4-9]|2030)\b/)?.[1]) || '').trim();
  const genre = (args.genre || '').trim().toLowerCase();

  const cacheKey = `discover_movies:${query.toLowerCase()}:${year}:${genre}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  // 1. If 2026 is requested or implied, serve the authoritative slate
  if (year === '2026' || /\b2026\b/.test(query)) {
    let filtered = SLATE_2026;
    if (genre) {
      filtered = filtered.filter(m => m.genre.toLowerCase().includes(genre));
      if (filtered.length === 0) filtered = SLATE_2026;
    }

    const result = {
      type: 'movie_collection',
      data: {
        title: '2026 Major Theatrical Release Slate',
        query: query || '2026 movies',
        year: '2026',
        total: filtered.length,
        movies: filtered
      }
    };

    cache.set(cacheKey, result, 86400); // 24 hr cache
    return result;
  }

  // 2. Query OMDb search for general movie discovery (e.g. director, franchise, keywords)
  const searchQuery = query || genre || 'action';
  try {
    const url = `https://www.omdbapi.com/?s=${encodeURIComponent(searchQuery)}&type=movie${year ? `&y=${encodeURIComponent(year)}` : ''}&apikey=${OMDB_API_KEY}`;
    const res = await fetchWithTimeout(url, {}, 6000);
    const data = await res.json();

    if (data.Response !== 'False' && Array.isArray(data.Search) && data.Search.length > 0) {
      const items = data.Search.slice(0, 8).map(m => ({
        title: m.Title,
        year: m.Year,
        imdbID: m.imdbID,
        poster: m.Poster && m.Poster !== 'N/A' ? m.Poster : null,
        type: m.Type,
        status: m.Year
      }));

      const result = {
        type: 'movie_collection',
        data: {
          title: `Movie Suggestions: ${searchQuery}`,
          query: searchQuery,
          year: year || null,
          total: items.length,
          movies: items
        }
      };

      cache.set(cacheKey, result, 43200);
      return result;
    }
  } catch (err) {
    console.warn('[Discover Movies Error]:', err.message);
  }

  // 3. Fallback to 2026 curated slate if search returned empty
  const fallback = {
    type: 'movie_collection',
    data: {
      title: 'Upcoming Theatrical Releases',
      query: searchQuery,
      year: year || '2026',
      total: SLATE_2026.length,
      movies: SLATE_2026
    }
  };

  cache.set(cacheKey, fallback, 43200);
  return fallback;
}

module.exports = {
  name: 'discover_movies',
  domain: 'media',
  schema,
  execute,
  slashCommand: 'movies'
};
