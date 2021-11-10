//----------------------------Server----------------------------//
const http = require("http");
const app = require("./app");
const server = http.createServer(app);
const io = require("socket.io")(server);
const { API_PORT } = process.env;
const port = process.env.PORT || API_PORT;

//Authen
const jwt = require("jsonwebtoken");
const config = process.env;

//----------------------------Database----------------------------//
const TourR = require("./model/tourR");
const { log } = require("console");

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

io.use(function (socket, next) {
  if (socket.handshake.query && socket.handshake.query.token) {
    console.log("pass");
    // console.log(socket.handshake.query);
    console.log(socket.handshake.query.token);
    jwt.verify(
      socket.handshake.query.token,
      config.TOKEN_KEY,
      function (err, decoded) {
        if (err) return next(new Error("Authentication error"));
        socket.decoded = decoded;
        next();
      }
    );
  } else {
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  console.log("A new user connected");
  console.log(socket.id);
  console.log("decode = " + JSON.stringify(socket.decoded));
  console.log("Data of user is " + socket.handshake.query.userName);
  console.log("gettime", socket.handshake.getTime);

  //test time
  //socket.emit('datetime', { datetime: new Date().getTime() });
  let timer = new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
  console.log("timer", timer);
  //find way to
  //set time out (millisec)
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
  //Join tour
  socket.on("join-tour", async (player_name, tour_name) => {
    socket.join(tour_name);
    console.log(`username ${player_name} is join the ${tour_name} tour`);
    //Add user to tour
    try {
      const hasTour = await TourR.findOne({ tour_name });
      if (!hasTour) {
        socket.emit("join-tour", "This tour is not found");
      }
      // if player < 20 Condition & not prime number
      const joinTour = await TourR.updateOne(
        { tour_name: tour_name },
        { $push: { player_name: player_name } }
      );

      //Send response to client
      socket.emit("join-tour", joinTour);

      //Force user to the room when time arrive
      //Test time out emit
    const withTimeout = (onSuccess, onTimeout, timeout) => {
      let called = false;
    
      const timer = setTimeout(() => {
        if (called) return;
        called = true;
        onTimeout();
      }, timeout);
    
      return (...args) => {
        if (called) return;
        called = true;
        clearTimeout(timer);
        onSuccess.apply(this, args);
      }
    }
    
    socket.emit("force-user", 1, 2, withTimeout(() => {
      console.log("success!");
    }, () => {
      console.log("timeout!");
    }, 1000));
    } catch (error) {
      console.log("error");
      console.log(error);
    }
    //Send response to client
    socket.emit("join-tour", `${player_name} connected Server`);
  });
  //Join room
  socket.on("join-room", (user, roomName) => {
    socket.join(roomName);
    console.log(`username ${user} is join the ${roomName} room`);
    //Send response to client
    socket.emit("join-room", `${user} connected Server`);
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
  socket.on("join-team", (user, team) => {
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
