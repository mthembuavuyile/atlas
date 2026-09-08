const app = require('../src/server');

module.exports = (req, res) => {
  // Reconstruct req.url from Vercel catch-all slug
  if (req.query && req.query.slug) {
    const slug = Array.isArray(req.query.slug) ? req.query.slug.join('/') : req.query.slug;
    const urlParams = new URLSearchParams();
    for (const [key, value] of Object.entries(req.query)) {
      if (key !== 'slug') {
        if (Array.isArray(value)) {
          value.forEach(v => urlParams.append(key, v));
        } else {
          urlParams.append(key, value);
        }
      }
    }
    const qs = urlParams.toString();
    req.url = '/api/' + slug + (qs ? '?' + qs : '');
  }

  return app(req, res);
};
