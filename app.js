require("dotenv").config();
require("./config/database").connect();

const express = require("express");
const app = express();

app.use(express.json());

app.listen(3000);

app.get("/", (req, res) => {
  res.send("Bridge Test");
});

module.exports = app;
