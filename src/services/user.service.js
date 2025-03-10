const User = require("../schemas/users.schema");
const helpers = require('../common/helper');
const constants = require("../common/constant")
const messages = require("../common/messages")
const CustomError = require("../common/error");
const moment = require('moment');
const userNotificationService = require("../services/user-notification.service")
const skillServices = require("../services/skill.service")
const helpRequestService = require("../services/mentee.service")
const { StatusCodes } = require("http-status-codes");
const { default: mongoose } = require("mongoose");
const { s3 } = require("../middlewares/multer");
const { createNotification } = require("./user-notification.service");
const Feedback = require('../schemas/feedback.schema')
const Notification = require('../schemas/notifications.schema');
const { sendFirebaseNotification } = require("../firebase/firebase");
const feedbackSchema = require("../schemas/feedback.schema");


exports.findUserByEmail =  async function (email) {
    return await User.findOne({email})
}

exports.findUserByCond = async function(cond) {
    return await User.findOne(cond).lean()
}

exports.createUser = async function (user,session = null){
    try{
        if(session){
            return (await User.create([user], { session }))[0].toObject()
        }
        return (await User.create(user)).toObject()
    }
    catch(error){
        throw new CustomError(messages.USER_NOT_REGISTERED, StatusCodes.BAD_REQUEST);
    }
   
}

exports.updateUser = async function (condition , payload ){
    return await User.updateOne(condition , { $set : payload })
}

exports.findAndUpdateUser = async function (condition , payload ){
    return await User.findOneAndUpdate(condition , { $set : payload } , { new : true }).lean()
}

exports.login = async (bodyPayload) => {
    try{

        let { linkedInId , email } = bodyPayload;

        // Find the user by email
        const userInput ={
            linkedInId,
            ...(email && { email : email })
        }
    
        // check if user exist or not 
        let user = await User.findOne(userInput).lean()
        if (!user) {
           return await this.registerUser(bodyPayload)
        }

        const notificationSetting = await userNotificationService.findOneNotification({ userId : user._id })
    
        if(!notificationSetting){
            throw new CustomError(messages.NOTIFICATION_RECORD_NOT_FOUND, StatusCodes.BAD_REQUEST);
        }

        const token = await helpers.generateJwtToken({
            userId: user._id,
        });
    
        return {
            userDetail: { ...user , notificationSetting },
            token: token,
        };

    }
    catch(error){
        throw error; 
    }
};

exports.loginWithSocials = async(options) => {
    let user;
    if(options?.appleId || options?.facebookId || options?.googleId) {
        const socialInput = {
            ...(options?.email ? { email : options?.email } : {}),
            ...(options?.appleId ? { appleId : options?.appleId } : {}),
            ...(options?.googleId ? { googleId : options?.googleId } : {}),
            ...(options?.facebookId ? { facebookId : options?.facebookId } : {})
        }
        user = await this.findUserByCond(socialInput)
    }

    if(!user) {
        const socialInput = {
            email : options?.email,
            fullName : options?.fullName,
            ...(options?.appleId ? { appleId : options?.appleId } : {}),
            ...(options?.googleId ? { googleId : options?.googleId } : {}),
            ...(options?.facebookId ? { facebookId : options?.facebookId } : {})
        }
        user = await this.createUser(socialInput)
    }

    const jwtRequest = {
        userId: user._id,
    };
    const token = await helpers.generateJwtToken(jwtRequest);
    delete user?.password
    return {
        userDetail: user,
        token: token,
    };
}

