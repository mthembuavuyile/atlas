/**
 * Helper utility to perform a fetch request with a timeout.
 * @param {string} url The URL to fetch
 * @param {object} options Fetch options
 * @param {number} timeoutMs Timeout in milliseconds
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
    const timeout = options.timeoutMs || timeoutMs;

    // If caller provides their own signal, use it directly (avoid creating unused controllers)
    if (options.signal) {
        try {
            const response = await fetch(url, options);
            return response;
        } catch (err) {
            throw err;
        }
    }

    // Otherwise, create our own timeout-based abort controller
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        return response;
    } finally {
        clearTimeout(id);
    }
}

module.exports = { fetchWithTimeout };
