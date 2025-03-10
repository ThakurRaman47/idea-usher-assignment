require("dotenv").config();
const bcrypt = require("bcrypt");
const constants = require("./constant");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const {
  DeleteObjectsCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const jwt = require("jsonwebtoken");
const { s3 } = require("../middlewares/multer");
const axios = require("axios");
const moment = require("moment-timezone");
const logsSchema = require("../schemas/logs.schema");
require("dotenv").config({ path: process.env.ENV_PATH });


// Check if the provided id is a valid mongodb object id
exports.isMongoDBObjectId = function (id) {
  return mongoose.Types.ObjectId.isValid(id);
};

exports.validator = (req, res, next) => {
  if (
    req.method !== "GET" &&
    req.method !== "DELETE" &&
    req.method !== "PATCH" &&
    ((req.method === "PUT" &&
      !req.file &&
      Object.keys(req.body).length === 0) ||
      (req.method !== "PUT" && Object.keys(req.body).length === 0))
  ) {
    return res.status(400).json({ error: "Request body cannot be empty" });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};


exports.paramValidator = (req, res, next) => {
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};


exports.limitToChars = (text) => {
  return text.length >= 30 ? text.substring(0, 30) : text;
}

exports.deleteFiles = async (keys) => {
  const deleteParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Delete: {
      Objects: keys.map((key) => ({ Key: key })),
    },
  };

  try {
    const data = await s3.send(new DeleteObjectsCommand(deleteParams));
    console.log("Successfully deleted files:", data.Deleted);
  } catch (err) {
    console.error("Error deleting files:", err);
  }
};

exports.uploadImageUrlToS3 = async (imageUrl) => {
  try {
    // Fetch the image from the URL
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });

    const extension = "jpeg";
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filePath = `profile/${uniqueSuffix}.${extension}`;

    // Create the S3 upload command
    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: filePath,
      Body: response.data,
      ContentType: "image/jpeg",
    };

    // Upload the image to S3
    const command = new PutObjectCommand(uploadParams);
    await s3.send(command);
    return filePath;
  } catch (error) {
    throw error;
  }
};