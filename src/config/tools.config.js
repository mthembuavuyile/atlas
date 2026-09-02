const ATLAS_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_current_time',
      description: 'Get the exact live time, date, day of week, and timezone information for any location or timezone.',
      parameters: {
        type: 'object',
        properties: {
          timezone: { type: 'string', description: 'City name, country, or IANA timezone string, e.g. "Africa/Johannesburg", "Durban", "Tokyo", "London", "New York", "UTC".' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'convert_units',
      description: 'Convert values between units of measurement (length, weight/mass, temperature, speed, area, volume, digital storage).',
      parameters: {
        type: 'object',
        properties: {
          value: { type: 'number', description: 'The numeric quantity to convert.' },
          from: { type: 'string', description: 'Source unit symbol or name (e.g. "km", "miles", "kg", "lbs", "C", "F", "m/s", "km/h", "litres", "gallons", "MB", "GB").' },
          to: { type: 'string', description: 'Target unit symbol or name (e.g. "miles", "km", "lbs", "kg", "F", "C", "km/h", "m/s", "gallons", "litres", "GB", "MB").' }
        },
        required: ['value', 'from', 'to']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_places',
      description: 'Search for places, local businesses, addresses, attractions, or landmarks using OpenStreetMap.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Place, landmark, or business category, e.g. "coffee shop", "library", "Durban beachfront".' },
          near: { type: 'string', description: 'Optional city or locality filter, e.g. "Durban", "Johannesburg", "Cape Town".' }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'fetch_webpage',
      description: 'Fetch and extract clean readable text or markdown from a specific target webpage URL.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'The full URL of the webpage to read (e.g. "https://en.wikipedia.org/wiki/Quantum_computing").' }
        },
        required: ['url']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get current weather for a city or location',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: 'City name, e.g. "Durban"' }
        },
        required: ['city']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_crypto_price',
      description: 'Get real-time cryptocurrency price',
      parameters: {
        type: 'object',
        properties: {
          coin: { type: 'string', description: 'Coin name or symbol, e.g. "bitcoin", "ETH"' }
        },
        required: ['coin']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_bible_verse',
      description: 'Get a Bible verse. Can be a specific verse (e.g. "John 3:16") or random.',
      parameters: {
        type: 'object',
        properties: {
          reference: { type: 'string', description: 'Specific book and verse, or leave empty for a random verse.' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_images',
      description: 'Search for existing images or photos of a specific subject on the internet.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'What to search for, e.g. "nebula", "cat"' }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'generate_image',
      description: 'Generate a completely new, AI-generated image based on a prompt. Use this when the user asks to "create", "make", "draw", or "generate" an image.',
      parameters: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'A highly detailed visual description of the image to generate.' },
          aspect_ratio: { type: 'string', description: 'The aspect ratio for the image, e.g. "1:1", "16:9", "9:16", "3:2". Defaults to 1:1 if omitted.' }
        },
        required: ['prompt']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_news_headlines',
      description: 'Get latest general news headlines for a topic, region, technology area, or current event.',
      parameters: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: 'Optional topic or region, e.g. "technology", "South Africa", "AI", "world". Leave empty for top headlines.' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_space_news',
      description: 'Get the latest spaceflight, NASA, and astronomy news.',
      parameters: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: 'Optional topic like "SpaceX", "NASA", "Mars". Leave empty for general news.' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_reddit_posts',
      description: 'Get trending or hot posts from a specific Reddit community (subreddit).',
      parameters: {
        type: 'object',
        properties: {
          subreddit: { type: 'string', description: 'Subreddit name without r/, e.g. "technology", "news"' }
        },
        required: ['subreddit']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'define_word',
      description: 'Get the dictionary definition of a word.',
      parameters: {
        type: 'object',
        properties: {
          word: { type: 'string', description: 'The word to define.' }
        },
        required: ['word']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'convert_currency',
      description: 'Convert an amount from one currency to another.',
      parameters: {
        type: 'object',
        properties: {
          amount: { type: 'number', description: 'The amount to convert.' },
          from: { type: 'string', description: '3-letter currency code to convert from, e.g. USD, EUR, ZAR.' },
          to: { type: 'string', description: '3-letter currency code to convert to, e.g. USD, EUR, ZAR.' }
        },
        required: ['amount', 'from', 'to']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'solve_math',
      description: 'Solve a mathematical equation or perform a mathematical operation (derive, integrate, simplify, factor, etc).',
      parameters: {
        type: 'object',
        properties: {
          expression: { type: 'string', description: 'The mathematical expression, e.g. "x^2 + 2x", "2x - 8 = 0"' },
          operation: { type: 'string', description: 'The operation to perform: simplify, factor, derive, integrate, zeroes, tangent, area, cos, sin, tan, arccos, arcsin, arctan, abs, log, expand, limit, solve.' }
        },
        required: ['expression']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'tell_joke',
      description: 'Tell a random joke.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'give_advice',
      description: 'Give a random piece of life advice or wisdom.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'scan_ocr',
      description: 'Open the OCR (Optical Character Recognition) modal to scan text from an image or camera.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'scan_qr',
      description: 'Open the QR Code Scanner modal to read a QR code using the device camera or by uploading an image.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'generate_qr',
      description: 'Generate a branded, high-resolution QR code for a given URL or text string. ALWAYS use this tool when the user asks for a QR code. NEVER attempt to generate QR codes using markdown images or raw SVGs.',
      parameters: {
        type: 'object',
        properties: {
          data: { type: 'string', description: 'The URL or text to encode into the QR code.' }
        },
        required: ['data']
      }
    }
  }
];

module.exports = { ATLAS_TOOLS };
