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
  manageTour,
  getTournamentData,
  getUserData,
  updateUserData,
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
app.get("/getUserData", getUserData);
app.get("/getTournamentData", getTournamentData);
app.post("/updateUserData", updateUserData);

app.post("/registerTourD", registerTourD);
app.post("/loginTourD", loginTourD);

app.post("/createTour", createTournament);
app.post("/updateTour", updateTournament);
app.delete("/deleteTour", deleteTournament);

//Delete
app.get("/manageTour", manageTour);

module.exports = app;
