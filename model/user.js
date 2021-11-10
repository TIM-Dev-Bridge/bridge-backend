const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  // //can use
  // first_name: { type: String, default: null },
  // last_name: { type: String, default: null },
  // email: { type: String, unique: true },
  // password: { type: String },
  // token: { type: String },
  //new one
  first_name: { type: String, default: null },
  last_name: { type: String, default: null },
  display_name: { type: String, default: null },
  birth_date: { type: String, default: null },
  access: {
    type: String, default: "user"
  },
  email: { type: String, unique: true },
  username : { type: String, unique: true },
  password: { type: String },
  token: { type: String },
});

module.exports = mongoose.model("users", userSchema);
