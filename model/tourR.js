const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  tour_name: { type: String, unique: true },
  max_player: { type: Number, default: 20 },
  type: { type: String, default: "Pairs" },
  password: { type: String },
  player_name: { type: Array, default: [] },
  time_start: { type: String, default: null },
  status: { type: String, default: "Pending" },
  board_to_play: { type: Number, default: 0 },
  minute_board: { type: Number, default: 0 },
  board_round: { type: Number, default: 0 },
  movement: { type: String, default: "Clocked" },
  scoring: { type: String, default: "MP" },
  barometer: { type: Boolean, default: true },
  createBy: { type: String },
});

module.exports = mongoose.model("tour-room", userSchema);
