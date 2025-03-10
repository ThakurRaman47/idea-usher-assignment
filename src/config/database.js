const mongoose = require('mongoose');

// Connect to MongoDB by using the cluster url
const mongoDbUrl = process.env.MONGO_URI

mongoose.connect(mongoDbUrl)
  .then(() => console.log('Connected to MongoDB'))
  .catch(error => console.error('Error connecting to MongoDB:', error));

module.exports = mongoose;


