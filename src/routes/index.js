const express = require('express');
const router = express.Router();


// Route for auth-related operations(common for mentor and mentee)

router.use('/post' , require("./post.route"));
router.use('/tag' , require("./tag.route"));

module.exports = router;