module.exports = {
    HASH_SALT : 10,
    ALLOWED_CREATE_TAG_FIELDS: ['name'],
    ALLOWED_PAGINATION_FIELDS: ['page', 'limit'],
    ALLOWED_CREATE_POST_FIELDS: ['title', 'desc', 'image', 'tags'],
    FILE_MIME_TYPE : ['image/png', 'image/jpeg','image/jpg'],
    MIN_PAGE_VALUE : 1,
    MIN_LIMIT_VALUE: 10,
    MAX_LIMIT_VALUE : 100,
    MIN_TITLE_LENGTH : 1,
    MAX_TITLE_LENGTH : 100,
    MAX_DESC_LENGTH : 1000,
    MIN_TAG_NAME_LENGTH : 1,
}