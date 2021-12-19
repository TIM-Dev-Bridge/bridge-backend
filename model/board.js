const mongoose = require("mongoose");

const Block = new mongoose.Schema({
  type: String,
  data: Object
})

const Post = new mongoose.Schema({
  time: Number,
  blocks: [Block],
  version: String
})

const userSchema = new mongoose.Schema({
  creator: { type: String, default: null },
  title: { type: String, default: null },
  data: Post,
});

module.exports = mongoose.model("board", userSchema);