exports.registerUser = async (userDetails) => {
    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {

    if(userDetails?.profileImage){
        const profileImage = await helpers.uploadImageUrlToS3(userDetails?.profileImage)
        userDetails.profileImage = profileImage
    }

    // Save user to the database
    const createdUser = await this.createUser({ ...userDetails } ,session);

    if(createdUser){
        const getTimeRangeInUtcTimestamps = helpers.getTimeRangeInUtcTimestamps(userDetails.timeZone)
        
        const createInput = {
            skills: (await skillServices.getSkillListIds()) || [],
            isDefaultSkills : true,
            userId : createdUser._id,
            timeSlots :[ 
                {
                    startTime : getTimeRangeInUtcTimestamps?.startTimeTimestamp,
                    endTime : getTimeRangeInUtcTimestamps?.endTimeTimestamp,
                }
            ]
        }
        const notificationSetting = await userNotificationService.createNotification(createInput , session)
        if(!notificationSetting){
            throw new CustomError(messages.NOTIFICATION_RECORD_NOT_FOUND, StatusCodes.BAD_REQUEST);
        }
        const token = await helpers.generateJwtToken({ userId: createdUser._id})

        // Commit the transaction
        await session.commitTransaction();
        session.endSession();

        return {
            userDetail: { ...createdUser , notificationSetting },
            token: token,
        };
    }

    throw new CustomError(messages.USER_NOT_REGISTERED, StatusCodes.BAD_REQUEST);

    }
    catch(error){

      // Rollback the transaction in case of an error
      await session.abortTransaction();
      session.endSession();
      throw error; 
    }

};

exports.findUserById =  async function (id) {
    return await User.findOne({ _id : id }).lean()
}

exports.updateUserDetail = async (userId , payload) => {
      
    const userDetail = await this.findUserById(userId)
    if(!userDetail){
        throw new CustomError(messages.USER_NOT_FOUND, StatusCodes.BAD_REQUEST);
    }

    if(payload?.profileImage && userDetail?.profileImage){
        await helpers.deleteFiles([userDetail?.profileImage])
    }

    if(payload?.enableNotification){
        await userNotificationService.updateNotification({ userId : userDetail?._id }, { enableNotification : payload?.enableNotification })
    }
    
    delete payload?.enableNotification

    const updatedUser = await this.updateUser({ _id : userDetail?._id } , payload)
    if(!updatedUser){
        throw new CustomError(messages.USER_NOT_UPDATED, StatusCodes.BAD_REQUEST);
    }

    return true
 
}

exports.handleUserDetails = async (payload) => {
    const { userId } = payload;
    let matchPipeline = {
        $match: {  
            _id : userId
        }
    }

    let notificationLookup = {
        $lookup: {
            from: "usernotificationsettings",
            localField: "_id",
            foreignField: "userId",
            as: "notificationSetting"
        }
    }

    let notificationField = {
        $addFields: {
            notificationSetting: {
            $ifNull: [
              { $arrayElemAt: ["$notificationSetting", 0] }, // Get the first element of the result array
              null                              // Default to null if the array is empty or null
            ]
          }
        }
      }

    const userList = await User.aggregate([
        matchPipeline,
        notificationLookup,
        notificationField
    ]);

    return {
        userDetail: userList[0] || null,
    }

};

exports.registerUsers = async (userDetails) => {

    const { email, password } = userDetails;

    let userInput = {
        ...(email && { email : email }),
    }

    // Check if the email is already registered
    const existingUser = await this.findUserByCond(userInput);
    
    if (existingUser) {

        const notificationSetting = await userNotificationService.findOneNotification({ userId : existingUser._id })

        const jwtRequest = {
            userId: existingUser._id,
        };

        const token = await helpers.generateJwtToken(jwtRequest)
        return {
            userDetail: {...existingUser , notificationSetting },
            token: token,
        };
        
    }

    userDetails.linkedInId = userDetails.linkedInId || '75895758484958'
    userDetails.fullName = "test"

    if(userDetails?.profileImage){
        const profileImage = await helpers.uploadImageUrlToS3(userDetails?.profileImage)
        userDetails.profileImage = profileImage
    }

    // Save user to the database
    const createdUser = await this.createUser({ ...userDetails });

    if(createdUser){
        const getTimeRangeInUtcTimestamps = helpers.getTimeRangeInUtcTimestamps(userDetails.timeZone)
        const createInput = {
            skills: (await skillServices.getSkillListIds()) || [],
            userId : createdUser._id,
            timeSlots :[ 
                {
                    startTime : getTimeRangeInUtcTimestamps?.startTimeTimestamp,
                    endTime : getTimeRangeInUtcTimestamps?.endTimeTimestamp,
                }
            ]
        }
        const notificationSetting = await userNotificationService.createNotification(createInput)

        if(!notificationSetting){
            throw new CustomError(messages.NOTIFICATION_RECORD_NOT_FOUND, StatusCodes.BAD_REQUEST);
        }

        const jwtRequest = {
            userId: createdUser._id,
        };

        const token = await helpers.generateJwtToken(jwtRequest)
        return {
            userDetail: { ...createdUser , notificationSetting },
            token: token,
        };
    }

    throw new CustomError(messages.USER_NOT_REGISTERED, StatusCodes.BAD_REQUEST);

};


