module.exports = {
    HASH_SALT : 10,
    ALLOWED_CREATE_TAG_FIELDS: ['name'],
    ALLOWED_PAGINATION_FIELDS: ['page', 'limit'],
    ALLOWED_CREATE_POST_FIELDS: ['title', 'desc', 'image', 'tags'],
    FILE_MIME_TYPE : ['image/png', 'image/jpeg','image/jpg'],
    MIN_PAGE_VALUE : 1,
    MIN_LIMIT_VALUE: 10,
    MAX_LIMIT_VALUE : 100
}