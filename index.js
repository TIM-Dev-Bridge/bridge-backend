//----------------------------Server----------------------------//
const http = require("http");
const app = require("./app");
const server = http.createServer(app);
const io = require("socket.io")(server);
const { API_PORT } = process.env;
const port = process.env.PORT || API_PORT;

//Authen
const jwt = require('jsonwebtoken');
const config = process.env;

//----------------------------Database----------------------------//
const TourR = require("./model/tourR");

let users = [];

// Authentication with socket io
// io.use(async (socket, next) => {
//   try {
//     const token = socket.handshake.query.token;
//     const payload = await jwt.verify(token, process.env.SECRET);
//     socket.userId = payload.id;
//     next();
//   } catch (err) {}
// });

io.use(function(socket, next){
  if (socket.handshake.query && socket.handshake.query.token){
    console.log('pass');
    // console.log(socket.handshake.query);
    console.log(socket.handshake.query.token);
    jwt.verify(socket.handshake.query.token, config.TOKEN_KEY, function(err, decoded) {
      if (err) return next(new Error('Authentication error'));
      socket.decoded = decoded;
      next();
    });
  }
  else {
    next(new Error('Authentication error'));
  }    
})

io.on("connection", (socket) => {
  console.log("A new user connected");
  console.log(socket.id);
  console.log('Data of user is ' + socket.handshake.query.userName);
  //Save session

  //Join socket io server
  socket.on("join-server", (username) => {
    const user = {
      username,
      id: socket.id,
    };
    users.push(user);
    io.emit("new user", users);
    console.log(users);
  });
  //Join room
  socket.on("join-room",  (user, roomName) => {
    socket.join(roomName);
    console.log(`username ${user} is join the ${roomName} room`);
    //Send response to client
    socket.emit('join-room',`${user} connected Server`)
    // socket.on("join-team",  (user, team) => {
    //   socket.join(team);
    //   console.log(`username ${user} is join the ${team} team`);
    // });
  });
  //Leave room
  socket.on("leave-room", async (user, roomName) => {
    socket.leave(roomName);
    console.log(`user name ${user} is join the ${roomName} room`);
  });
  //Manage room
  socket.on("manage-room", async (roomName) => {
    TourR.find()
      .select("player_name -_id")
      .then((result) => {
        let lenUser = result[0].player_name.length;
        socket.emit("output-rooms", result);
        console.log(result);
        console.log("len = " + lenUser);
      });
    //Find player
  });
  //Join team
  socket.on("join-team",  (user, team) => {
    socket.join(team);
    console.log(`username ${user} is join the ${team} team`);
  });
  //--Check user in a room
  socket.on("get-username-room", async (roomName) => {
    let userList = io.sockets.adapter.rooms.get(roomName);
    console.log(userList);
    socket.emit(userList);
  });

  //Join tournament
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
