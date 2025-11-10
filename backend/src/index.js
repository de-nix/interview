const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const itemsRouter = require('./routes/items');
const statsRouter = require('./routes/stats');
const logger = require('./middleware/logger');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
const port = process.env.PORT || 3001;

// CORS is restricted to the SPA origin on purpose
app.use(cors({ origin: 'http://localhost:3000' }));
// Basic middleware
app.use(express.json());
app.use(morgan('dev'));
app.use(logger); // file-based access log

// Routes
app.use('/api/items', itemsRouter);
app.use('/api/stats', statsRouter);

// 404 + error handling should be the last middleware
app.use('*', notFound);
app.use(errorHandler);

if (require.main === module) {
    app.listen(port, () => {
        console.log('Backend running on http://localhost:' + port);
    });
}

module.exports = app;