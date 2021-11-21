const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  admin_name: { type: String, default: null },
  title: { type: String, default: null },
  data: { type: String, default: null },
});

module.exports = mongoose.model("board", userSchema);
