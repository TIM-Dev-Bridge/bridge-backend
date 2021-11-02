require("dotenv").config();
// require("./config/database").connect();

const express = require("express");
const { restart } = require("nodemon");
const User = require("./model/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("./middleware/auth");

const app = express();

app.use(express.json());

const { home, register, login, home2 } = require("./handlers/users");
app.get("/home1", home);
app.post("/register", register);
app.post("/login", login);
app.get("/home2", auth, home2);

module.exports = app;
