const User = require("../models/User");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { response } = require("express");
require("dotenv").config();

// send otp
exports.sendOTP = async (req, res) => {
  try {
    // fetch email
    const { email } = req.body;

    //  check if user already exists
    const checkUserPresent = await User.findOne({ email });
    // if user already exists then return response

    if (checkUserPresent) {
      return res.starus(401).json({
        success: false,
        Message: "User already registered",
      });
    }

    //   generate otp
    var otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      spcialChars: false,
    });
    console.log("otp generated:", otp);

    //check unique otp or not
    let result = await OTP.findOne({ otp: otp });

    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        spcialChars: false,
      });
      result = await OTP.findOne({ otp: otp });

      const otpPayload = { email, otp };

      //   create an entry for otp
      const otpBody = await OTP.create({ otpPayload });
      console.log(otpBody);

      // return response successfully
      res.status(200).json({
        success: true,
        message: "otp sent successfully",
        otp,
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// signup
exports.signUp = async (req, res) => {
  try {
    // data fetch from request body
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      accountType,
      contactNumber,
      otp,
    } = req.body;

    // validate
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !otp
    ) {
      return res.status(403).json({
        success: false,
        message: "all fields required",
      });
    }

    // 2 password match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "password and confirm password value does not match ,please try again",
      });
    }

    // check user already exist or not
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already registered",
      });
    }

    // find most recent otp stored for the user
    const recentOtp = await OTP.find({ email })
      .sort({ createdAt: -1 })
      .limit(1);
    console.log(recentOtp);

    // validate
    if (recentOtp.length == 0) {
      // otp not found
      return res.status(400).json({
        success: false,
        message: "Otp not found",
      });
    } else if (otp !== recentOtp.otp) {
      // invalid otp
      return res.status(400).json({
        success: false,
        message: "Invalid otp",
      });
    }
    // Hash password

    const HashedPassword = await bcrypt.hashPassword(password, 10);

    // entry create in database

    const profileDetails = await Profile.create({
      gender: null,
      dateOfBirth: null,
      about: null,
      contactNumber: null,
    });
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: HashedPassword,
      contactNumber,
      accountType,
      additionalDetails: profileDetails._id,
      image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
    });

    // return res
    return res.status(200).json({
      success: true,
      message: "User registered successfully",
      user,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "User cannot be registered ,please try again",
    });
  }
};

// login
exports.login = async (req, res) => {
  try {
    // get data from req body
    const { email, password } = req.body;
    // validation data
    if (!email || !password) {
      return res.status(403).json({
        success: false,
        message: "all fields are required, please try again",
      });
    }
    // user check exist or not
    const user = await User.findOne({ email: email }).populate(
      "additionalDetails"
    );
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "user is not registered, please signup first",
      });
    }

    // generate jwt,after password matches
    if (await bcrypt.compare(password, user.password)) {
      const payload = {
        email: user.email,
        id: user._id,
        accountType: user.accountType,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "2h",
      });
      user.token = token;
      user.password = undefined;

      // create cookie and send response
      const options = {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      };
      res.cookie("token", token, options).status(200).json({
        success: true,
        token,
        user,
        message: "logged in successfully",
      });
    } else {
      res.status(401).json({
        success: false,
        message: "password is incorrect",
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "login failure, please try again",
    });
  }
};

// change password
exports.changePassword =async(req,res)=>{
// get data from request body
// get old password,new password,confirm new password
// validation
// update pwd in db
// send mail-password updated
// reset response
}
