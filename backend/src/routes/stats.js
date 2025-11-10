const express = require('express');
const { getStatsWithCache } = require('../utils/stats');

const router = express.Router();

// Lightweight wrapper around stats helper to keep the route small
router.get('/', async (req, res, next) => {
    try {
        const stats = await getStatsWithCache();
        res.json(stats);
    } catch (err) {
        next(err);
    }
});

module.exports = router;