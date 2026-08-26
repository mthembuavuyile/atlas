/**
 * Atlas In-Memory TTL Cache Engine
 * ─────────────────────────────────────────────────────────────
 * Ultra-lightweight, zero-dependency in-memory cache with
 * time-to-live (TTL) expiry and automatic periodic pruning.
 */

class MemoryCache {
  constructor(defaultTtlSeconds = 300) {
    this.defaultTtl = defaultTtlSeconds * 1000;
    this.cache = new Map();

    // Prune stale entries every 5 minutes
    if (typeof setInterval !== 'undefined') {
      this.cleanupTimer = setInterval(() => this.prune(), 5 * 60 * 1000);
      if (this.cleanupTimer.unref) {
        this.cleanupTimer.unref();
      }
    }
  }

  /**
   * Set a cached value with optional custom TTL
   * @param {string} key
   * @param {*} value
   * @param {number} [ttlSeconds]
   */
  set(key, value, ttlSeconds) {
    if (!key) return;
    const ttl = (ttlSeconds !== undefined ? ttlSeconds * 1000 : this.defaultTtl);
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Get a cached value if present and unexpired
   * @param {string} key
   * @returns {*|null}
   */
  get(key) {
    if (!key) return null;
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Check if an active key exists in cache
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Delete a key from cache
   * @param {string} key
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Remove all stale expired entries
   */
  prune() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear the entire cache
   */
  clear() {
    this.cache.clear();
  }
}

module.exports = new MemoryCache(300);
