const Tag = require('../schemas/tag.schema');

// Service function to create a tag
exports.createTag = async (name) => {
    const existingTag = await Tag.findOne({ name });
    if (existingTag) {
        throw new Error('Tag already exists');
    }
    return await Tag.create({ name });
};

exports.checkTagByName = async (name) => {
    try {
        // Find tag by name
        return await Tag.findOne({ name: name.trim() });
    } catch (error) {
        throw new Error(error.message);
    }
};

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
