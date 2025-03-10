const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const { validateCreatePost, validateGetPosts } = require('../validations/post.validation');
const { upload } = require('../middlewares/multer');

router.post('/create', upload.single('image'), validateCreatePost, postController.createPost);
router.get('/list', validateGetPosts, postController.getAllPosts);

module.exports = router;