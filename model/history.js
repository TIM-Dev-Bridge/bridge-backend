const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema({
  tid: { type: String, default: null },
  rounds: { type: Array },
});

module.exports = mongoose.model("history", matchSchema);
