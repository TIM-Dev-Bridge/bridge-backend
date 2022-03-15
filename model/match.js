const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema({
  tid: { type: String, default: null },
  matchs: { type: Array, default: null },
});

module.exports = mongoose.model("match", matchSchema);
