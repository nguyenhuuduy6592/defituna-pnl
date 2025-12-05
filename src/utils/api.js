/**
 * Fetch with timeout utility for API calls
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} [timeout=10000] - Timeout in milliseconds
 * @returns {Promise} - Fetch promise that rejects on timeout
 */
export async function fetchWithTimeout(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout}ms`);
    }
    throw error;
  }
}