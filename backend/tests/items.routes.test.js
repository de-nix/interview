const request = require('supertest');

// IMPORTANT: mock fs/promises before requiring the app
// This keeps the tests fast and avoids touching the real filesystem.
jest.mock('fs/promises', () => ({
    readFile: jest.fn(),
    writeFile: jest.fn(),
    stat: jest.fn(),
}));

const fs = require('fs/promises');
const app = require('../src/index'); // adjust path if needed

describe('Items routes', () => {
    const mockItems = [
        { id: 1, name: 'Apple', price: 1.5 },
        { id: 2, name: 'Banana', price: 2.0 },
    ];

    beforeEach(() => {
        // Default mocks: successful read/write and a stable mtime
        fs.readFile.mockResolvedValue(JSON.stringify(mockItems));
        fs.writeFile.mockResolvedValue();
        fs.stat.mockResolvedValue({ mtimeMs: 123 });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('GET /api/items returns all items', async () => {
        const res = await request(app).get('/api/items');

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(mockItems);
        expect(fs.readFile).toHaveBeenCalled();
    });

    test('GET /api/items applies search filter (q param)', async () => {
        const res = await request(app)
            .get('/api/items')
            .query({ q: 'app' });

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual([mockItems[0]]);
    });

    test('GET /api/items/:id returns matching item', async () => {
        const res = await request(app).get('/api/items/1');

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(mockItems[0]);
    });

    test('GET /api/items/:id returns 404 when not found', async () => {
        const res = await request(app).get('/api/items/999');

        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual({ message: 'Item not found' });
    });

    test('GET /api/items/:id returns 400 on invalid id', async () => {
        const res = await request(app).get('/api/items/not-a-number');

        expect(res.statusCode).toBe(400);
        expect(res.body).toEqual({ message: 'Invalid id parameter' });
    });

    test('POST /api/items validates payload (missing name)', async () => {
        const res = await request(app)
            .post('/api/items')
            .send({ price: 10 });

        expect(res.statusCode).toBe(400);
        expect(res.body).toEqual({ message: 'Field "name" is required.' });
        expect(fs.writeFile).not.toHaveBeenCalled();
    });

    test('POST /api/items persists valid item', async () => {
        const payload = { name: 'Cherry', price: 3.0 };

        const res = await request(app)
            .post('/api/items')
            .send(payload);

        expect(res.statusCode).toBe(201);
        expect(res.body).toMatchObject(payload);
        expect(typeof res.body.id).toBe('number');

        // Ensure writeFile contains new item
        const [, writtenJson] = fs.writeFile.mock.calls[0];
        const writtenItems = JSON.parse(writtenJson);

        expect(writtenItems).toHaveLength(mockItems.length + 1);
        expect(writtenItems.some((i) => i.name === 'Cherry')).toBe(true);
    });

    test('GET /api/items returns 500 when readFile fails', async () => {
        fs.readFile.mockRejectedValueOnce(new Error('Disk error'));

        const res = await request(app).get('/api/items');

        expect(res.statusCode).toBe(500);
        expect(res.body).toEqual({ message: 'Disk error' });
    });
});
