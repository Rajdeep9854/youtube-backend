import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/fileUploadInCloud.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const generateAccessAndRefreshTokens = async (userId) => {
    try {

        const user = await User.findById(userId);
        const refreshToken = user.generateRefreshToken();
        const accessToken = user.generateAccessToken();

        user.refreshToken = refreshToken;
        //console.log(user);

        user.save({ validateBeforeSave : false });

    } catch (error) {
        throw new ApiError(500, "something went wrong while generating access and refresh token");

    }
}

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend 
    // validation  -- not empty 
    // check if user already exists : username , email 
    // check for images check for avatar 
    // upload them to cloudinary , avatar 
    // create a user object - create entry in db 
    // remove password and refresh token field from response 
    // check for user creation 
    // return response 

    const { fullName, email, username, password } = req.body


    if ([fullName, email, username, password]
        .some((field) => {
            return field?.trim() === ""
        })
    ) {
        //throw new ApiError(400, "all fields are required")
        return res.status(400).json(new ApiError(400, "all fields are required"))
    }


    const existedUser = await User.findOne({
        $or: [{ username: username }, { email: email }]
    })
    if (existedUser) {
        //throw  new ApiError(409, "User with email or username already exists")
        //console.log(new ApiError(400,"user with email does not exists"));

        return res.status(409).json(new ApiError(409, "User with email or username already exists"))
    }


    //const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImagePath = req.files?.coverImage[0]?.path;

    let coverImagePath;
    let avatarLocalPath;
    if (req.files
        && Array.isArray(req.files.coverImage)
        && req.files.coverImage.length > 0) {
        coverImagePath = req.files.coverImage[0].path

    }

    if (req.files
        && Array.isArray(req.files.avatar)
        && req.files.avatar.length > 0) {
        avatarLocalPath = req.files.avatar[0].path
    }

    if (!avatarLocalPath) {
        //throw new ApiError(400, "avatar file is required")
        return res.status(400).json(new ApiError(400, "avatar image required"))
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImagePath)

    if (!avatar) {
        throw new ApiError(400, "avatar field is required");
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()

    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "something went wrong while registering the user")

    }

    return res.status(201).json(new ApiResponse(200, createdUser, "user registered succesfully"));


})

const loginUser = asyncHandler(async (req, res) => {
    // req.body --> data
    //username or email 
    // find the user 
    //password check 
    // access and refresh token 
    // send cookie 


    const { email, username, password } = req.body;

    if (!username || !email) {
        throw new ApiError(400, "username or email is required");
    }

    const user = User.findOne({
        $or: [{ username }, { email }]  // if email is provided email founding started and if username is provided then username finding is started 

    })

    if (!user) {
        throw new ApiError(404, "User does not exists")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(404, "User does not exists");
    }


})

export { registerUser }