// Get a list of skills
exports.getUsersList = async (listInput) => {
    try {

        const userPipelines = []

        let matchPipeline = {}
        if(listInput?.dateFrom || listInput?.dateFrom ){
            let createdAt = {
                ...(listInput?.dateFrom ? { $gte: moment(listInput?.dateFrom).startOf("day").toDate() } : {}),
                ...(listInput?.dateTo ? { $lte: moment(listInput?.dateTo).endOf("day").toDate() } : {})
            };
            
            matchPipeline = {
                ...matchPipeline,
                ...(Object.keys(createdAt).length > 0 ? { createdAt } : {})
            };
        }

        if(listInput?.search){
            matchPipeline = { 
             ...matchPipeline , 
                $or: [
                { fullName: { $regex: search, $options: 'i' } },  // Case-insensitive search for full name
                { linkedInId: { $regex: search, $options: 'i' } }      // Case-insensitive search for email
            ] }
        }

        if(Object.keys(matchPipeline)?.length > 0){
            userPipelines.push({ $match : matchPipeline })
        }

        const sortBy = {
            $sort :{
                createdAt : -1
            }
        }

        userPipelines.push(sortBy)

        if(listInput?.offset >= 0){
            userPipelines.push({
                $skip : Number(listInput.offset)
            })
        }

        if(listInput?.limit){
            userPipelines.push({
                $limit : Number(listInput.limit)
            })
        }

        const projectPipeline = {
            $project: {
                _id : 1,
                fullName : 1,
                linkedInId : 1,
                isVerified : 1,
                isBlocked : 1,
                createdAt : 1,
                updatedAt : 1,
            },
        }

        userPipelines.push(projectPipeline)

        return await User.aggregate([
            {
                $facet: {
                    records: userPipelines,
                    totalCount: [
                        ...(Object.keys(matchPipeline)?.length > 0 ? [{ $match : matchPipeline }] : []),
                        { $count: "count" },
                    ],
                },
            },
        ]);


    } catch (error) {
        throw new Error('User list failed.');
    }
};

exports.handleGetUserList = async (data) =>{
    try {

        let { page , limit } =  data

        page = page ? parseInt(page) : null 
        limit = limit ? parseInt(limit) : null;

        let offset = null
        if(typeof(page) == 'number' && typeof(limit) == 'number'){
            offset = (page - 1) * limit ?? 0;
        }

        const result =  await this.getUsersList({ ...data , offset , limit })

        const records = result[0].records || [];
        const totalCount = result[0].totalCount[0]?.count || 0;

        return {
            records,
            pagination: {
                total: totalCount,
                page,
                limit,
            },
        };

    } catch (error) {
        throw new Error('Listing skills failed.');
    }
}


exports.handleBlockedUser = async (data) => {
    try{
        const { id } = data
        const user = await this.findUserById(id)
        if(!user){
            throw new CustomError(messages.USER_NOT_FOUND, StatusCodes.BAD_REQUEST);
        }

        const updatedUser = await this.updateUser({ _id : user._id } , { isBlocked : true })
        if(!updatedUser){
            throw new CustomError(messages.USER_NOT_UPDATED, StatusCodes.BAD_REQUEST);
        }

        return true
    }
    catch(error){
        throw new Error('Error while blocking user');
    }
}

