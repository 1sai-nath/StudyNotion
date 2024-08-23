const { instance } = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const {
  courseEnrollmentEmail,
} = require("../mail/templates/courseEnrollmentEmail");
const { default: mongoose } = require("mongoose");
const {
  paymentSuccessEmail,
} = require("../mail/templates/paymentSuccessEmail");

const crypto = require("crypto");
const CourseProgress = require("../models/CourseProgress");

// PAYMENT INITIATE == capture the payment and initiate the Razorpay order
exports.capturePayment = async (req, res) => {
  const { courses } = req.body;
  const userId = req.user.id;

  if (!courses.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Please Provide Course ID",
    });
  }

  let totalAmount = 0;

  console.log("courses=>", courses);

  // console.log("courses[0].length", courses[0].length);
  // const coursesMain = courses[0].length > 0 ? courses[0] : courses ;
  // console.log("coursesMain=>", coursesMain);
  for (let course_id of courses) {
    console.log("this is for ", course_id);

    let course;
    try {
      course = await Course.findById(course_id);

      // check the course call on db is getting course details or not
      if (!course) {
        return res.status(200).json({
          success: false,
          message: "Not found course",
        });
      }

      // checking the student is already enrolled or not
      const uid = new mongoose.Types.ObjectId(userId);

      if (course.studentsEnrolled.includes(uid)) {
        return res.status(400).json({
          success: false,
          message: "Student is already enrolled",
        });
      }

      console.log("course.price", course.price);
      console.log("totalAmount", totalAmount);
      totalAmount = totalAmount + course.price;
    } catch (error) {
      console.log("error=>", error);
      return res.status(400).json({
        success: false,
        message: "error in TRY block",
      });
    }
  }

  const options = {
    amount: totalAmount * 100,
    currency: "INR",
    receipt: Math.random(Date.now()).toString(),
  };

  try {
    const paymentResponse = await instance.orders.create(options);

    res.json({
      success: true,
      message: paymentResponse,
    });
  } catch (error) {
    console.log("error=>", error);
    res.status(500).json({
      success: false,
      message: "Could not initiate payment",
    });
  }
};

// VERIFIED PAYMENT == verify Signature of Razorpay and Server
// webhook in razorpay hit this api
exports.verifyPayment = async (req, res) => {
  require("dotenv").config();

  const razorpay_order_id = req.body?.razorpay_order_id;
  const razorpay_payment_id = req.body?.razorpay_payment_id;
  const razorpay_signature = req.body?.razorpay_signature;
  const courses = req.body?.courses;
  const userId = req.user.id;

  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature ||
    !courses ||
    !userId
  ) {
    return res.status(200).json({
      success: false,
      message: "Payment Failed",
    });
  }

  let body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(body.toString())
    .digest("hex");

  // match ho gyi signature to
  if (expectedSignature === razorpay_signature) {
    // enroll the student in the course
    const enrolledStudent = await enrollStudent(courses, userId, res);
    console.log("🏊‍♀️🏊🏊‍♂️🤽‍♀️🤽🤽‍♂️🏊‍♀️🏊🏊‍♂️🤽‍♀️🤽🤽‍♂️🏊‍♀️🏊🏊‍♂️🤽‍♀️🤽🤽‍♂️🏊‍♀️🏊🏊‍♂️🤽‍♀️🤽🤽‍♂️");
    console.log(
      "====================================================================="
    );
    //console.log("enrolledStudent",enrolledStudent);

    // return
    return res.status(200).json({
      success: true,
      message:
        "enrolled success fully = payment verifed= purchased successfully",
      enrolledStudent,
    });
  }

  return res.status(200).json({
    success: "false",
    message: "Payment Failed",
  });
};

// function to enroll the student in the particular course
const enrollStudent = async (courses, userId, res) => {
  if (!courses || !userId) {
    return res.status(400).json({
      success: false,
      message: "Please provide data for courses or userId",
    });
  }

  // if there are more than ONE course so here we are in the LOOP
  // by using loop we can work for every course one by one
  for (const courseId of courses) {
    try {
      // find the each course and then add user in the enrollment
      const enrolledCourse = await Course.findByIdAndUpdate(
        {
          _id: courseId,
        },
        {
          $push: {
            studentsEnrolled: userId,
          },
        },
        {
          new: true,
        }
      );

      console.log(
        "💫⭐️🌟✨⚡️☄️💥🔥 💫⭐️🌟✨⚡️☄️💥🔥💫⭐️🌟✨⚡️☄️💥🔥💫⭐️🌟✨⚡️☄️💥🔥 enrolledCourse=>"
      );
      console.log(enrolledCourse);

      if (!enrolledCourse) {
        return res.status(500).json({
          success: false,
          message: "Course not found",
        });
      }

      const courseProgress = await CourseProgress.create({
        courseID: courseId,
        userId: userId,
        completedVideos: [],
      });

      console.log(
        "💥💥💥💥💥💥💥courseProgress=>",
        courseProgress,
        "and",
        courseProgress._id
      );
      // find the course and add the course to their list of enrolledCourses
      const enrolledStudent = await User.findByIdAndUpdate(
        userId,
        {
          $push: {
            courses: courseId,
            courseProgress: courseProgress._id,
          },
        },
        {
          new: true,
        }
      );

      //console.log("💫⭐️🌟✨⚡️☄️💥🔥💫⭐️🌟✨⚡️☄️💥🔥💫⭐️🌟✨⚡️☄️💥🔥enrolledStudent=>", enrolledStudent);

      // email send to user if user successfully enrolled
      const emailResponse = await mailSender(
        enrolledStudent.email,
        `Successfully enrolled in ${enrolledCourse.courseName}`,
        courseEnrollmentEmail(
          enrolledCourse.courseName,
          `${enrolledStudent.firstName}`
        )
      );
      if (emailResponse) {
        console.log("email sent successfully", emailResponse.response);
      }
    } catch (error) {
      console.log("error=>", error);
      return res.status(500).json({
        success: false,
        message: "ERROR in enrollemnt of studnet in course",
        error,
      });
    }
  }
};

