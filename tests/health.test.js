const { test, describe } = require('node:test');
const assert = require('node:assert');
const app = require('../src/server');

describe('Health Controller & Server Integrity', () => {
  test('GET /api/health returns status ok and valid structure', async () => {
    // Start an ephemeral listener to test HTTP response
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
});
