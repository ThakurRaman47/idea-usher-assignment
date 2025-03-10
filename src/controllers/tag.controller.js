const { successMessages, errorMessages} = require("../utils/message")
const response = require("../utils/response-handler");
const { StatusCodes } = require("http-status-codes")
const tagService = require("../services/tag.service");

exports.createTag = async (req, res) => {
    try {
        // extract data from the request body
        const { name } = req.body;

        // create a new tag
        const tag = await tagService.createTag(name);
        if (!tag) {
            return response.sendErrorResponse(res, StatusCodes.BAD_REQUEST, errorMessages.SOMETHING_WRONG);
        }

        // return created tag to the client
        return response.sendSuccessResponseWithData(
            res, 
            StatusCodes.CREATED, 
            successMessages.TAG_CREATED, 
            tag
        );

    } catch (error) {
        console.log(error)
        return response.sendErrorResponse(res, error?.statusCode ?? StatusCodes.INTERNAL_SERVER_ERROR , error.message);
    }
};

exports.getTagList = async (req, res) => {
    try {
        // extract data from the request query
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // get all tags from the database
        const result = await tagService.getTags(page, limit);

        // return all tags to the client
        return response.sendSuccessResponseWithData(
            res,
            StatusCodes.OK,
            successMessages.TAGS_FETCHED,
            result
        );
    } catch (error) {
        console.log(error)
        return response.sendErrorResponse(res, error?.statusCode ?? StatusCodes.INTERNAL_SERVER_ERROR , error.message);
    }
}
