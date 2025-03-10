const Tag = require('../schemas/tag.schema');
const { errorMessages } = require('../utils/message');

// Service function to create a tag
exports.createTag = async (name) => {
    const existingTag = await Tag.findOne({ name });
    if (existingTag) {
        throw new Error(errorMessages.TAG_EXISTS);
    }
    return await Tag.create({ name });
};

// Servive function to check if a tag exists by name
exports.checkTagByName = async (name) => {
    try {
        return await Tag.findOne({ name: name.trim() });
    } catch (error) {
        throw new Error(error.message);
    }
};

// Service function to get tags with pagination
exports.getTags = async (page = 1, limit = 10) => {
    try {
        const skip = (page - 1) * limit;

        const result = await Tag.aggregate([
            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [{ $skip: skip }, { $limit: limit }]
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
