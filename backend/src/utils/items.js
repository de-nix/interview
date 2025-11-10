const fs = require('fs/promises');
const path = require('path');
const DATA_PATH = path.join(__dirname, '../../../data/items.json');

/**
 * Load the full list of items from disk.
 * Asynchronous on purpose so the API does not block the event loop.
 */
async function readData() {
    const raw = await fs.readFile(DATA_PATH, 'utf8');
    return JSON.parse(raw);
}

/**
 * Persist the full list back to disk.
 * In a real app you’d typically swap this for a database.
 */
async function writeData(data) {
    await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
}

/**
 * Shared search + pagination helper used by the items route and tests.
 */
function applySearchAndPagination(items, query) {
    let { q, page, pageSize } = query;

    // Search (case-insensitive substring on name)
    let filtered = items;
    if (q) {
        const qLower = q.toLowerCase();
        filtered = filtered.filter((item) =>
            String(item.name || '').toLowerCase().includes(qLower)
        );
    }

    // If no pagination params are provided, keep backwards behaviour:
    if (!page && !pageSize) {
        return {
            items: filtered,
            meta: {
                total: filtered.length,
                page: 1,
                pageSize: filtered.length,
                totalPages: 1,
            },
        };
    }

    const pageNum = Math.max(1, parseInt(page || '1', 10));
    const size = Math.max(1, parseInt(pageSize || '20', 10));

    const start = (pageNum - 1) * size;
    const end = start + size;
    const pagedItems = filtered.slice(start, end);

    return {
        items: pagedItems,
        meta: {
            total: filtered.length,
            page: pageNum,
            pageSize: size,
            totalPages: Math.max(1, Math.ceil(filtered.length / size)),
        },
    };
}

module.exports = { applySearchAndPagination, readData, writeData };