const mongoose = require("mongoose");

const { MONGO_URI } = process.env;

exports.connect = () => {
  //Connecting to the database
  mongoose
    .connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // useCreateIndex: true,
      // useFindAndModify: false,
    })
    .then(() => {
      console.log("Connected database");
    })
    .catch((err) => {
      console.log("Failed to connect database");
      console.log(err);
    });
};
