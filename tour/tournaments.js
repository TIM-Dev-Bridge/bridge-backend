require("dotenv").config();
require("../config/database").connect();

const express = require("express");
const TourR = require("../model/tourR");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");

const app = express();

app.use(express.json());

//Create tournament
exports.createTournament = async (req, res) => {
  //register logic
  try {
    const { tour_name, max_player, password, type } = req.body;

    //Validate user input
    if (!(tour_name && max_player && password)) {
      res.status(400).send("All input is required");
    }
    //Validate if user exist in database
    const oldTour = await TourR.findOne({ tour_name });

    if (oldTour) {
      res.status(409).send("User already exist. Please login");
    }

    //Encrypt user password
    encryptedPassword = await bcrypt.hash(password, 10);

    //Create user in database
    const tournament = await TourR.create({
      tour_name,
      max_player,
      type,
      password: encryptedPassword,
    });

    //Create token
    const token = jwt.sign(
      { tournament_id: tournament._id, tour_name },
      process.env.TOKEN_KEY,
      {
        expiresIn: "2h",
      }
    );

    //Save user token
    tournament.token = token;

    //return new user
    res.status(201).json(tournament);
  } catch (err) {}
};

exports.updateTournament = async (req, res) => {
  try {
    const { tour_name, new_tour_name, max_player, password, type } = req.body;
    const hasTour = await TourR.findOne({ tour_name });
    if (!hasTour) {
      res.status(409).send("This tour is not found");
    }

    const tournament = await TourR.updateOne({
      tour_name: new_tour_name,
      max_player,
      password,
      player_name,
      type,
    });
    //return new user
    res.status(201).json(tournament);
  } catch (error) {}
};

exports.deleteTournament = async (req, res) => {
  try {
    const { tour_name } = req.body;
    const delTour = await TourR.deleteOne({ tour_name: tour_name });
    res.status(201).json(delTour);
  } catch (error) {}
};
