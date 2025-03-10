const Tag = require('../schemas/tag.schema');
const { errorMessages } = require('../utils/message');

// Service function to create a tag
exports.createTag = async (name) => {
    const existingTag = await Tag.findOne({ name });
    if (existingTag) {
        throw new Error(errorMessages.TAG_EXISTS);
    }
    const tag = await Tag.create({ name });
    return { name : tag.name, createdAt :tag.createdAt}
};

// Servive function to check if a tag exists by name
exports.checkTagByName = async (name) => {
    try {
        const tag = await Tag.findOne({ name: name.trim() });
        return { name : tag?.name, createdAt :tag?.createdAt}
    } catch (error) {
        throw new Error(error.message);
    }
};

exports.getTagIdByName = async (name) => {
    try {
        const tag = await Tag.findOne({ name: name.trim() });
        return tag?._id;
    } catch (error) {
        throw new Error(error.message);
    }
}

// Service function to get tags with pagination
exports.getTags = async (page = 1, limit = 10) => {
    try {
        const skip = (page - 1) * limit;

        const result = await Tag.aggregate([
            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [
                        { $skip: skip }, 
                        { $limit: limit },
                        { $project: { _id: 0, name: 1, createdAt :1 } }
                    ]
                }
            }
        ]);

        const total = result[0]?.metadata.length ? result[0].metadata[0].total : 0;
        const totalPages = Math.ceil(total / limit);

        return {
            tags: result[0].data,
            pagination: {
                total,
                page,
                limit,
                totalPages
            }
        };
    } 
    catch (error) {
        throw new Error(error.message);
    }
};
