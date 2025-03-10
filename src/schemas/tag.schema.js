const mongoose = require('mongoose');

const TagSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            maxLength : 50
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Tag', TagSchema);
