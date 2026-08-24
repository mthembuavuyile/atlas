/**
 * Helper utility to perform a fetch request with a timeout.
 * @param {string} url The URL to fetch
 * @param {object} options Fetch options
 * @param {number} timeoutMs Timeout in milliseconds
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
    const controller = new AbortController();
    const timeout = options.timeoutMs || timeoutMs;
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: options.signal || controller.signal
        });
        return response;
    } finally {
        clearTimeout(id);
    }
}

module.exports = { fetchWithTimeout };
