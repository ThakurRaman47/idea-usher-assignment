const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const { validateCreatePost } = require('../validations/post.validation');
const { upload } = require('../middlewares/multer');

router.post('/create', upload.single('image'), validateCreatePost, postController.createPost);

module.exports = router;