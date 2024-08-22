const Tag = require("../models/Tags");
// create tag handler function

exports.createTag = async (req, res) => {
  try {
    // fetch data
    const { name, description } = req.body;
    // validation
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // create  entry in database
    const tagDetails = await Tag.create({
      name: name,
      description: description,
    });
    console.log(tagDetails);
    // return response
    return res.status(200).json({
      success: true,
      message: "Tag created successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

//getAllTAgs handler function
exports.showAllTags = async (req, res) => {
  try {
    const allTags = await Tag.find({}, { name: true }, { description: true });
    return res.status(200).json({
      success: true,
      message: "all tags returned successfully",
      allTags,
    });
  } catch (err) {
    return res.status(500).json({
      sucess: false,
      message: err.message,
    });
  }
};
