/**
 * Central Capability Registry & Tool Dispatcher
 * ─────────────────────────────────────────────────────────────
 * Unifies all modular capabilities and legacy tools into a single,
 * plug-and-play architecture for LLM tool calling, SSE streaming,
 * and deterministic widget endpoints.
 */

const movieCapability = require('./media/movie.capability');
const discoverMoviesCapability = require('./media/discover-movies.capability');
const stockCapability = require('./finance/stock.capability');
const cryptoCapability = require('./finance/crypto.capability');
const searchCapability = require('./core/search.capability');
const { LEGACY_TOOLS } = require('./legacy-bridge');

// Registry of modular capability modules
const CAPABILITY_MODULES = [
  movieCapability,
  discoverMoviesCapability,
  stockCapability,
  cryptoCapability,
  searchCapability
];

// Map of capability handlers keyed by tool name
const CAPABILITY_DISPATCHER = {};
CAPABILITY_MODULES.forEach(cap => {
  CAPABILITY_DISPATCHER[cap.name] = (args) => cap.execute(args);
});

// Full unified dispatcher map (Modular Capabilities + Legacy Bridge)
const UNIFIED_DISPATCHER = {
  ...LEGACY_TOOLS,
  ...CAPABILITY_DISPATCHER
};

class CapabilityRegistry {
  /**
   * Get all registered capability schemas (used to augment ATLAS_TOOLS)
   */
  getCapabilitySchemas() {
    return CAPABILITY_MODULES.map(cap => cap.schema);
  }

  /**
   * Get the unified dispatcher object for chat.controller and widget.controller
   */
  getDispatcherMap() {
    return UNIFIED_DISPATCHER;
  }

  /**
   * Execute any registered tool by name
   * @param {string} toolName
   * @param {object} args
   * @returns {Promise<object>}
   */
  async execute(toolName, args = {}) {
    const handler = UNIFIED_DISPATCHER[toolName];
    if (typeof handler !== 'function') {
      return { error: `Unknown tool: ${toolName}` };
    }

    try {
      return await handler(args);
    } catch (err) {
      console.error(`[Capability Execution Error] ${toolName}:`, err.message);
      return { error: `Execution error in ${toolName}: ${err.message || 'Internal failure'}` };
    }
  }
}

const capabilityRegistry = new CapabilityRegistry();

module.exports = {
  capabilityRegistry,
  UNIFIED_DISPATCHER,
  CAPABILITY_MODULES
};
