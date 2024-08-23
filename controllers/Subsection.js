const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
const {
  uploadImageToCloudinary,
} = require("../models/UploadImageToCloudinary");
const { response } = require("express");

// create a new SubSection

exports.createSubSection = async (req, res) => {
  try {
    // fetch the data
    const { sectionId, title, timeDuration, description } = req.body;
    const video = req.files.videoFile;

    // validation
    if (!sectionId || !title || !description || !timeDuration || !video) {
      return res.status(400).json({
        success: false,
        message: "all fields are required",
      });
    }

    // Upload the videoFile to the cloudinary
    const uploadDetails = await uploadImageToCloudinary(
      video,
      process.env.FOLDER_NAME
    );

    // create the new subsection with necessary information
    const subSectionDetails = await SubSection.create({
      title: title,
      timeDuration: timeDuration,
      description: description,
      videoUrl: uploadDetails.secure_url,
    });

    // update the corresponding section with the new created subsection
    const updatedSection = await Section.findByIdAndUpdate(
      { _id: sectionId },
      { $push: { subSection: subSectionDetails._id } },
      { new: true }
    ).populate("subSection");

    return res.status(200).json({
      success: true,
      message: "subsection created successfully",
      updatedSection,
    });
  } catch (err) {
    console.error("error creating new subsection:", err);
    return res.status(500).json({
      success: false,
      message: "internal server error",
      error: err.message,
    });
  }
};

// update subsection

exports.updateSubsection = async (req, res) => {
  try {
    const { sectionId, subSectionId, title, description } = req.body;
    const subSection = await SubSection.findById(subSectionId);

    if (!subSection) {
      return res.status(404).json({
        success: false,
        message: "subsection not found",
      });
    }

    if (title !== undefined) {
      subSection.title = title;
    }

    if (description !== undefined) {
      subSection.description = description;
    }
    if (req.files && req.files.video !== undefined) {
      const video = req.files.video;
      const uploadDetails = await uploadImageToCloudinary(
        video,
        process.env.FOLDER_NAME
      );
      subSection.videoUrl = uploadDetails.secure_url;
      subSection.timeDuration = `${uploadDetails.duration}`;
    }

    await subSection.save();

    // find updated section and return it
    const updatedSection = await Section.findById(sectionId).populate(
      "subSection"
    );

    console.log("updated section", updatedSection);

    return res.json({
      success: true,
      message: "Section updated successfully",
      updatedSection,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the section",
    });
  }
};

exports.deleteSection = async (req, res) => {
  try {
    const { subSectionId, sectionId } = req.body;
    await Section.findByIdAndUpdate(
      { _id: sectionId },
      {
        $pull: {
          subSection: subSectionId,
        },
      }
    );

    const subSection = await Section.findByIdAndDelete({ _id: subSectionId });

    if (!subSection) {
      return res.status(404).json({
        success: false,
        message: "SubSection not found",
      });
    }

    // find updated section and return it
    const updatedSection = await Section.findById(sectionId).populate(
      "subSection"
    );

    return res.json({
      success: true,
      message: "SubSection deleted successfully",
      updatedSection,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting subSection",
    });
  }
};
