const Post = require('../schemas/post.schema');
const { create } = require('../schemas/tag.schema');
const { getTagIdByName } = require('./tag.service');

// Service function to create a post
exports.createPost = async (postData, tags) => {
    const post = await Post.create(postData);
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
            const tagId = await getTagIdByName(tag);
            tagIds.push(tagId); 
        }
        return tagIds;
    }
    catch (error) {
        throw new Error(error.message);
    }
}
