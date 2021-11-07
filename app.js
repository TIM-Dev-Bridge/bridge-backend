require("dotenv").config();
// require("./config/database").connect();

const express = require("express");
const { restart } = require("nodemon");
const auth = require("./middleware/auth");

const app = express();

app.use(express.json());

const {
  home,
  register,
  login,
  home2,
  joinTournament,
  exitTournament,
} = require("./handlers/users");
const { registerTourD, loginTourD } = require("./handlers/tourDs");
const {
  createTournament,
  updateTournament,
  deleteTournament,
} = require("./tour/tournaments");
app.get("/", home);
app.get("/home2", auth, home2);

app.post("/register", register);
app.post("/login", login);
app.post("/joinTour", joinTournament);
app.delete("/exitTour", exitTournament);

app.post("/registerTourD", registerTourD);
app.post("/loginTourD", loginTourD);

app.post("/createTour", createTournament);
app.post("/updateTour", updateTournament);
app.delete("/deleteTour", deleteTournament);

module.exports = app;
