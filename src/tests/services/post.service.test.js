const { createPost, getTagIds, getPosts } = require('../../services/post.service');
const { getTagIdByName } = require('../../services/tag.service');
const Post = require('../../schemas/post.schema');
const mongoose = require('mongoose');

jest.mock('../../schemas/post.schema'); // Mock the Post model
jest.mock('../../services/tag.service'); // Mock tag service functions


describe('Post Service Tests', () => {

    describe('createPost', () => {
        it('should create a new post and return correct response', async () => {
            // Mock post data
            const mockPostData = { title: 'Test Post', desc: 'Description', image: 'imageKey.jpg' };
            const mockTags = ['Technology', 'Science'];

            // Mock the create method of Post model
            Post.create.mockResolvedValue({
                ...mockPostData,
                createdAt: new Date(),
            });

            // Call the function
            const result = await createPost(mockPostData, mockTags);

            // Expectations
            expect(Post.create).toHaveBeenCalledWith(mockPostData);
            expect(result).toHaveProperty('title', mockPostData.title);
            expect(result).toHaveProperty('desc', mockPostData.desc);
            expect(result).toHaveProperty('imageKey', `${process.env.AWS_BUCKET_URL}${mockPostData.image}`);
            expect(result).toHaveProperty('tags', mockTags);
            expect(result).toHaveProperty('createdAt');
        });
    });

    describe('getTagIds', () => {
        it('should return an array of tag IDs for valid tag names', async () => {
            // Mock tag names and IDs
            const mockTags = ['Tech', 'AI'];
            const mockTagIds = [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()];

            // Mock the getTagIdByName function
            getTagIdByName.mockImplementation(async (tag) => {
                return mockTags.includes(tag) ? mockTagIds[mockTags.indexOf(tag)] : null;
            });

            // Call the function
            const result = await getTagIds(mockTags);

            // Expectations
            expect(getTagIdByName).toHaveBeenCalledTimes(mockTags.length);
            expect(result).toEqual(mockTagIds);
        });

        it('should throw an error if a tag lookup fails', async () => {
            getTagIdByName.mockRejectedValue(new Error('Database error'));

            await expect(getTagIds(['Tech']))
                .rejects.toThrow('Database error');
        });
    });

    describe('getPosts', () => {
        it('should return paginated and sorted posts with correct data', async () => {
            // Mock aggregation response
            const mockAggregationResult = [{
                metadata: [{ total: 2, page: 1 }],
                data: [
                    { title: 'Post 1', desc: 'Desc 1', image: 'image1.jpg', tags: ['Tech'], createdAt: new Date() },
                    { title: 'Post 2', desc: 'Desc 2', image: 'image2.jpg', tags: ['AI'], createdAt: new Date() },
                ]
            }];

            // Mock the aggregate function
            Post.aggregate.mockResolvedValue(mockAggregationResult);

            // Call the function
            const query = { page: 1, limit: 2, sortBy: 'createdAt', order: 'desc' };
            const result = await getPosts(query);

            // Expectations
            expect(Post.aggregate).toHaveBeenCalled();
            expect(result).toHaveProperty('posts');
            expect(result.posts).toHaveLength(2);
            expect(result).toHaveProperty('total', 2);
            expect(result).toHaveProperty('page', 1);
        });

        it('should return an empty list if no posts are found', async () => {
            Post.aggregate.mockResolvedValue([{ metadata: [], data: [] }]);

            const result = await getPosts({ page: 1, limit: 2 });

            expect(result.posts).toEqual([]);
            expect(result.total).toBe(0);
        });

        it('should handle errors properly', async () => {
            Post.aggregate.mockRejectedValue(new Error('Database error'));

            await expect(getPosts({ page: 1, limit: 2 }))
                .rejects.toThrow('Failed to fetch posts');
        });
    });

});
