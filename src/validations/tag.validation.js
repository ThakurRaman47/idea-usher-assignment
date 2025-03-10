const { body, validationResult } = require('express-validator');
const { ALLOWED_CREATE_TAG_FIELDS, ALLOWED_PAGINATION_FIELDS, MIN_PAGE_VALUE, MIN_LIMIT_VALUE, MAX_LIMIT_VALUE } = require('../utils/constant');
const { validationMessages } = require('../utils/message')

const validateCreateTag = [
    // Tag name Validation: required, min 1 character, max 50 characters
    body('name')
        .notEmpty().withMessage(validationMessages.TAG_NAME_VALIDATION_MSG)
        .isLength({ min: 1, max: 50 }).withMessage(validationMessages.TAG_NAME_CHAR_LIMIT_MSG),
        
    (req, res, next) => {
        const allowedFields = ALLOWED_CREATE_TAG_FIELDS;
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

const validateListTags = [
    // Pagination Validation: page and limit should be positive integers
    query('page')
        .optional()
        .isInt({ min: MIN_PAGE_VALUE })
        .withMessage(validationMessages.PAGE_VALIDATION_MSG),

    query('limit')
        .optional()
        .isInt({ min: MIN_LIMIT_VALUE, max: MAX_LIMIT_VALUE })
        .withMessage(validationMessages.LIMIT_VALIDATION_MSG),

    (req, res, next) => {
        const allowedFields = ALLOWED_PAGINATION_FIELDS;
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
    }
];

module.exports = { 
    validateCreateTag,
    validateListTags
 };
