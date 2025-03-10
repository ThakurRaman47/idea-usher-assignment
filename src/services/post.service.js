const Post = require('../schemas/post.schema');
const { create } = require('../schemas/tag.schema');
const { getTagIdByName, checkTagByName } = require('./tag.service');
const Tag = require('../schemas/tag.schema');

// Service function to create a post
exports.createPost = async (postData, tags) => {
    // Create a new post
    const post = await Post.create(postData);
    // Return the post data with tags
    return {
        title: post.title,
        desc: post.desc,
        imageKey: process.env.AWS_BUCKET_URL+ post.image,
        tags: tags,
        createdAt: post.createdAt
    };
};

// Service function to get tag Ids
exports.getTagIds = async (tags) => {
    try {
        const tagIds = [];
        for (const tag of tags) {
            // Get the tag ID by name
            const tagId = await getTagIdByName(tag);
            tagIds.push(tagId); 
        }
        // Return the tag IDs
        return tagIds;
    }
    catch (error) {
        throw new Error(error.message);
    }
}

// Function to get all posts with filters, sorting, and pagination
exports.getPosts = async (query) => {
    try {
        // Extract query parameters
        const { page = 1, limit = 10, sortBy = 'createdAt', order = 'desc', keyword, tag } = query;

        const filters = {};

        // Check if keyword is present
        if (keyword) {
            filters.$or = [
                { title: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } },
            ];
        }

        // Check if tag is present
        if (tag) {
            const tagId = await getTagIdByName(tag) // Find tag by name
            if (tagId) {
                filters.tags = tagId; // Use tag ID for filtering
            } else {
                filters.tags = null; 
            }
        }

        const sortOrder = order === 'asc' ? 1 : -1;

        // Aggregation with pagination and sorting
        const posts = await Post.aggregate([
            { $match: filters },
            {
                $facet: {
                    metadata: [{ $count: 'total' }, { $addFields: { page: Number(page) } }],
                    data: [
                        { $sort: { [sortBy]: sortOrder } },
                        { $skip: (page - 1) * limit },
                        { $limit: parseInt(limit) },
                        {
                            $lookup: {
                                from: 'tags',
                                localField: 'tags',
                                foreignField: '_id',
                                as: 'tags',
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                title: 1,
                                desc: 1,
                                image: { $concat: [process.env.AWS_BUCKET_URL, '/', '$image'] }, // Generate full URL
                                tags: { $map: { input: '$tags', as: 'tag', in: '$$tag.name' } }, // Extract the tag name
                                createdAt: 1,
                                description :1
                            },
                        },
                    ],
                },
            },
        ]);

        return {
            posts: posts[0].data,
            total: posts[0].metadata.length ? posts[0].metadata[0].total : 0,
            page: Number(page),
        };
    } catch (error) {
        console.error('Error in fetching Posts:', error);
        throw new Error('Failed to fetch posts');
    }
};

