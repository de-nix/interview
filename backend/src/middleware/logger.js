const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../../logs');
const LOG_FILE = path.join(LOG_DIR, 'access.log');

// Keep log directory creation here so the app doesn’t fail on first start
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Reuse a single write stream instead of opening the file per request
const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });

module.exports = (req, res, next) => {
    const now = new Date().toISOString();
    const { method, originalUrl } = req;
    const userAgent = req.headers['user-agent'] || '';
    const line = `[${now}] ${method} ${originalUrl} "${userAgent}"\n`;

    logStream.write(line);
    next();
};
