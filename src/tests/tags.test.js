const request = require('supertest');
const app = require('../src/app');

describe('Tag API Tests', () => {
    it('should create a new tag', async () => {
        const res = await request(app).post('/api/tags').send({ name: 'Tech' });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
    });

    it('should return all tags', async () => {
        const res = await request(app).get('/api/tags');

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });
});
