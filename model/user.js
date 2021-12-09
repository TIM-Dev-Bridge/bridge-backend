const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  first_name: { type: String, default: null },
  last_name: { type: String, default: null },
  display_name: { type: String, default: null },
  birth_date: { type: String, default: null },
  access: {
    type: String,
    default: "user",
  },
  email: { type: String, unique: true },
  username: { type: String, unique: true },
  password: { type: String },
  confirm_password: { type: String },
  token: { type: String },
  joined_tour: { type: Array, default: [] },
});

module.exports = mongoose.model("users", userSchema);
