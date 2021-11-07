//----------------------------Server----------------------------//
const http = require("http");
const app = require("./app");
const server = http.createServer(app);
const io = require("socket.io")(server);
const { API_PORT } = process.env;
const port = process.env.PORT || API_PORT;

//----------------------------Database----------------------------//
const TourR = require("./model/tourR");

let users = [];

io.on("connection", (socket) => {
  console.log("A new user connected");
  console.log(socket.id);
  socket.on("join-server", (username) => {
    const user = {
      username,
      id: socket.id,
    };
    users.push(user);
    io.emit("new user", users);
    console.log(users);
  });
  socket.on("join", async (name) => {
    console.log(`${name} is joined tournament`);
    TourR.find()
      .select("player_name -_id")
      .then((result) => {
        socket.emit("output-rooms", result);
        console.log(result);
      });
  });
  socket.on("disconnect", () => {
    console.log("User was disconnect");
  });
});


server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
