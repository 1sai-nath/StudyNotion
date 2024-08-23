const Section = require("../models/Section");
const Course = require("../models/Course");
const SubSection = require("../models/SubSection");

exports.createSection = async (req, res) => {
  try {
    // data fetch
    const { sectionName, courseId } = req.body;
    // data validation
    if (!sectionName || !courseId) {
      return res.status(400).json({
        success: false,
        message: "missing properties",
      });
    }
    // create section
    const newSection = await Section.create({ sectionName });
    // Update course with section ObjectId
    const updatedCourse = await Course.findByIdAndUpdate(
      { courseId },
      {
        $push: {
          courseContent: newSection._id,
        },
      },
      { new: true }
    )
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })
      .exec();
    // return response

    res.status(200).json({
      success: true,
      message: "Section created successfully",
      updatedCourse,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "unable to create section,please try again",
      error: err.message,
    });
  }
};

// update a section
exports.updateSection = async (req, res) => {
  try {
    // data fetch
    const { sectionName, sectionId, courseId } = req.body;
    // data validation
    if (!sectionName || !sectionId) {
      return res.status(400).json({
        success: false,
        message: "missing properties",
      });
    }
    // update data
    const section = await Section.findByIdAndUpdate(
      sectionId,
      { sectionName },
      { new: true }
    );
    // return response
    return res.status(200).json({
      success: true,
      message: "section updated successfully",
    });

    // const course = await Course.findById(courseId)
    //   .populate({
    //     path: "courseContent",
    //     populate: {
    //       path: "subSection",
    //     },
    //   })
    //   .exec();
  } catch (err) {
    console.error("error in updating section", err);
    res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

// delete a section

exports.deleteSection = async (req, res) => {
  try {
    // get id

    const { sectionId } = req.params;
    await Course.findByIdAndDelete(sectionId, {
      //   $pull: {
      //     courseContent: sectionId,
      //   },
    });

    // return response
    return res.status(200).json({
      success: true,
      message: "section deleted successfully",
    });

    // const section = await Section.findById(sectionId);
    // console.log(sectionId, courseId);
    // if (!section) {
    //   res.status(404).json({
    //     success: false,
    //     message: "section not found",
    //   });
    // }

//     // delete subSection
//     await SubSection.deleteMany({ _id: { $in: section.subSection } });

//     await Section.findByIdAndDelete(sectionId);

//     // find the updated course and return
//     const course = await Course.findById(courseId)
//       .populate({
//         path: "courseContent",
//         populate: {
//           path: "subSection",
//         },
//       })
//       .exec();
//     res.status(200).json({
//       success: true,
//       message: "Section deleted successfully",
//       data: course,
//     });
//   } catch (err) {
//     console.error("error deleting section", err);
//     res.status(500).json({
//       success: false,
//       message: "internal server error",
//     });
//   }
// };
