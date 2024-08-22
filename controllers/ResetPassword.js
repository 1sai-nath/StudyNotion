const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt");

// reset passwordtoken
exports.resetPasswordToken = async (req, res) => {
  try {
    //  get email from request body
    const email = req.body.email;
    // check user for this email,email validation
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.json({
        success: false,
        message: "your email is not registered with us",
      });
    }
    // generate token
    const token = crypto.randomUUID();

    // update user by adding token and expiration time
    const updateDetails = await User.findOneAndUpdate(
      { email: email },
      {
        token: token,
        resetPasswordExpires: Date.now() + 5 * 60 * 1000,
      },
      { new: true }
    );
    // create url
    const url = "https://localhost:3000/update-password/${token}";

    // send mail containing url
    await mailSender(
      email,
      "Password reset link",
      `Password reset link: ${url}`
    );
    // return response
    return response.json({
      success: true,
      message:
        "Email sent successfully,please check your email and change your password",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "something went wrong while sending reset password email",
    });
  }
};

// reset password
exports.resetPassword = async (req, res) => {
  try {
    // data fetch
    const { password, confirmPassword, token } = req.body;
    // validation
    if (password !== confirmPassword) {
      return res.json({
        success: false,
        message: "password not matching",
      });
    }
    // get user details from db using token
    const userDetails = await User.findOne({ token: token });

    // if no entry -invalid token
    if (!userDetails) {
      return res.json({
        success: false,
        message: "Token is invalid",
      });
    }

    // token time check
    if (!userDetails.resetPasswordExpires < Date.now()) {
      return res.json({
        success: false,
        message: "token is expired please regenerate your token",
      });
    }
    // hash password
    const hashPassword = await bcrypt.hash(password, 10);

    // password update
    await User.findOne(
      { token: token },
      { password: hashPassword },
      { new: true }
    );
    // return response
    return res.status(200).json({
      success: true,
      message: "password reset successful",
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      success: false,
      message: "something went wrong while resetting password",
    });
  }
};
