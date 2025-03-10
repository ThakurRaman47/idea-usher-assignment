
const { StatusCodes } = require('http-status-codes');


const sendSuccessResponseWithData = (res, statusCode = StatusCodes.OK, message, data = {}) => {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  };

const sendSuccessResponse = (res, statusCode = StatusCodes.OK, message,) => {
    return res.status(statusCode).json({
      success: true,
      message,
    });
  };
  
const sendErrorResponseWithData = (res,statusCode = StatusCodes.INTERNAL_SERVER_ERROR, message, error = {}, ) => {
    return res.status(statusCode).json({
      success: false,
      message,
      error,
    });
  };
  

const sendErrorResponse = (res, statusCode = StatusCodes.BAD_REQUEST , message ) => {
    return res.status(statusCode).json({
      success: false,
      message,
    });
};
  
module.exports = {
    sendSuccessResponse,
    sendSuccessResponseWithData,
    sendErrorResponseWithData,
    sendErrorResponse,
};
  