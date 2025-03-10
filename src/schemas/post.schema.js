const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxLength: 100,
            minLength: 1,
        },
        description: {
            type: String,
            required: true,
            trim: true,
            maxLength: 1000,
        },
        image: {
            type: String,
            required: false,
        },
        tags: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Tag',
            },
        ],
    },
    { timestamps: true }
);

module.exports = mongoose.model('Post', PostSchema);