const { test, describe } = require('node:test');
const assert = require('node:assert');
const { CURATED_MODELS } = require('../src/config/models.config');
const app = require('../src/server');

describe('Models Configuration & Strict Fidelity', () => {
  test('Curated models array is defined and contains valid models', () => {
    assert.ok(Array.isArray(CURATED_MODELS));
    assert.ok(CURATED_MODELS.length > 0, 'Must have at least one curated model');

    for (const model of CURATED_MODELS) {
      assert.ok(model.id, `Model missing id`);
      assert.ok(model.name, `Model ${model.id} missing name`);
      assert.ok(model.badge, `Model ${model.id} missing badge`);

      // STRICT UI FIDELITY: Badges must NEVER contain the word "FREE"
      assert.ok(
        !model.badge.toUpperCase().includes('FREE'),
        `Model badge "${model.badge}" for ${model.id} must NOT contain "FREE"`
      );
    }
  });

  test('GET /api/models returns curated models over HTTP', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/models`);
      assert.strictEqual(response.status, 200);
      const data = await response.json();
      assert.ok(Array.isArray(data.models), 'Response should contain models array');
      assert.strictEqual(data.models.length, CURATED_MODELS.length);
      assert.strictEqual(typeof data.hasApiKey, 'boolean');
    } finally {
      server.close();
    }
  });
});
