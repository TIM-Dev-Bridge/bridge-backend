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
} = require("../middleware/validators/users");
const { log } = require("console");

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
      confirm_password,
    } = req.body;

    const { valid, errors } = validateSignupData({
      first_name,
      last_name,
      display_name,
      birth_date,
      email,
      username,
      password,
      confirm_password,
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
      access: "user",
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
  } catch (err) {
    console.log(err);
  }
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

//Test
exports.home2 = (req, res) => {
  let errors = {};
  //let email = "test@gmail.com";
  //let password = "12345678";
  let email = "";
  let password = "";
  if (!email) errors.email = "Must not be empty";
  if (!password) errors.password = "Must not be empty";
  res.status(409).send(errors);
};

//Get tournament data
exports.getTournamentData = async (req, res) => {
  try {
    const { tour_name } = req.query;
    const tour_data = await TourR.findOne({ tour_name: tour_name });
    res.status(201).send(tour_data);
  } catch (error) {
    console.log(err);
    res.status(409).send("This tour is not found");
  }
};
//Get user data
exports.getUserData = async (req, res) => {
  try {
    const { username } = req.query;
    const user_data = await User.findOne({ username: username });
    res.status(201).send(user_data);
  } catch (error) {
    console.log(err);
    res.status(409).send("This tour is not found");
  }
};

//Update user data
exports.updateUserData = async (req, res) => {
  try {
    const {
      username,
      first_name,
      last_name,
      display_name,
      birth_date,
      password,
    } = req.body;
    const hasUser = await User.findOne({ username: username });
    if (!hasUser) {
      return res.status(409).send("This user is not found");
    }
    const user_data = await User.updateOne(
      {
        username: username,
      },
      {
        $set: {
          first_name: first_name,
          last_name: last_name,
          display_name: display_name,
          birth_date: birth_date,
          // email: user_data.email,
          // username: user_data.username,
          password: password,
        },
      }
    );
    console.log("update user data successful");
    res.status(201).send(user_data);
  } catch (error) {
    console.log(err);
  }
};

exports.updateTourData = async (req, res) => {
  try {
    const {
      tour_name,
      max_player,
      type,
      password,
      player_name,
      time_start,
      status,
      board_to_play,
      minute_board,
      board_round,
      movement,
      scoring,
      barometer,
      createBy,
    } = req.body;
    //fist time not have
    const haveTour = await TourR.findOne({ tour_name: tour_name });
    if (!haveTour) {
      //callback(false, "This tour already create");
      return res.status(409).send("This tour is not found");
    }
    //Encrypt password tour
    encryptedPassword = await bcrypt.hash(password, 10);
    //Update tournament on database
    const tour_data = await TourR.updateOne(
      { tour_name: tour_name },
      {
        $set: {
          tour_name: tour_name,
          max_player: max_player,
          type: type,
          password: password,
          player_name: player_name,
          time_start: time_start,
          status: status,
          board_to_play: board_to_play,
          minute_board: minute_board,
          board_round: board_round,
          movement: movement,
          scoring: scoring,
          barometer: barometer,
          createBy: createBy,
        },
      }
    );
    console.log("updated success");
    res.status(201).send(tour_data);
  } catch (error) {
    console.log("error is", error);
  }
};

//PairTeam
exports.manageTour = async (req, res) => {
  try {
    console.log("start");
    let tour_match = {};
    let objectManage = {
      player1: "player2",
    };
    let teamSlot = {
      Team1: { s1: "player1", s2: "player2" },
      Team2: { s1: "player3", s2: "player4" },
      Team3: { s1: "player5", s2: "player6" },
      Team4: { s1: "player7", s2: "player8" },
    };
    let ArraySlot = [
      { s1: "player1", s2: "player2" },
      { s1: "player3", s2: "player4" },
      { s1: "player5", s2: "player6" },
      { s1: "player7", s2: "player8" },
    ];
    let TempSlot = [];
    console.log(Object.keys(teamSlot));
    //Push
    console.log(ArraySlot);
    ArraySlot.push({ s1: "player9", s2: "player10" });
    ArraySlot.push({ s1: "player11", s2: "player12" });
    console.log(ArraySlot[0]);
    for (var temp in ArraySlot) {
      TempSlot["Team" + temp] = ArraySlot[temp];
    }
    //Slice
    let first_pair = Object.keys(TempSlot).slice(
      0,
      Object.keys(TempSlot).length / 2
    );
    let second_pair = Object.keys(TempSlot).slice(
      Object.keys(TempSlot).length / 2,
      Object.keys(TempSlot).length
    );
    console.log(Object.keys(TempSlot).length);
    console.log("num", first_pair);
    console.log("num", second_pair);
    //Mitchell full
    let Table = {};
    let play_round = 3;
    for (var round = 0; round < play_round; round++) {
      Table["round" + round] = {};
      for (var table = 0; table < Object.keys(TempSlot).length / 2; table++) {
        Table["round" + round]["table" + table] =
          first_pair[table] + "," + second_pair[table];
      }
      let temp_second = second_pair.shift();
      second_pair.push(temp_second);
    }
    console.log(Table);

    console.log("finish");
    res.status(201).send("back");
  } catch (error) {
    console.log(error);
  }
};


exports.getAnnouncement = async (req, res)=> {
  try {
    const { id } = req.query
    const board_data = await Board.findOne({_id: id})
    res.status(200).send(board_data)
  } catch (error) {
    console.log(err);
    res.status(409).send("This tour is not found");
  }
}

exports.getAnnouncementsByOffset = async (req, res)=> {
  try {
    const { offset, limit } = req.query
    const boards = await Board.find().sort({"data.time": -1}).skip(offset).limit(limit)
    console.log(boards)
    res.status(200).send(boards)
  } catch (error) {
    console.log(err);
    res.status(409).send("This tour is not found");
  }
}

exports.addAnnouncement = async (req, res)=> {
  try {
    await Board.create(req.body);
    res.status(200).send('OK')
  } catch (error) {
    console.log(err);
    res.status(409).send("This tour is not found");
  }
}

exports.updateAnnouncement = async (req, res)=> {
  try {
    console.log('UPDATE',req.body)
    await Board.findOneAndUpdate({_id: req.body.id}, req.body)
    res.status(200).send('OK')
  } catch (error) {
    console.log(err);
    res.status(409).send("This tour is not found");
  }
}