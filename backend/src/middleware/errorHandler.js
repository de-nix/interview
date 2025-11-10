// Fallback for unmatched routes
const notFound = (req, res, next) => {
    res.status(404).json({ message: 'Route Not Found' });
};

// Centralised error handler so routes can just call next(err)
const errorHandler = (err, req, res, next) => {
    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    // Avoid noisy logs inside the test suite
    if (process.env.NODE_ENV !== 'test') {
        console.error(err);
    }

    res.status(statusCode).json({ message });
};

module.exports = { notFound, errorHandler };
