const {successMessages, errorMessages} = require("../utils/message")
const response = require("../utils/response-handler");
const { StatusCodes } = require("http-status-codes")
const postService = require("../services/post.service");
const { validateTags } = require("../services/tag.service");


exports.createPost = async (req, res) => {
    try {
        const { title, desc, image, tags } = req.body;

        const post = await createPost({ title, desc, image, tags });
        if (!post) {
            return response.sendErrorResponse(res, StatusCodes.BAD_REQUEST, errorMessages.SOMETHING_WRONG);
        }

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