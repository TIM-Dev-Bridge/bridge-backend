//----------------------------Server----------------------------//
const http = require("http");
const app = require("./app");
const server = http.createServer(app);
const io = require("socket.io")(server);
const { API_PORT } = process.env;
const port = process.env.PORT || API_PORT;
const cors = require("cors");
app.use(
  cors({
    origin: "*",
  })
);
//Authen
const jwt = require("jsonwebtoken");
const config = process.env;
const bcrypt = require("bcryptjs");

//----------------------------Database----------------------------//
const TourR = require("./model/tourR");
const User = require("./model/user");
const Board = require("./model/board");
const { log } = require("console");

let users = [];

//Authentication user
// io.use(function (socket, next) {
//   if (socket.handshake.query && socket.handshake.query.token) {
//     console.log(socket.handshake.query.token);
//     jwt.verify(
//       socket.handshake.query.token,
//       config.TOKEN_KEY,
//       function (err, decoded) {
//         if (err) return next(new Error("Authentication error"));
//         socket.decoded = decoded;
//         next();
//       }
//     );
//   } else {
//     next(new Error("Authentication error"));
//   }
// });

io.on("connection", (socket) => {
  // console.log("A new user connected");
  //console.log(socket);
  socket.username = socket.handshake.query.username;
  // console.log(socket.id);
  console.log(socket.username);
  // console.log(socket.username);

  // console.log("decode = " + JSON.stringify(socket.decoded));
  // console.log("Data of user is " + socket.handshake.query.userName);
  // console.log("gettime", socket.handshake.getTime);
  // socket.emit("connected", "A new user connected");
  //Check user of socket server

  //socket temp
  //socket.name = socket.handshake.query.username;
  //console.log(socket);
  // console.log(io.allSockets());
  // console.log(socket.name);
  //console.log(io.sockets.socket());
  //console.log(io.sockets,sockets.id);

  //test time
  //socket.emit('datetime', { datetime: new Date().getTime() });
  // let timer = new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
  // let timer2 = new Date().getTime();
  // console.log("timer", timer);
  // console.log("timer2", timer2);
  //find way to
  //set time out (millisec)
  //Save session

  //Get current user data
  socket.on("get-user-data", async (username) => {
    try {
      const user_data = await User.findOne({ username: username });
      socket.emit("get-user-data", user_data);
    } catch (error) {}
  });

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

  //Create tour
  socket.on("create-tour", async (tour_data) => {
    try {
      //fist time not have
      const sameTour = await TourR.findOne({ tour_name: tour_data.tour_name });
      if (sameTour) {
        callback(false, "This tour already create");
        return socket.emit("create-tour", "This tour already create");
      }
      //Encrypt password tour
      encryptedPassword = await bcrypt.hash(tour_data.password, 10);
      //Create tournament on database
      const tournament = await TourR.create({
        tour_name: tour_data.tour_name,
        max_player: tour_data.max_player,
        type: tour_data.type,
        password: encryptedPassword,
        player_name: tour_data.player_name,
        time_start: tour_data.time_start,
        status: tour_data.status,
        board_to_play: tour_data.board_to_play,
        minute_board: tour_data.minute_board,
        board_round: tour_data.board_round,
        movement: tour_data.movement,
        scoring: tour_data.scoring,
        barometer: tour_data.barometer,
        createBy: tour_data.createBy,
      });
      console.log("tournament is " + tournament);
      //callback(true, "Room created");
    } catch (error) {
      //callback(false, "Failed to create room");
    }
  });

  //Join tour
  socket.on("join-tour", async (player_name, tour_name) => {
    //Response that player joined room
    console.log(`username ${player_name} is join the ${tour_name} tour`);
    //Add user to tour
    try {
      const tour_data = await TourR.findOne({ tour_name });
      if (!tour_data) {
        return socket.emit("join-tour", "This tour is not found");
      }
      //Time set
      //For human
      // let time = new Date().toLocaleString("en-US", {
      //   timeZone: "Asia/Jakarta",
      // });
      //For millisecond
      let current_mil_time = new Date().getTime();
      let start_mil_time = new Date(tour_data.time_start).getTime();
      let diff_time = start_mil_time - current_mil_time;

      // if player < 20 Condition & not prime number
      const joinTour = await TourR.updateOne(
        { tour_name: tour_name },
        { $push: { player_name: player_name } }
      );
      socket.join(tour_name);
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
        };
      };

      socket.emit(
        "force-user",
        "success",
        withTimeout(
          () => {},
          () => {
            socket.emit("force-user", "Force");
          },
          diff_time
        )
      );
    } catch (error) {
      console.log("error");
      console.log(error);
    }
    //Send response to client
    socket.emit("join-tour", `${player_name} connected Server`);
  });
  //Leave tour
  socket.on("leave-tour", async (user, tour_name) => {
    try {
      const hasTour = await TourR.findOne({ tour_name });
      if (!hasTour) {
        res.status(409).send("This tour is not found");
      }
      //if player is in that tour can exit
      const exitTour = await TourR.updateOne(
        { tour_name: tour_name },
        { $pull: { player_name: user } }
      );
      res.status(201).send(exitTour);
    } catch (error) {}
  });

  //Get user tour
  socket.on("get-tour-client", (tour_name) => {
    clients = io.sockets.adapter.rooms.get(tour_name);
    //clients = io.sockets[0].username;
    console.log(clients);
    socket.emit("get-tour-client", clients);
  });

  //Invite to team
  socket.on("invite-team", (tour_name, from, to) => {
    try {
      socket.emit("invite-team", (from, to), `${from} is invited ${to}`);
    } catch (error) {}
  });
  //Recieve invited team
  socket.on("recieve-invite-team", (tour_name, from, to, msg) => {
    try {
      //Save on DB
      //Check user in Socket Server
      if (msg == "Accept" && from.status_team == 0 && to.status_team == 0) {
        from.status_team = 1;
        to.status_team = 1;
        return socket.emit("pair-team", tour_name, from, to, msg);
      } else if (msg == "Decline") {
        return socket.emit("pair-team", tour_name, from, to, msg);
      }
    } catch (error) {}
  });
  //Leave team
  socket.on("leave-team", (user) => {});
  //Manage team
  //Join room
  socket.on("join-room", (user, roomName) => {
    socket.join(roomName);
    console.log(`username ${user} is join the ${roomName} room`);
    //Send response to client
    socket.to(roomName).emit("join-room", `${user} connected Server`);
  });
  //Leave room
  socket.on("leave-room", async (user, roomName) => {
    socket.leave(roomName);
    socket.to(roomName).emit("leave-room", `${user} disconnected Server`);
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
    socket.emit("get-username-room");
  });

  //create board
  socket.on("create-board", async (admin_name, title, data) => {
    const board = await TourR.create({
      admin_name: admin_name,
      title: title,
      data: data,
    });
    socket.emit("create-board", board);
  });
  socket.on("disconnect", () => {
    console.log("User was disconnect");
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
