const fs = require('fs/promises');
const path = require('path');
const DATA_PATH = path.join(__dirname, '../../../data/items.json');

// Simple in-memory cache for computed stats
let cachedStats = null;
let cachedMtimeMs = null;

/**
 * Compute stats from the items file.
 * This is intentionally isolated from caching so it stays easy to test.
 */
async function computeStats() {
    const raw = await fs.readFile(DATA_PATH, 'utf8');
    const items = JSON.parse(raw);
    const prices = items.map((i) => Number(i.price) || 0);

    return {
        total: items.length,
        averagePrice: prices.length ? mean(prices) : 0,
    };
}

/**
 * Return stats, reusing a cached value when the underlying file
 * has not changed (based on mtime).
 */
async function getStatsWithCache() {
    // Ask the OS for the file’s metadata
    const stat = await fs.stat(DATA_PATH);
    const mtimeMs = stat.mtimeMs;

    // If we have a cached value and the file timestamp is unchanged, reuse it
    if (cachedStats && cachedMtimeMs === mtimeMs) {
        return cachedStats;
    }

    // Otherwise recompute from disk and update the cache
    const stats = await computeStats();
    cachedStats = stats;
    cachedMtimeMs = mtimeMs;
    return stats;
}

function mean(arr) {
    if (!arr.length) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

module.exports = { getStatsWithCache };
