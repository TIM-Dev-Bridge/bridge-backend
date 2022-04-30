const mongoose = require("mongoose");
var myId = mongoose.Types.ObjectId();
const userSchema = new mongoose.Schema({
  // _id: false,
  // tour_id: { type: Object, default: myId, unique: true },
  tour_id: { type: Object, unique: true },
  tour_name: { type: String, unique: true },
  max_player: { type: Number, default: 20 },
  type: { type: String, default: "Pairs" },
  password: { type: String },
  players: { type: Array, default: [] },
  rounds: { type: Array, default: [] },
  time_start: { type: String, default: null },
  status: { type: String, default: "Pending" },
  board_to_play: { type: Number, default: 0 },
  minute_board: { type: Number, default: 0 },
  board_per_round: { type: Number, default: 0 },
  movement: { type: String, default: "Clocked" },
  score_type: { type: String, default: "MP" },
  barometer: { type: Boolean, default: true },
  mode: { type: String },
  boardScores: { type: Array },
  rankPairs: { type: Array },
  createBy: { type: String },
});

module.exports = mongoose.model("tour-room", userSchema);
