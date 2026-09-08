const { test, describe } = require('node:test');
const assert = require('node:assert');
const app = require('../src/server');

describe('SEO, Sitemap & Public Discovery Integrity', () => {
  test('GET /robots.txt returns valid crawling directives and sitemap URL', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const response = await fetch(`http://127.0.0.1:${port}/robots.txt`);
      assert.strictEqual(response.status, 200);
      assert.ok(response.headers.get('content-type').includes('text/plain'));
      const text = await response.text();
      assert.ok(text.includes('User-agent: *'));
      assert.ok(text.includes('Disallow: /api/'));
      assert.ok(text.includes('Sitemap: https://vylex.co.za/sitemap.xml'));
    } finally {
      server.close();
    }
  });

  test('GET /sitemap.xml returns valid XML containing all key site routes', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const response = await fetch(`http://127.0.0.1:${port}/sitemap.xml`);
      assert.strictEqual(response.status, 200);
      assert.ok(response.headers.get('content-type').includes('xml'));
      const text = await response.text();
      assert.ok(text.includes('<urlset'));
      assert.ok(text.includes('<loc>https://vylex.co.za/</loc>'));
      assert.ok(text.includes('<loc>https://vylex.co.za/docs</loc>'));
      assert.ok(text.includes('<loc>https://vylex.co.za/about</loc>'));
      assert.ok(text.includes('<loc>https://vylex.co.za/privacy</loc>'));
      assert.ok(text.includes('<loc>https://vylex.co.za/terms</loc>'));
    } finally {
      server.close();
    }
  });

  test('GET /privacy returns 200 with valid canonical tag and structured data', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const response = await fetch(`http://127.0.0.1:${port}/privacy`);
      assert.strictEqual(response.status, 200);
      const html = await response.text();
      assert.ok(html.includes('<link rel="canonical" href="https://vylex.co.za/privacy">'));
      assert.ok(html.includes('https://vylex.co.za/atlas-og-image.jpg'));
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
      assert.ok(html.includes('<link rel="canonical" href="https://vylex.co.za/terms">'));
      assert.ok(html.includes('https://vylex.co.za/atlas-og-image.jpg'));
      assert.ok(html.includes('Terms of Service'));
      assert.ok(html.includes('MIT License'));
      assert.ok(html.includes('Republic of South Africa'));
    } finally {
      server.close();
    }
  });

  test('GET / and /about contain Sitelinks Schema.org structured data', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const resHome = await fetch(`http://127.0.0.1:${port}/`);
      assert.strictEqual(resHome.status, 200);
      const htmlHome = await resHome.text();
      assert.ok(htmlHome.includes('"SiteNavigationElement"'));
      assert.ok(htmlHome.includes('Vylex builds AI powered apps'));
      assert.ok(htmlHome.includes('https://vylex.co.za/about'));
      assert.ok(htmlHome.includes('https://vylex.co.za/docs'));

      const resAbout = await fetch(`http://127.0.0.1:${port}/about`);
      assert.strictEqual(resAbout.status, 200);
      const htmlAbout = await resAbout.text();
      assert.ok(htmlAbout.includes('<link rel="canonical" href="https://vylex.co.za/about">'));
      assert.ok(htmlAbout.includes('https://vylex.co.za/atlas-og-image.jpg'));
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
