const Post = require('../schemas/post.schema');

// Service function to create a post
const createPost = async (postData) => {
    const newPost = await Post.create(postData);
};

module.exports = { createPost };
