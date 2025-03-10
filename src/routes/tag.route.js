const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tag.controller');
const { validateCreateTag, validateListTags } = require('../validations/tag.validation');


router.post('/create', validateCreateTag, tagController.createTag);
router.get('/list', validateListTags, tagController.getTagList);

module.exports = router;