exports.handleDeleteUser = async (data) => {
    try{
        const { id } = data
        const user = await this.findUserById(id)
        if(!user){
            throw new CustomError(messages.USER_NOT_FOUND, StatusCodes.BAD_REQUEST);
        }

        // Delete user help request
        await helpRequestService.deleteHelpRequest({ userId : user._id })

        // Delete user notification
        await userNotificationService.deleteNotification({ userId : user._id })

        // Delete feedbacks
        await Feedback.deleteMany({ 
            $or: [
              { mentorId: user._id },
              { menteeId: user._id },
              { userId: user._id }
            ] 
          });

        // Delete feedbacks
        await Notification.deleteMany({ 
            $or: [
              { receiverId: user._id },
              { senderId: user._id },
            ] 
        });

        const deletedUser = await User.updateOne({ _id : user._id } , { $set : { isDeleted : true } }) 

        if(!deletedUser){
            throw new CustomError(messages.USER_NOT_DELETED, StatusCodes.BAD_REQUEST);
        }

        if(user?.profileImage){
            await helpers.deleteFiles([user?.profileImage])
        }

        return true

    }
    catch(error){
        throw new Error('Error while deleting user');
    }
}

exports.shareAppFeedback = async (data, userId) => {   
    try{
        const user = await this.findUserById(userId)
        if(!user){
            throw new CustomError(messages.USER_NOT_FOUND, StatusCodes.BAD_REQUEST);
        }
        data.userId = userId
        data.feedbackType = 'app'
        return await Feedback.create(data)
    }
    catch(error){
        throw new Error(error);
    }   
}

exports.getNotificationList = async (data) => {
    try {

        let { userId , page , limit, type } =  data
        if(!type) type = 'help-request'

        const isAdminNotification = type === 'admin-notification' ? true : false

        let offset = null
        if(typeof(page) == 'number' && typeof(limit) == 'number'){
            offset = (page - 1) * limit ?? 0;
        }

        const notifications = await Notification.aggregate([
            { $match: { 
                receiverId: userId, 
                isAdminNotification : isAdminNotification, 
                notificationType: type 
                } 
            },
            {
                $facet: {
                    totalCount: [{ $count: "count" }], 
                    paginatedRecords: [
                        { $sort: { createdAt: -1 } },
                        { $skip: offset }, 
                        { $limit: limit }  
                    ]
                }
            }
        ]);
        

        const total = notifications[0].totalCount.length > 0 ? notifications[0].totalCount[0].count : 0;

        return {
            records: notifications[0].paginatedRecords,
            pagination: {
                total, 
                page,
                limit,
            },
        };
        

    } catch (error) {
        throw new Error('Listing notification failed.');
    }

}

exports.sendNotificationToUsers = async (data) => {
    try{
        const { text , userIds } = data
        const notification = await userNotificationService.getNotificationUserListByIds(userIds)
        if(notification?.length > 0 ){
            await Promise.all(notification.map(async (notify) => {
                const userId = notify?.userId?.toString();
                await Promise.all([
                    sendFirebaseNotification(`user_${userId}`, {
                        title: 'Light me up Admin Notification',
                        message: helpers.limitToChars(text),
                        data: { notificationType: constants.NOTIFICATION_TYPE.ADMIN_NOTIFICATION }
                    }),
                    Notification.create({
                        receiverId: notify.userId,
                        description: text,
                        isAdminNotification: true,
                        notificationType: constants.NOTIFICATION_TYPE.ADMIN_NOTIFICATION
                    })
                ]);
            }));
            return true
        }
        throw new CustomError(messages.NOTIFICATION_NOT_SENT, StatusCodes.BAD_REQUEST);
    }
    catch(error){
        throw new Error('Error while sending notification');
    }
}


exports.getAllNotificationToUsers = async (query) =>{
    try{

        const notificationPipelines = []

        let matchPipeline = {
            isAdminNotification : true
        }

        if(query?.dateFrom || query?.dateFrom ){
            let createdAt = {
                ...(query?.dateFrom ? { $gte: moment(Number(query?.dateFrom)).startOf("day").toDate() } : {}),
                ...(query?.dateTo ? { $lte: moment(Number(query?.dateTo)).endOf("day").toDate() } : {})
            };
            
            matchPipeline = {
                ...matchPipeline,
                ...(Object.keys(createdAt).length > 0 ? { createdAt } : {})
            };
        }

        const sortBy = {
            $sort :{
                createdAt : -1
            }
        }

        const userLookupPipeline = {
            $lookup: {
              from: "users",
              localField: "receiverId",
              foreignField: "_id",
              as: "user",
              pipeline:[
                {
                  $project:{
                    _id : 1,
                    fullName : 1,
                    email:1,
                    linkedInId : 1,
                    createdAt : 1,
                  }
                }
              ]
            }
        }

        const unwindUserLookup = {
            $unwind: {
              path: "$user",
              preserveNullAndEmptyArrays: true
            }
        }

        const projectPipeline =  {
            $project: {
                    _id : 1,
                    receiverId : 1,
                    description : 1,
                    createdAt : 1,
                    user : 1
            }
        } 

        notificationPipelines.push( { $match : matchPipeline} , sortBy ,userLookupPipeline,unwindUserLookup, projectPipeline)

        return await Notification.aggregate(notificationPipelines)
    }
    catch(error){
        console.log(error)
        throw new Error('Error while getting notification');
    }

}

