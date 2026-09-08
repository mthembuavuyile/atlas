const { test, describe } = require('node:test');
const assert = require('node:assert');
const app = require('../src/server');

describe('Public Pages Architecture & Layout Standardization', () => {
  test('Static stylesheets legal.css and error.css serve valid CSS assets', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const resLegal = await fetch(`http://127.0.0.1:${port}/css/legal.css`);
      assert.strictEqual(resLegal.status, 200);
      assert.ok(resLegal.headers.get('content-type').includes('text/css'));
      const textLegal = await resLegal.text();
      assert.ok(textLegal.includes('.legal-content'));
      assert.ok(textLegal.includes('.legal-card'));

      const resError = await fetch(`http://127.0.0.1:${port}/css/error.css`);
      assert.strictEqual(resError.status, 200);
      assert.ok(resError.headers.get('content-type').includes('text/css'));
      const textError = await resError.text();
      assert.ok(textError.includes('.error-hero'));
      assert.ok(textError.includes('.error-badge'));
    } finally {
      server.close();
    }
  });

  test('GET /about follows standardized HTML structure with modular CSS and responsive nav', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const response = await fetch(`http://127.0.0.1:${port}/about`);
      assert.strictEqual(response.status, 200);
      const html = await response.text();

      // Modular CSS links
      assert.ok(html.includes('<link rel="stylesheet" href="/css/site-common.css">'));
      assert.ok(html.includes('<link rel="stylesheet" href="/css/about.css">'));
      assert.ok(html.includes('<script src="/js/site-nav.js" defer></script>'));

      // Standard Accessibility & Header Landmarks
      assert.ok(html.includes('class="skip-to-content"'));
      assert.ok(html.includes('id="mainContent"'));
      assert.ok(html.includes('class="site-header"'));
      assert.ok(html.includes('id="siteBurgerBtn"'));
      assert.ok(html.includes('class="burger-box"'));
      assert.ok(html.includes('id="siteBackdropOverlay"'));
      assert.ok(html.includes('id="siteMobileDrawer"'));
      assert.ok(html.includes('class="site-footer"'));
    } finally {
      server.close();
    }
  });

  test('GET /docs follows standardized HTML structure and main landmark', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const response = await fetch(`http://127.0.0.1:${port}/docs`);
      assert.strictEqual(response.status, 200);
      const html = await response.text();

      assert.ok(html.includes('<link rel="stylesheet" href="/css/site-common.css">'));
      assert.ok(html.includes('<link rel="stylesheet" href="/css/docs.css">'));
      assert.ok(html.includes('<a href="#mainContent" class="skip-to-content">'));
      assert.ok(html.includes('id="mainContent"'));
      assert.ok(html.includes('id="siteBurgerBtn"'));
      assert.ok(html.includes('id="siteMobileDrawer"'));
      assert.ok(html.includes('class="site-footer"'));
    } finally {
      server.close();
    }
  });

  test('GET /privacy uses modular legal.css and eliminates inline duplicate CSS', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const response = await fetch(`http://127.0.0.1:${port}/privacy`);
      assert.strictEqual(response.status, 200);
      const html = await response.text();

      // Verifies modular legal stylesheet is loaded
      assert.ok(html.includes('<link rel="stylesheet" href="/css/site-common.css">'));
      assert.ok(html.includes('<link rel="stylesheet" href="/css/legal.css">'));

      // Verifies duplicate inline style block was eliminated
      assert.ok(!html.includes('<style>'), 'Should not contain inline duplicate <style> tag');

      // Standard header, burger button, and drawer
      assert.ok(html.includes('class="site-nav-links"'));
      assert.ok(html.includes('class="burger-box"'));
      assert.ok(html.includes('id="siteBurgerBtn"'));
      assert.ok(html.includes('id="siteMobileDrawer"'));
      assert.ok(html.includes('class="mobile-drawer-links"'));
      assert.ok(html.includes('class="site-footer"'));
    } finally {
      server.close();
    }
  });

  test('GET /terms uses modular legal.css and eliminates inline duplicate CSS', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const response = await fetch(`http://127.0.0.1:${port}/terms`);
      assert.strictEqual(response.status, 200);
      const html = await response.text();

      assert.ok(html.includes('<link rel="stylesheet" href="/css/site-common.css">'));
      assert.ok(html.includes('<link rel="stylesheet" href="/css/legal.css">'));
      assert.ok(!html.includes('<style>'), 'Should not contain inline duplicate <style> tag');

      assert.ok(html.includes('class="site-nav-links"'));
      assert.ok(html.includes('class="burger-box"'));
      assert.ok(html.includes('id="siteBurgerBtn"'));
      assert.ok(html.includes('id="siteMobileDrawer"'));
      assert.ok(html.includes('class="mobile-drawer-links"'));
      assert.ok(html.includes('class="site-footer"'));
    } finally {
      server.close();
    }
  });

  test('GET /404 returns 404 status and links modular error.css', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const response = await fetch(`http://127.0.0.1:${port}/404`);
      assert.strictEqual(response.status, 404);
      const html = await response.text();

      assert.ok(html.includes('<link rel="stylesheet" href="/css/site-common.css">'));
      assert.ok(html.includes('<link rel="stylesheet" href="/css/error.css">'));
      assert.ok(!html.includes('href="/css/about.css"'), '404 should use error.css, not about.css');

      assert.ok(html.includes('id="siteBurgerBtn"'));
      assert.ok(html.includes('id="siteMobileDrawer"'));
      assert.ok(html.includes('class="site-footer"'));
    } finally {
      server.close();
    }
  });
});
