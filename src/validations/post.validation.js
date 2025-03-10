const { body, validationResult } = require('express-validator');
const response = require("../utils/response-handler");
const { StatusCodes } = require("http-status-codes");
const { ALLOWED_CREATE_POST_FIELDS, MIN_TITLE_LENGTH, MAX_TITLE_LENGTH, MAX_DESC_LENGTH } = require('../utils/constant');
const { checkTagByName } = require('../services/tag.service');
const { validationMessages } = require('../utils/message')

const validateCreatePost = [
    // Title validation: required, min 1 character, max 100 characters
    body('title')
        .notEmpty().withMessage(validationMessages.TITLE_VALIDATION_MSG)
        .isLength({ min: MIN_TITLE_LENGTH, max: MAX_TITLE_LENGTH }).withMessage(validationMessages.TITLE_CHAR_LIMIT_MSG),

    // Description validation: required, max 1000 characters
    body('description')
        .notEmpty().withMessage(validationMessages.DESCRIPTION_VALIDATION_MSG)
        .isLength({ max: MAX_DESC_LENGTH }).withMessage(validationMessages.DESCRIPTION_CHAR_LIMIT_MSG),

    // Image validation: optional, must be a string
    body('image')
        .optional()
        .isString().withMessage(validationMessages.IMAGE_VALIDATION_MSG),

    // Tags validation: optional, must be an array and should be valid
    body('tags')
        .optional()
        .isArray().withMessage(validationMessages.TAGS_VALIDATION_MSG)
        .custom(async (tags) => {
            if (!Array.isArray(tags)) {
                throw new Error(validationMessages.TAGS_VALIDATION_MSG);
            }

            for (const tagName of tags) {
                const tag = await checkTagByName(tagName);
                if (!tag) {
                    throw new Error(`Tag '${tagName}' does not exist`);
                }
            }
            return true;
        }),

    // Middleware to check for unexpected fields
    (req, res, next) => {
        const allowedFields = ALLOWED_CREATE_POST_FIELDS;
        const receivedFields = Object.keys(req.body);

        const extraFields = receivedFields.filter(field => !allowedFields.includes(field));
        if (extraFields.length > 0) {
            return response.sendErrorResponse(res, StatusCodes.BAD_REQUEST, `Unexpected fields: ${extraFields.join(', ')}`) 
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return response.sendErrorResponseWithData(res, StatusCodes.BAD_REQUEST, validationMessages.VALIDATION_MSG, errors.array());
        }

        next();
    },

];

module.exports = { validateCreatePost };
