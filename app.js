require("dotenv").config();
require("./config/database").connect();

const express = require("express");
const { restart } = require("nodemon");
const User = require("./model/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

app.use(express.json());

app.listen(3000);

app.get("/", (req, res) => {
  res.send("Bridge Test");
});

//Register
app.post("/register", async (req, res) => {
  //register logic
  try {
    const { first_name, last_name, email, password } = req.body;

    //Validate user input
    if (!(email && password && first_name && last_name)) {
      res.status(400).send("All");
    }
    //Validate if user exist in database
    const oldUser = await User.findOne({ email });

    if (oldUser) {
      res.status(409).send("User already exist. Please login");
    }

    //Encrypt user password
    encryptedPassword = await bcrypt.hash(password, 10);

    //Create user in database
    const user = await User.create({
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
});

//Login
app.post("/login", (req, res) => {
  //Login logic
});

module.exports = app;
