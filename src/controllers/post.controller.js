const {successMessages, errorMessages} = require("../utils/message")
const response = require("../utils/response-handler");
const { StatusCodes } = require("http-status-codes")
const postService = require("../services/post.service");


exports.createPost = async (req, res) => {
    try {
        // extract data from the request body
        const { title, description, image, tags } = req.body;
        const imagekey = req.file ? req.file.key : null;

        // get all tag ids from the tag names
        const tagIds = await postService.getTagIds(tags);

        // create a new post
        const post = await postService.createPost({ title, description, image, tags: tagIds, image: imagekey }, tags);
        if (!post) {
            return response.sendErrorResponse(res, StatusCodes.BAD_REQUEST, errorMessages.SOMETHING_WRONG);
        }
        // return created post to the client
        return response.sendSuccessResponseWithData(
            res, 
            StatusCodes.CREATED,
            successMessages.POST_CREATED, 
            post
        );
    } catch (error) {
        console.log(error)
        return response.sendErrorResponse(res, error?.statusCode ?? StatusCodes.INTERNAL_SERVER_ERROR , error.message);
    }
}

exports.getAllPosts = async (req, res) => {
    try {
        // extract data from the request query
        const { page, limit, sortBy, sortOrder, keyword, tag} = req.query;

        // get all posts from the database
        const postsData = await postService.getPosts({ page, limit, sortBy, sortOrder, keyword, tag });

        // return all posts to the client
        return response.sendSuccessResponseWithData(
            res, 
            StatusCodes.OK,
            successMessages.POST_FETCHED, 
            postsData
        );
    } catch (error) {
        return response.sendErrorResponse(res, error?.statusCode ?? StatusCodes.INTERNAL_SERVER_ERROR , error.message);
    }
}
