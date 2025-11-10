const express = require('express');
const { readData, writeData, applySearchAndPagination } = require('../utils/items');
const router = express.Router();

// List items with optional search + pagination
router.get('/', async (req, res, next) => {
    try {
        const data = await readData();
        const { items, meta } = applySearchAndPagination(data, req.query);

        // Keep old behaviour when no pagination params are provided
        if (!req.query.page && !req.query.pageSize) {
            return res.json(items);
        }

        res.json({ items, meta });
    } catch (err) {
        next(err);
    }
});

// Single item lookup by id
router.get('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ message: 'Invalid id parameter' });
        }

        const data = await readData();
        const item = data.find((i) => i.id === id);

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        res.json(item);
    } catch (err) {
        next(err);
    }
});

// Create a new item
router.post('/', async (req, res, next) => {
    try {
        const payload = req.body || {};

        // Minimal validation: name must be a non-empty string
        if (typeof payload.name !== 'string' || !payload.name.trim()) {
            return res.status(400).json({ message: 'Field "name" is required.' });
        }

        // Price needs to be a number; no currency handling here on purpose
        if (typeof payload.price !== 'number' || Number.isNaN(payload.price)) {
            return res.status(400).json({ message: 'Field "price" must be a number.' });
        }

        const data = await readData();

        const item = {
            ...payload,
            // Simple unique id strategy for this demo; not suitable for multi-node setups
            id: Date.now(),
            name: payload.name.trim(),
        };

        data.push(item);
        await writeData(data);

        res.status(201).json(item);
    } catch (err) {
        next(err);
    }
});

module.exports = router;