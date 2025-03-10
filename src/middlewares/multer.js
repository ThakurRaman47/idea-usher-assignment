  const multer = require('multer');
  const multerS3 = require('multer-s3');
  const path = require('path');
  const { S3Client } = require('@aws-sdk/client-s3'); // AWS SDK v3
  const constants = require('../utils/constant');

  const s3 = new S3Client({
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    region: process.env.AWS_REGION,
  });


  // S3 storage configuration
  const storage = multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const fileExt = path.extname(file.originalname);
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
      cb(null, `uploads/${fileName}`);
  }
  });

  // Custom file filter function
  const fileFilter = (req, file, cb) => {
    // Check if the file's mimetype is in the allowed list
    if (constants.FILE_MIME_TYPE.includes(file.mimetype)) {
      cb(null, true); 
    } else {
      cb(new Error('Invalid file type. Only PNG, JPEG AND JPG'), false);
    }
  };

  exports.upload = multer({ 
    storage: storage, 
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter,  
  });

  exports.s3 = s3