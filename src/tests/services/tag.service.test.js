const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Tag = require('../../schemas/tag.schema');
const tagService = require('../../services/tag.service');

let mongoServer;

beforeAll(async () => {
    // Start in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Tag Service', () => {
    beforeEach(async () => {
        await Tag.deleteMany(); // Clear the database before each test
    });

    test('should create a new tag successfully', async () => {
        const tagName = 'Technology';

        const tag = await tagService.createTag(tagName);

        expect(tag).toHaveProperty('name', tagName);
        expect(tag).toHaveProperty('createdAt');
    });

    test('should not create a duplicate tag', async () => {
        const tagName = 'Technology';

        await tagService.createTag(tagName);

        await expect(tagService.createTag(tagName)).rejects.toThrow('Tag already exists');
    });

    test('should check if a tag exists by name', async () => {
        const tagName = 'Sports';
        await tagService.createTag(tagName);

        const tag = await tagService.checkTagByName(tagName);

        expect(tag).toHaveProperty('name', tagName);
        expect(tag).toHaveProperty('createdAt');
    });

    test('should return null for a non-existent tag', async () => {
        const tag = await tagService.checkTagByName('NonExistentTag');

        expect(tag.name).toBeUndefined();
        expect(tag.createdAt).toBeUndefined();
    });

    test('should return tag ID when getting by name', async () => {
        const tagName = 'Health';
        const createdTag = await tagService.createTag(tagName);

        const tagId = await tagService.getTagIdByName(tagName);
        
        expect(tagId).toBeDefined();
    });

    test('should return null for non-existent tag ID', async () => {
        const tagId = await tagService.getTagIdByName('UnknownTag');

        expect(tagId).toBeUndefined();
    });

    test('should get tags with pagination', async () => {
        await tagService.createTag('Tag1');
        await tagService.createTag('Tag2');
        await tagService.createTag('Tag3');

        const result = await tagService.getTags(1, 2);

        expect(result.tags.length).toBe(2);
        expect(result.pagination).toHaveProperty('total', 3);
        expect(result.pagination).toHaveProperty('page', 1);
        expect(result.pagination).toHaveProperty('limit', 2);
    });

    test('should return empty tags if none exist', async () => {
        const result = await tagService.getTags(1, 10);

        expect(result.tags.length).toBe(0);
        expect(result.pagination.total).toBe(0);
    });
});
