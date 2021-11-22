require("dotenv").config();
require("../config/database").connect();

const express = require("express");
const User = require("../model/user");
const TourR = require("../model/tourR");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const {
  validateSignupData,
  validateLoginData,
} = require("../middleware/validators");

const app = express();

app.use(express.json());
//Home
exports.home = (req, res) => {
  // res.sendFile(
  //   "C:/Users/Marky/Desktop/Project-D4/Bridge Backend/Bridge-backend-API/index.html"
  // );
  res.sendFile(path.dirname(__dirname) + "/index.html");
};

//Register
exports.register = async (req, res) => {
  //register logic
  try {
    const {
      first_name,
      last_name,
      display_name,
      birth_date,
      email,
      username,
      password,
    } = req.body;

    const { valid, errors } = validateSignupData({
      first_name,
      last_name,
      display_name,
      birth_date,
      email,
      username,
      password,
    });
    if (!valid) return res.status(400).json(errors);
    //Validate if user exist in database
    const oldUserEmail = await User.findOne({ email });
    const oldUserUsername = await User.findOne({ username });

    if (oldUserEmail || oldUserUsername) {
      res.status(409).send("User already exist. Please login");
    }

    //Encrypt user password
    encryptedPassword = await bcrypt.hash(password, 10);

    //Create user in database
    const user = await User.create({
      first_name,
      last_name,
      display_name,
      birth_date,
      access,
      email: email.toLowerCase(),
      username,
      password: encryptedPassword,
    });

    //Create token
    const token = jwt.sign(
      {
        user_id: user._id,
        email,
        username: user.username,
        access: user.access,
      },
      process.env.TOKEN_KEY,
      {
        expiresIn: "2h",
      }
    );

    //Save user token
    user.token = token;

    //return new user
    res.status(201).json(user);
  } catch (err) {}
};

//Login
exports.login = async (req, res) => {
  //Login logic
  try {
    //Get user input
    const { email, password } = req.body;

    //Validate user input
    // if (!(email && password)) {
    //   res.status(400).send("All input is required");
    // }
    const { valid, errors } = validateLoginData({
      email,
      password,
    });
    if (!valid) return res.status(400).json(errors);

    // Validate if user exist in database
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      console.log(user.password);
      // Create token
      const token = jwt.sign(
        {
          user_id: user._id,
          email,
          username: user.username,
          access: user.access,
        },
        process.env.TOKEN_KEY,
        {
          expiresIn: "2h",
        }
      );
      //Save user token
      user.token = token;
      //return status
      res.status(200).json(user);
    }
    res.status(400).send("Invalid Credentials");
  } catch (err) {}
};

//Auth test
exports.home2 = (req, res) => {
  res.status(200).send("Welcome to home");
};
//Join tournament
exports.joinTournament = async (req, res) => {
  try {
    const { tour_name, player_id } = req.body;
    const hasTour = await TourR.findOne({ tour_name });
    if (!hasTour) {
      res.status(409).send("This tour is not found");
    }
    // if player < 20 Condition & not prime number
    const joinTour = await TourR.updateOne(
      { tour_name: tour_name },
      { $push: { player_name: player_id } }
    );

    //Join room
    res.status(201).send(joinTour);
  } catch (error) {
    console.log("error");
    console.log(error);
    res.send(error);
  }
};
//Exit tournament
exports.exitTournament = async (req, res) => {
  try {
    const { tour_name, player_id } = req.body;
    const hasTour = await TourR.findOne({ tour_name });
    if (!hasTour) {
      res.status(409).send("This tour is not found");
    }
    //if player is in that tour can exit
    const exitTour = await TourR.updateOne(
      { tour_name: tour_name },
      { $pull: { player_name: player_id } }
    );
    res.status(201).send(exitTour);
  } catch (error) {}
};
//Pair
