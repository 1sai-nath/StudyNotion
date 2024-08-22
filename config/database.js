const mongoose = require("mongoose");
require("dotenv").config();

exports.connect = () => {
  mongoose
    .connect(process.env.MONGODB_URL)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => {
      console.log("Error connecting to MongoDB");
      console.error(err);
      process.exit(1);
    });
};