exports.handleFeedbackList = async (data) =>{
 try{

    let { page , limit } =  data

    page = page ? parseInt(page) : null 
    limit = limit ? parseInt(limit) : null;

    let offset = null
    if(typeof(page) == 'number' && typeof(limit) == 'number'){
        offset = (page - 1) * limit ?? 0;
    }

    const userPipelines = []

    let matchPipeline = {
        feedbackType :  data?.feedbackType || 'call'
    }
    

    if(data?.dateFrom || data?.dateTo ){
            let createdAt = {
                ...(data?.dateFrom ? { $gte: moment(Number(data?.dateFrom)).startOf("day").toDate() } : {}),
                ...(data?.dateTo ? { $lte: moment(Number(data?.dateTo)).endOf("day").toDate() } : {})
            };
            
            matchPipeline = {
                ...matchPipeline,
                ...(Object.keys(createdAt).length > 0 ? { createdAt } : {})
            };
    }

    if(Object.keys(matchPipeline)?.length > 0){
        userPipelines.push({ $match : matchPipeline })
    }

    const sortBy = {
            $sort :{
                createdAt : -1
            }
    }

    userPipelines.push(sortBy)

    if(offset && offset >= 0){
        userPipelines.push({
                $skip : Number(offset)
        })
    }

    if(limit){
        userPipelines.push({
                $limit : Number(limit)
        })
    }

    const userLookup = [
        {
            $lookup: {
              from: "users",
              localField: "menteeId",
              foreignField: "_id",
              as: "mentee",
            },
          },
          { $unwind: { path: "$mentee", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "users",
              localField: "mentorId",
              foreignField: "_id",
              as: "mentor",
            },
          },
          { $unwind: { path: "$mentor", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "helprequests",
              localField: "helpId",
              foreignField: "_id",
              as: "helpRequest",
            },
          },
          { $unwind: { path: "$helpRequest", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "user",
            },
          },
          { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    ]
    userPipelines.push(...userLookup)

    const projectPipeline = {
        $project: {
          _id: 1,
          menteeId: 1,
          mentorId: 1,
          helpId: 1,
          feedback: 1,
          feedbackBy: 1,
          feedbackType: 1,
          professionalBenificialRating: 1,
          enjoyableInteractionRating: 1,
          platformRating: 1,
          createdAt: 1,
          updatedAt: 1,
          mentee: { _id: 1, fullName: 1, email: 1  , linkedInId : 1}, // Include only necessary fields
          mentor: { _id: 1, fullName: 1, email: 1  , linkedInId : 1 },
          helpRequest: { _id: 1 , description: 1 },
          user: { _id: 1, fullName: 1, email: 1  , linkedInId : 1 },
        },
    }

    userPipelines.push(projectPipeline)

    const result = await feedbackSchema.aggregate([
            {
                $facet: {
                    records: userPipelines,
                    totalCount: [
                        ...(Object.keys(matchPipeline)?.length > 0 ? [{ $match : matchPipeline }] : []),
                        { $count: "count" },
                    ],
                },
            },
    ]);
    
    const records = result[0].records || [];
    const totalCount = result[0].totalCount[0]?.count || 0;

    return {
            records,
            pagination: {
                total: totalCount,
                page,
                limit,
            },
    };

 }
 catch(error){
    console.log(error)
        throw new Error('Error while getting feedback list');
 }
}