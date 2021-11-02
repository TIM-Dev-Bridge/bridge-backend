const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  tour_name: { type: String, default: null },
  max_player: { type: String, default: null },
  type: { type: String, default: null },
  password: { type: String },
  player_name: { type: Array, default: [] },
  token: { type: String },
});

module.exports = mongoose.model("tour-room", userSchema);
