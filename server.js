const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const { SERVER_RUNNING } = require('./src/utils/message');
require('dotenv').config({ path: process.env.ENV_PATH });

require('./src/middlewares/multer')

// Connect to MongoDB by using the cluster url
require('./src/config/db/mongodb')

// Configuration of the morgan to logs the incoming requests
app.use(morgan('tiny'));

// Configuration of the cors policies
app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// Configure the index route file
app.use('/v1', require('./src/routes'));

app.use("/ping" , (req , res) =>{
    return res.status(200).json({ message : SERVER_RUNNING})
})

// Server configuration
const port = process.env.PORT || 3000;
app.listen(port,(req, res) => {
    console.log(`Server is running on port ${port}`);
});