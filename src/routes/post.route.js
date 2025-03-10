const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const { validateCreatePost } = require('../validations/post.validation');
const { upload } = require('../middlewares/multer');

router.post('/create', validateCreatePost, upload.single('image'), postController.createPost);

module.exports = router;