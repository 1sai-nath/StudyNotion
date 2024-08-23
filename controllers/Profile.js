const Profile = require("../models/Profile");
const CourseProgress = require("../models/CourseProgress");

const course = require("../models/Course");
const User = require("../models/User");
const { uploadImageToCloudinary } = require("../utils/uploadImageToCloudinary");
const mongoose = require("mongoose");
const { convertSecondsToDuration } = require("../utils/secToDuration");
const Course = require("../models/Course");

// methods for updating a profile

exports.updateProfile = async (req, res) => {
  try {
    const {
      firstName = "",
      lastName = "",
      dateOfBirth = "",
      about = "",
      contactNumber = "",
      gender = "",
    } = req.body;
    const id = req.user.id;

    if (!contactNumber || !gender || !id) {
      return res.status(400).json({
        success: false,
        message: "all fields required",
      });
    }

    // find the profile by id

    const userDetails = await User.findById(id);
    const profile = await Profile.findById(userDetails.additionalDetails);

    const user = await User.findByIdAndUpdate(id, {
      firstName,
      lastName,
    });

    await user.save();

    // update profile fields
    profile.dateOfBirth = dateOfBirth;
    profile.about = about;
    profile.contactNumber = contactNumber;
    profile.gender = gender;
    // save the updated profile
    await profile.save();

    // find the updated users details
    const updatedUserDetails = await User.findById(id)
      .populate("additionalDetails")
      .exec();

    return res.json({
      success: true,
      message: "Profile updated successfully",
      updatedUserDetails,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// delete Account
exports.deleteAccount = async (req, res) => {
  try {
    // get id
    const id = req.user.id;
    // validation
    const userDetails = await User.findById({ _id: id });
    if (!userDetails) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // delete associated profile with user
    await Profile.findByIdAndDelete({
      _id: userDetails.additionalDetails,
    });

    //    delete user
    await User.findByIdAndDelete({ _id: id });

    // return response
    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "User could not be deleted",
    });
  }
};

exports.getAllUserDetails = async (req, res) => {
  try {
    // get id
    const id = req.user.id;
    // validate and get user details
    const userDetails = await User.findById(id)
      .populate("additionalDetails")
      .exec();
    //   return response
    return res.status(200).json({
      success: true,
      message: "User data fetched successfully",
    });
  } catch {}
};
