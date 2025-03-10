const mongoose = require('mongoose');
const { successMessages, errorMessages } = require('../utils/message')

// Connect to MongoDB by using the cluster url
const mongoDbUrl = process.env.MONGO_URI

// Recommended Mongoose settings for better stability
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds if the database is unreachable
};

mongoose.connect(mongoDbUrl, mongooseOptions)
  .then(() => console.log(successMessages.MONGODB_CONNECTED))
  .catch(error => console.error(errorMessages.MONGODB_ERROR, error));

module.exports = mongoose;