exports.sendPaymentSuccessEmail = async (req, res) => {
  const { orderId, payment, amount } = req.body;

  console.log("req.body=>", req.body);
  const userId = req.user.id;

  console.log(
    "orderId, payment, amount, userId",
    orderId,
    payment,
    amount,
    userId
  );
  const body = req.body;

  if (!orderId || !payment || !amount || !userId) {
    return res.status(400).json({
      success: false,
      message: "plz provide all details",
      orderId,
      payment,
      amount,
      userId,
      body,
    });
  }

  try {
    // find student
    const enrolledStudent = await User.findById(userId);

    const sendedMail = await mailSender(
      enrolledStudent.email,
      `Payment Received`,
      paymentSuccessEmail(
        `${enrolledStudent.firstName}`,
        amount / 100,
        orderId,
        payment
      )
    );

    return res.status(200).json({
      success: true,
      message: "mail send succesfully",
      enrolledStudent,
      sendedMail,
    });
  } catch (error) {
    console.log("error in sending mail=>", error);
    return res.status(500).json({
      success: false,
      message: "Could not send email",
    });
  }
};

// // ======================================================
// //capture the payment and initiate the Razorpay order
// exports.capturePayment = async (req, res) => {
//     //get courseId and UserID
//     const {course_id} = req.body;
//     const userId = req.user.id;
//     //validation
//     //valid courseID
//     if(!course_id) {
//         return res.json({
//             success:false,
//             message:'Please provide valid course ID',
//         })
//     };
//     //valid courseDetail
//     let course;
//     try{
//         course = await Course.findById(course_id);
//         if(!course) {
//             return res.json({
//                 success:false,
//                 message:'Could not find the course',
//             });
//         }

//         //user already pay for the same course
//         const uid = new mongoose.Types.ObjectId(userId);
//         if(course.studentsEnrolled.includes(uid)) {
//             return res.status(200).json({
//                 success:false,
//                 message:'Student is already enrolled',
//             });
//         }
//     }
//     catch(error) {
//         console.error(error);
//         return res.status(500).json({
//             success:false,
//             message:error.message,
//         });
//     }

//     //order create
//     const amount = course.price;
//     const currency = "INR";

//     const options = {
//         amount: amount * 100,
//         currency,
//         receipt: Math.random(Date.now()).toString(),
//         notes:{
//             courseId: course_id,
//             userId,
//         }
//     };

//     try{
//         //initiate the payment using razorpay
//         const paymentResponse = await instance.orders.create(options);
//         console.log(paymentResponse);
//         //return response
//         return res.status(200).json({
//             success:true,
//             courseName:course.courseName,
//             courseDescription:course.courseDescription,
//             thumbnail: course.thumbnail,
//             orderId: paymentResponse.id,
//             currency:paymentResponse.currency,
//             amount:paymentResponse.amount,
//         });
//     }
//     catch(error) {
//         console.log(error);
//         res.json({
//             success:false,
//             message:"Could not initiate order",
//         });
//     }

// };

// //verify Signature of Razorpay and Server

// exports.verifySignature = async (req, res) => {
//     const webhookSecret = "12345678";

//     const signature = req.headers["x-razorpay-signature"];

//     const shasum =  crypto.createHmac("sha256", webhookSecret);
//     shasum.update(JSON.stringify(req.body));
//     const digest = shasum.digest("hex");

//     if(signature === digest) {
//         console.log("Payment is Authorised");

//         const {courseId, userId} = req.body.payload.payment.entity.notes;

//         try{
//                 //fulfil the action

//                 //find the course and enroll the student in it
//                 const enrolledCourse = await Course.findOneAndUpdate(
//                                                 {_id: courseId},
//                                                 {$push:{studentsEnrolled: userId}},
//                                                 {new:true},
//                 );

//                 if(!enrolledCourse) {
//                     return res.status(500).json({
//                         success:false,
//                         message:'Course not Found',
//                     });
//                 }

//                 console.log(enrolledCourse);

//                 //find the student andadd the course to their list enrolled courses me
//                 const enrolledStudent = await User.findOneAndUpdate(
//                                                 {_id:userId},
//                                                 {$push:{courses:courseId}},
//                                                 {new:true},
//                 );

//                 console.log(enrolledStudent);

//                 //mail send krdo confirmation wala
//                 const emailResponse = await mailSender(
//                                         enrolledStudent.email,
//                                         "Congratulations from CodeHelp",
//                                         "Congratulations, you are onboarded into new CodeHelp Course",
//                 );

//                 console.log(emailResponse);
//                 return res.status(200).json({
//                     success:true,
//                     message:"Signature Verified and COurse Added",
//                 });

//         }
//         catch(error) {
//             console.log(error);
//             return res.status(500).json({
//                 success:false,
//                 message:error.message,
//             });
//         }
//     }
//     else {
//         return res.status(400).json({
//             success:false,
//             message:'Invalid request',
//         });
//     }

// };
