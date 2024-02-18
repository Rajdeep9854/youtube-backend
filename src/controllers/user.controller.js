import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/fileUploadInCloud.js"
import { ApiResponse } from "../utils/ApiResponse.js"



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
    // if (fullName === "") {
    //     throw new ApiError(400, "full name required")
    // }

    if ([fullName, email, username, password]
        .some((field) => {
            return field?.trim() === ""
        })
    ) {
        throw new ApiError(400, "all fields are required")
    }


    const existedUser = User.findOne({
        $or: [{ username: username }, { email: email }]
    })
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }


    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImagePath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar file is required")
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

export { registerUser }