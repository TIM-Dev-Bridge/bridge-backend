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
  updateTourData,
} = require("./handlers/users");
const { registerTourD, loginTourD } = require("./handlers/tourDs");
app.get("/", home);
app.get("/home2", home2);

app.post("/register", register);
app.post("/login", login);
app.get("/getUserData", getUserData);
app.get("/getTournamentData", getTournamentData);
app.post("/updateUserData", updateUserData);
app.post("/updateTourData", updateTourData);

app.post("/registerTourD", registerTourD);
app.post("/loginTourD", loginTourD);


//Delete
app.get("/manageTour", manageTour);

module.exports = app;
