const validationMessages = {
    TITLE_VALIDATION_MSG : 'Title is required',
    TITLE_CHAR_LIMIT_MSG : 'Title must be between 1 and 100 characters',
    DESCRIPTION_VALIDATION_MSG : 'Description is required',
    DESCRIPTION_CHAR_LIMIT_MSG : 'Description must be at most 1000 characters',
    IMAGE_VALIDATION_MSG : 'Image is required',
    TAGS_VALIDATION_MSG : 'Tags must be an array',
    TAG_NAME_VALIDATION_MSG : 'Tag name is required',
    TAG_NAME_CHAR_LIMIT_MSG : 'Tag name must be between 1 and 50 characters',
    UNEXPECTED_FIELDS_MSG : 'Unexpected fields',
    VALIDATION_MSG : 'Validation failed',
    PAGE_VALIDATION_MSG : 'Page must be a positive integer',
    LIMIT_VALIDATION_MSG : 'Limit must be between 1 and 100',
}

const ErrorMessages = {
    INTERNAL_SERVER_ERROR : 'Internal server error',
    MONGODB_ERROR : 'Error connecting to MongoDB',
    SOMETHING_WRONG: 'Something went wrong',
    NOT_FOUND : 'Not found',
    BAD_REQUEST : 'Bad request',
    UNAUTHORIZED : 'Unauthorized',
    FORBIDDEN : 'Forbidden',
    CONFLICT : 'Conflict',
}

const successMessages = {
    SERVER_RUNNING : 'Server is running',
    MONGODB_CONNECTED : 'Connected to MongoDB',
    POST_CREATED : 'Post created successfully',
    POST_LIST: 'Posts fetched successfully',
    TAG_CREATED : 'Tag created successfully',
    TAGS_FETCHED : 'Tags fetched successfully',
}

module.exports = {
    validationMessages,
    ErrorMessages,
    successMessages
}