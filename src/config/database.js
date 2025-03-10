const mongoose = require('mongoose');
require("dotenv").config()

// Connect to MongoDB by using the cluster url
const mongoDbUrl = process.env.MONGODB_URL

mongoose.connect(mongoDbUrl)
  .then(() => console.log('Connected to MongoDB'))
  .catch(error => console.error('Error connecting to MongoDB:', error));

module.exports = mongoose;


