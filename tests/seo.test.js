const { test, describe } = require('node:test');
const assert = require('node:assert');
const app = require('../src/server');
const { generateSitemapXml, ROUTES } = require('../scripts/generate-sitemap');

describe('SEO, Sitemap & Public Discovery Integrity', () => {
  test('GET /robots.txt returns valid crawling directives and canonical sitemap URL', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const response = await fetch(`http://127.0.0.1:${port}/robots.txt`);
      assert.strictEqual(response.status, 200);
      assert.ok(response.headers.get('content-type').includes('text/plain'));
      const text = await response.text();
      assert.ok(text.includes('User-agent: *'));
      assert.ok(text.includes('Disallow: /api/'));
      assert.ok(text.includes('Sitemap: https://atlas.vylex.co.za/sitemap.xml'));
      assert.ok(text.includes('Host: https://atlas.vylex.co.za'));
    } finally {
      server.close();
    }
  });

  test('GET /sitemap.xml returns valid XML containing all key site routes under atlas.vylex.co.za', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const response = await fetch(`http://127.0.0.1:${port}/sitemap.xml`);
      assert.strictEqual(response.status, 200);
      assert.ok(response.headers.get('content-type').includes('xml'));
      const text = await response.text();
      assert.ok(text.includes('<urlset'));
      assert.ok(text.includes('<loc>https://atlas.vylex.co.za/</loc>'));
      assert.ok(text.includes('<loc>https://atlas.vylex.co.za/docs</loc>'));
      assert.ok(text.includes('<loc>https://atlas.vylex.co.za/about</loc>'));
      assert.ok(text.includes('<loc>https://atlas.vylex.co.za/atlas</loc>'));
      assert.ok(text.includes('<loc>https://atlas.vylex.co.za/privacy</loc>'));
      assert.ok(text.includes('<loc>https://atlas.vylex.co.za/terms</loc>'));
    } finally {
      server.close();
    }
  });

  test('generateSitemapXml produces standard-compliant XML matching all routes', () => {
    const xml = generateSitemapXml('https://atlas.vylex.co.za');
    assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
    assert.ok(xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'));
    ROUTES.forEach(route => {
      const expectedLoc = route.path === '/'
        ? 'https://atlas.vylex.co.za/'
        : `https://atlas.vylex.co.za${route.path}`;
      assert.ok(xml.includes(`<loc>${expectedLoc}</loc>`), `Should include ${expectedLoc}`);
    });
  });

  test('GET /privacy returns 200 with valid canonical tag and structured data', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const response = await fetch(`http://127.0.0.1:${port}/privacy`);
      assert.strictEqual(response.status, 200);
      const html = await response.text();
      assert.ok(html.includes('<link rel="canonical" href="https://atlas.vylex.co.za/privacy">'));
      assert.ok(html.includes('<meta name="robots" content="index, follow'));
      assert.ok(html.includes('https://atlas.vylex.co.za/atlas-og-image.jpg'));
      assert.ok(html.includes('Privacy Policy'));
      assert.ok(html.includes('POPIA'));
      assert.ok(html.includes('Vylex Technologies'));
    } finally {
      server.close();
    }
  });

  test('GET /terms returns 200 with valid canonical tag and licensing terms', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const response = await fetch(`http://127.0.0.1:${port}/terms`);
      assert.strictEqual(response.status, 200);
      const html = await response.text();
      assert.ok(html.includes('<link rel="canonical" href="https://atlas.vylex.co.za/terms">'));
      assert.ok(html.includes('<meta name="robots" content="index, follow'));
      assert.ok(html.includes('https://atlas.vylex.co.za/atlas-og-image.jpg'));
      assert.ok(html.includes('Terms of Service'));
      assert.ok(html.includes('MIT License'));
      assert.ok(html.includes('Republic of South Africa'));
    } finally {
      server.close();
    }
  });

  test('GET / and /about contain Sitelinks Schema.org structured data with atlas domain', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const resHome = await fetch(`http://127.0.0.1:${port}/`);
      assert.strictEqual(resHome.status, 200);
      const htmlHome = await resHome.text();
      assert.ok(htmlHome.includes('"SiteNavigationElement"'));
      assert.ok(htmlHome.includes('Vylex builds AI powered apps'));
      assert.ok(htmlHome.includes('https://atlas.vylex.co.za/about'));
      assert.ok(htmlHome.includes('https://atlas.vylex.co.za/docs'));
      assert.ok(htmlHome.includes('<link rel="canonical" href="https://atlas.vylex.co.za/">'));
      assert.ok(htmlHome.includes('<meta name="robots" content="index, follow'));

      const resAbout = await fetch(`http://127.0.0.1:${port}/about`);
      assert.strictEqual(resAbout.status, 200);
      const htmlAbout = await resAbout.text();
      assert.ok(htmlAbout.includes('<link rel="canonical" href="https://atlas.vylex.co.za/about">'));
      assert.ok(htmlAbout.includes('<meta name="robots" content="index, follow'));
      assert.ok(htmlAbout.includes('https://atlas.vylex.co.za/atlas-og-image.jpg'));
    } finally {
      server.close();
    }
  });

  test('GET /404 sets noindex, nofollow and omits canonical tag', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const response = await fetch(`http://127.0.0.1:${port}/404`);
      assert.strictEqual(response.status, 404);
      const html = await response.text();
      assert.ok(html.includes('<meta name="robots" content="noindex, nofollow">'));
      assert.ok(!html.includes('rel="canonical"'), '404 page should not have a canonical link');
    } finally {
      server.close();
    }
  });

  test('GET /atlas-og-image.jpg serves valid social preview image asset', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const response = await fetch(`http://127.0.0.1:${port}/atlas-og-image.jpg`);
      assert.strictEqual(response.status, 200);
      const buffer = await response.arrayBuffer();
      assert.ok(buffer.byteLength > 10000, 'Image should be non-trivial size');
    } finally {
      server.close();
    }
  });
});
