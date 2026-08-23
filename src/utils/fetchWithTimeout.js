/**
 * Helper utility to perform a fetch request with a timeout.
 * @param {string} url The URL to fetch
 * @param {object} options Fetch options
 * @param {number} timeoutMs Timeout in milliseconds
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
        ...options,
        signal: controller.signal
    });
    
    clearTimeout(id);
    return response;
}

module.exports = { fetchWithTimeout };
