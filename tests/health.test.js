const { test, describe } = require('node:test');
const assert = require('node:assert');
const app = require('../src/server');

describe('Health Controller & Server Integrity', () => {
  test('GET /api/health returns status ok and valid structure', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`);
      assert.strictEqual(response.status, 200);
      const data = await response.json();
      assert.strictEqual(data.status, 'ok');
      assert.ok(data.timestamp, 'Should have timestamp');
      assert.ok(data.service, 'Should have service identifier');
    } finally {
      server.close();
    }
  });

  test('GET /health returns status ok through root mounting', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`);
      assert.strictEqual(response.status, 200);
      const data = await response.json();
      assert.strictEqual(data.status, 'ok');
    } finally {
      server.close();
    }
  });

  test('GET /api/chat returns operational API metadata', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/chat`);
      assert.strictEqual(response.status, 200);
      const data = await response.json();
      assert.ok(data.message.includes('API is operational'));
      assert.ok(Array.isArray(data.availableModes));
    } finally {
      server.close();
    }
  });

  test('POST /api/widget/execute executes widget tool successfully', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/widget/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'convert_units',
          args: { value: 10, from: 'km', to: 'miles' }
        })
      });
      assert.strictEqual(response.status, 200);
      const data = await response.json();
      assert.strictEqual(data.type, 'unit');
      assert.ok(data.data.result);
    } finally {
      server.close();
    }
  });

  test('GET /favicon.ico and /favicon.svg serve valid assets', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const icoRes = await fetch(`http://127.0.0.1:${port}/favicon.ico`);
      assert.strictEqual(icoRes.status, 200);

      const svgRes = await fetch(`http://127.0.0.1:${port}/favicon.svg`);
      assert.strictEqual(svgRes.status, 200);
      const svgText = await svgRes.text();
      assert.ok(svgText.includes('<svg'));
    } finally {
      server.close();
    }
  });
});
