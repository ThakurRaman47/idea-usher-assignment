const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');

afterAll(async () => {
    await mongoose.connection.close();
});

describe('Post API Tests', () => {
    it('should create a new post', async () => {
        const res = await request(app).post('/api/posts').send({
            title: 'Test Post',
            desc: 'This is a test description',
        });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
    });

    it('should return all posts with pagination', async () => {
        const res = await request(app).get('/api/posts?page=1&limit=10');

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('posts');
    });
});
