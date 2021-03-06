require("dotenv").config();
require("../config/database").connect();

const express = require("express");
const TourD = require("../model/tourD");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");

const app = express();

app.use(express.json());

//Register Tournament Director
exports.registerTourD = async (req, res) => {
  //register logic
  try {
    const { first_name, last_name, email, password } = req.body;

    //Validate user input
    if (!(email && password && first_name && last_name)) {
      res.status(400).send("All input is required");
    }
    //Validate if user exist in database
    const oldUser = await TourD.findOne({ email });

    if (oldUser) {
      res.status(409).send("User already exist. Please login");
    }

    //Encrypt user password
    encryptedPassword = await bcrypt.hash(password, 10);

    //Create user in database
    const user = await TourD.create({
      first_name,
      last_name,
      email: email.toLowerCase(),
      password: encryptedPassword,
    });

    //Create token
    const token = jwt.sign(
      { user_id: user._id, email },
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

//Login Tournament Director
exports.loginTourD = async (req, res) => {
  //Login logic
  try {
    //Get user input
    const { email, password } = req.body;

    //Validate user input
    if (!(email && password)) {
      res.status(400).send("All input is required");
    }

    // Validate if user exist in database
    const user = await TourD.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      // Create token
      const token = jwt.sign(
        { user_id: user._id, email },
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
