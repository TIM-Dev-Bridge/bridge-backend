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

const _ = require("lodash");
let card = require("./handlers/card");

let users = {};
let tours = {};

//Authentication user
io.use(function (socket, next) {
  if (socket.handshake.query && socket.handshake.query.token) {
    console.log(socket.handshake.query.token);
    jwt.verify(
      socket.handshake.query.token,
      config.TOKEN_KEY,
      function (err, decoded) {
        if (err) return next(new Error("Authentication error"));
        socket.decoded = decoded;
        //Check login 1 get token and go login 2 -> pass
        if (socket.handshake.query.username != socket.decoded.username) {
          return next(new Error("Authentication error by user"));
        }
        next();
      }
    );
  } else {
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  if (users[socket.handshake.query.username] == undefined) {
    const user = {
      socket_id: socket.id,
      username: socket.handshake.query.username,
      tour: undefined,
      session: undefined,
    };
    users[socket.handshake.query.username] = user;
    console.log("User created", users[socket.handshake.query.username]);
  } else {
    users[socket.handshake.query.username].socket_id = socket.id;
  }

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
    } catch (error) {
      console.log(err);
      socket.emit("get-user-data", "Cannot find user data");
    }
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

  //Update user data
  socket.on("update-user", async (user_data) => {
    try {
      const hasUser = await User.findOne({ username: user_data.username });
      if (!hasUser) {
        return socket.emit("update-user", "Not has a user in database");
      }
      const user = await User.updateOne(
        {
          username: user_data.username,
        },
        {
          // $set: {
          //   first_name: user_data.first_name,
          //   last_name: user_data.last_name,
          //   display_name: user_data.display_name,
          //   birth_date: user_data.birth_date,
          //   // email: user_data.email,
          //   // username: user_data.username,
          //   password: user_data.password,
          // },
          $set: {
            ...user_data,
          },
        }
      );
      console.log("update user data successful");
    } catch (error) {
      console.log(err);
    }
  });

  //Create tour
  socket.on("create-tour", async (tour_data, callback) => {
    console.log("NEW TOUR ", tours[tour_data.tour_name]);
    try {
      //fist time not have
      const sameTour = await TourR.findOne({ tour_name: tour_data.tour_name });
      if (sameTour) {
        //callback(false, "This tour already create");
        return socket.emit("create-tour", "This tour already create");
      }
      //Encrypt password tour
      //encryptedPassword = await bcrypt.hash(tour_data.password, 10);
      //Create tournament on database
      // const tournament = await TourR.create({
      //   tour_name: tour_data.tour_name,
      //   max_player: tour_data.max_player,
      //   type: tour_data.type,
      //   password: encryptedPassword,
      //   players: tour_data.players,
      //   time_start: tour_data.time_start,
      //   status: tour_data.status,
      //   board_to_play: tour_data.board_to_play,
      //   minute_board: tour_data.minute_board,
      //   board_round: tour_data.board_round,
      //   movement: tour_data.movement,
      //   scoring: tour_data.scoring,
      //   barometer: tour_data.barometer,
      //   createBy: tour_data.createBy,
      // });
      // console.log("created tournament successful");
      //tour_data["player_pair"] = [];
      tour_data["player_waiting"] = [];
      tours[tour_data.tour_name] = tour_data;
      console.log(tours[tour_data.tour_name]);

      const tourList = [];
      for (const tour_name in tours) {
        let tourData = {
          host: "",
          title: tours[tour_name].tour_name,
          type: String(tours[tour_name].type),
          players: String(tours[tour_name].players.length),
        };
        tourList.push(tourData);
      }
      io.emit("update-tour-list", tourList);

      //callback(true, "Room created");
    } catch (error) {
      console.log("error is", error);
      //callback(false, "Failed to create room");
    }
  });
  socket.on("get-tours", () => {
    socket.emit("get-tours", tours);
    console.log(tours);
  });

  socket.on("getTourList", async (callback) => {
    const temp = await TourR.find();
    console.log("temp", temp, temp.length);
    const tourList = [];
    for (var i = 0; i < temp.length; i++) {
      console.log("FETCH", tours[temp[i].tour_name]);
      if (tours[temp[i].tour_name] == undefined) {
        temp[i].player_pair = [];
        tours[temp[i].tour_name] = temp[i];
      }
    }
    for (const tour_name in tours) {
      let tourData = {
        host: "",
        title: tours[tour_name].tour_name,
        type: String(tours[tour_name].type),
        players: String(tours[tour_name].players.length),
      };
      if (tourData.title == "tour-f2") {
        tourData.players = 10 + tours[tour_name].players.length;
      }
      tourList.push(tourData);
    }
    console.log(`tourList`, tourList);
    callback(tourList);
  });

  //Update tour
  socket.on("update-tour", async (tour_data) => {
    try {
      //fist time not have
      const haveTour = await TourR.findOne({ tour_name: tour_data.tour_name });
      if (!haveTour) {
        //callback(false, "This tour already create");
        console.log("failed");
        return socket.emit(
          "update-tour",
          "This tour name not have in our tournament"
        );
      }
      //Encrypt password tour
      encryptedPassword = await bcrypt.hash(tour_data.password, 10);
      //Update tournament on database
      const tournament = await TourR.updateOne(
        { tour_name: tour_data.tour_name },
        {
          $set: {
            tour_name: tour_data.tour_name,
            max_player: tour_data.max_player,
            type: tour_data.type,
            password: encryptedPassword,
            players: tour_data.players,
            time_start: tour_data.time_start,
            status: tour_data.status,
            board_to_play: tour_data.board_to_play,
            minute_board: tour_data.minute_board,
            board_round: tour_data.board_round,
            movement: tour_data.movement,
            scoring: tour_data.scoring,
            barometer: tour_data.barometer,
            createBy: tour_data.createBy,
          },
        }
      );

      console.log("updated success");
      //callback(true, "Room created");
    } catch (error) {
      console.log("error is", error);
      //callback(false, "Failed to create room");
    }
  });
  //Delete tour x/
  socket.on("delete-tour", async (tour_name, current_TD) => {
    try {
      //fist time not have
      const haveTour = await TourR.findOne({ tour_name: tour_name });
      if (!haveTour) {
        //callback(false, "This tour already create");
        return socket.emit(
          "delete-tour",
          "This tour name not have in our tournament"
        );
      }
      delete tours[tour_data.tour_name];
      //Create tournament on database
      const tournament = await TourR.deleteOne({
        tour_name: tour_name,
        createBy: current_TD,
      });
      console.log("delete successful");

      io.emit("delete-tour");
    } catch (error) {
      console.log("error is", error);
      //callback(false, "Failed to create room");
    }
  });
  //Update tour

  //Join tour
  socket.on("join-tour", async (player_name, tour_name, callback) => {
    //Response that player joined room
    console.log(`username ${player_name} is join the ${tour_name} tour`);
    //Add user to tour
    try {
      // const tour_data = await TourR.findOne({ tour_name });

      // if (!tour_data) {
      //   return
      // }
      //Time set
      //For human
      // let time = new Date().toLocaleString("en-US", {
      //   timeZone: "Asia/Jakarta",
      // });
      //For millisecond
      // let current_mil_time = new Date().getTime();
      // let start_mil_time = new Date(tour_data.time_start).getTime();
      // let diff_time = start_mil_time - current_mil_time;

      // if player < 20 Condition & not prime number
      // const joinTour = await TourR.updateOne(
      //   { tour_name: tour_name },
      //   { $push: { player_name: player_name } }
      // );
      socket.join(tour_name);
      // //Send response to client
      // socket.emit("join-tour", joinTour);
      // // Force user to the room when time arrive
      // // Test time out emit
      // const withTimeout = (onSuccess, onTimeout, timeout) => {
      //   let called = false;

      //   const timer = setTimeout(() => {
      //     if (called) return;
      //     called = true;
      //     onTimeout();
      //   }, timeout);

      //   return (...args) => {
      //     if (called) return;
      //     called = true;
      //     clearTimeout(timer);
      //     onSuccess.apply(this, args);
      //   };
      // };
      // console.log(tours[tour_name].player)
      console.log(tours[tour_name].players.length);
      console.log(tours[tour_name].max_player);
      console.log(users[player_name].tour);
      if (
        tours[tour_name].players.length < tours[tour_name].max_player &&
        users[player_name].tour == undefined
      ) {
        tours[tour_name].players.push({
          id: "",
          name: player_name,
          status: "in-pair",
          pair_id: "team1",
        });
        console.log("PUSH", tours[tour_name].players);
        // tours[tour_name].players.push(player_name)
        users[player_name].tour = tour_name;
        // tours[tour_name].player_waiting.push(player_name)
        var waitingPlayer = tours[tour_name].players
          .filter((player) => player.status == "waiting")
          .map((player) => player.name);
        if (tours[tour_name].players.length == 1) {
          tours[tour_name].players.push({
            id: "",
            name: "peterpan",
            status: "in-pair",
            pair_id: "team1",
          });
          tours[tour_name].players.push({
            id: "",
            name: "mutizaki",
            status: "in-pair",
            pair_id: "team3",
          });
          tours[tour_name].players.push({
            id: "",
            name: "seperite",
            status: "in-pair",
            pair_id: "team3",
          });
          tours[tour_name].players.push({
            id: "",
            name: "pokemon",
            status: "in-pair",
            pair_id: "team2",
          });
          tours[tour_name].players.push({
            id: "",
            name: "carspian",
            status: "in-pair",
            pair_id: "team4",
          });
          tours[tour_name].players.push({
            id: "",
            name: "qwerty",
            status: "in-pair",
            pair_id: "team4",
          });
          tours[tour_name].players.push({
            id: "",
            name: "teseded",
            status: "in-pair",
            pair_id: "team2",
          });
        }
        io.in(tour_name).emit("update-player-pair", tours[tour_name].players);
        io.in(tour_name).emit("");
        io.in(tour_name).emit("update-player-waiting", waitingPlayer);
        updateTourList();
        // callback(true);
      }
    } catch (error) {
      console.log(`error`, error);
    }
    //Send response to client
    socket.emit("join-tour", `${player_name} connected Server`);
  });

  const updateTourList = () => {
    const tourList = [];
    for (const tour_name in tours) {
      let tourData = {
        host: "",
        title: tours[tour_name].tour_name,
        type: String(tours[tour_name].type),
        players: String(tours[tour_name].players.length),
      };
      if (tour_name == "tour-f2") {
        tourData.players = 10 + tours[tour_name].players.length;
      }
      tourList.push(tourData);
    }
    io.emit("update-tour-list", tourList);
  };

  //Leave tour
  socket.on("leave-tour-room", async (player_name, callback) => {
    try {
      const hasTour = await TourR.findOne({ tour_name });
      // if (!hasTour) {
      //   return socket
      //     .to(tour_name)
      //     .emit("leave-tour", "This tour is not found");
      // }
      //if player is in that tour can exit
      // const exitTour = await TourR.updateOne(
      //   { tour_name: tour_name },
      //   { $pull: { player_name: user } }
      // );

      if (users[player_name].tour != undefined) {
        const tour_name = users[player_name].tour;
        console.log("player", player_name, "want to leave");
        if (
          tours[tour_name].players.find((player) => player.name == player_name)
            .status == "in-pair"
        ) {
          const yourPair = tours[tour_name].player_pair.find(
            (pair) => pair.user_a == player_name || pair.user_b == player_name
          );
          //remove your pair from list
          const newPair = tours[tour_name].players.filter(
            (pair) => pair != yourPair
          );
          tours[tour_name].player_pair = newPair;
          console.log("pair after remove : ", newPair);
          const yourPairName =
            player_name == yourPair.user_a ? yourPair.user_b : yourPair.user_a;
          //move your pair back to waiting
          tours[tour_name].players.find(
            (player) => player.name == yourPairName
          ).status = "waiting";
          console.log("players after leave :", tours[tour_name].players);
        }
        //remove tour from your data
        users[player_name].tour = undefined;
        console.log("player :=> ", player_name, "leave!");
        //remove you from tour

        tours[tour_name].players = tours[tour_name].players.filter(
          (player) => player.name != player_name
        );
        const newList = tours[tour_name].players
          .filter((player) => player.status == "waiting")
          .map((player) => player.name);
        const waitingPlayers = tours[tour_name].players.filter(
          (player) => player.status == "waiting"
        );
        console.log(
          "player after really leave ",
          tours[tour_name].players,
          newList
        );
        io.in(tour_name).emit("update-player-waiting", newList);
        // io.in(tour_name).emit('update-player-pair', tours[tour_name].player_pair)

        const tourList = [];
        for (const tour_name in tours) {
          let tourData = {
            host: "",
            title: tours[tour_name].tour_name,
            type: String(tours[tour_name].type),
            players: String(tours[tour_name].players.length),
          };
          if (tour_name == "tour-f2") {
            tourData.players = 10 + tours[tour_name].players.length;
          }
          tourList.push(tourData);
        }
        io.emit("update-tour-list", tourList);
      }
      // socket
      //   .to(tour_name)
      //   .emit("leave-tour", `User ${user} is exit this tournament`);
    } catch (error) {}

    if (users[player_name].tour != undefined) {
      const tour_name = users[player_name].tour;
      console.log("player", player_name, "want to leave");
      if (
        tours[tour_name].players.find((player) => player.name == player_name)
          .status == "in-pair"
      ) {
        const yourPair = tours[tour_name].player_pair.find(
          (pair) => pair.user_a == player_name || pair.user_b == player_name
        );
        //remove your pair from list
        const newPair = tours[tour_name].player_pair.filter(
          (pair) => pair != yourPair
        );
        tours[tour_name].player_pair = newPair;
        console.log("pair after remove : ", newPair);
        const yourPairName =
          player_name == yourPair.user_a ? yourPair.user_b : yourPair.user_a;
        //move your pair back to waiting
        tours[tour_name].players.find(
          (player) => player.name == yourPairName
        ).status = "waiting";
        console.log("players after leave :", tours[tour_name].players);
      }
      //remove tour from your data
      users[player_name].tour = undefined;
      console.log("player :=> ", player_name, "leave!");
      //remove you from tour

      tours[tour_name].players = tours[tour_name].players.filter(
        (player) => player.name != player_name
      );
      const newList = tours[tour_name].players
        .filter((player) => player.status == "waiting")
        .map((player) => player.name);
      const waitingPlayers = tours[tour_name].players.filter(
        (player) => player.status == "waiting"
      );
      console.log(
        "player after really leave ",
        tours[tour_name].players,
        newList
      );
      console.log(tours[tour_name]);
      io.in(tour_name).emit("update-player-waiting", newList);
      io.in(tour_name).emit("update-player-pair", tours[tour_name].player_pair);

      const tourList = [];
      for (const tour_name in tours) {
        let tourData = {
          host: "",
          title: tours[tour_name].tour_name,
          type: String(tours[tour_name].type),
          players: String(tours[tour_name].players.length),
        };
        if (tour_name == "tour-f2") {
          tourData.players = 10 + tours[tour_name].players.length;
        }
        tourList.push(tourData);
      }
      io.emit("update-tour-list", tourList);
    }
  });

  //Get user tour
  socket.on("get-tour-client", (tour_name) => {
    clients = io.sockets.adapter.rooms.get(tour_name);
    console.log(clients);
    socket.emit("get-tour-client", clients);
  });

  socket.on("send-lobby-chat", (sender, message) => {
    console.log(sender, " :=> send message to lobby >>>", message);
    const newMessage = {
      sender: sender,
      message: message,
    };
    io.emit("update-lobby-chat", newMessage);
  });

  socket.on("send-tour-chat", (sender, tour_name, message) => {
    console.log(sender, " :=> send message to lobby >>>", message);
    const newMessage = {
      sender: sender,
      message: message,
    };
    io.in(tour_name).emit("update-tour-chat", newMessage);
  });

  socket.on(
    "invite-player",
    (tour_name, invite_player_name, player_name, callback) => {
      console.log(
        invite_player_name,
        socket.id,
        " invite ",
        player_name,
        users[player_name].socket_id,
        "in ",
        tour_name
      );
      const sockets = {
        id: users[player_name].socket_id,
      };
      callback();
      io.in(sockets.id).emit("invite-by", invite_player_name);
    }
  );

  socket.on(
    "accept-invite",
    (tour_name, invite_player_name, player_name, callback) => {
      const pair = {
        user_a: invite_player_name,
        user_b: player_name,
      };
      tours[tour_name].players.find(
        (player) => player.name == invite_player_name
      ).status = "in-pair";
      tours[tour_name].players.find(
        (player) => player.name == player_name
      ).status = "in-pair";
      // const filterPlayer = tours[tour_name].player_waiting.filter((user)=> { return user != invite_player_name})
      // const finalPlayer = filterPlayer.filter((user)=> { return user != player_name})
      // tours[tour_name].player_waiting = finalPlayer
      tours[tour_name].player_pair.push(pair);
      console.log(tours[tour_name]);
      const waitingPlayer = tours[tour_name].players
        .filter((player) => player.status == "waiting")
        .map((player) => player.name);

      io.in(tour_name).emit("update-player-waiting", waitingPlayer);
      io.in(tour_name).emit("update-player-pair", tours[tour_name].player_pair);
      console.log(tours[tour_name].player_pair);
    }
  );

  socket.on("start", (tour_name) => {
    console.log("start");
    var teams = tours[tour_name].players.filter(
      (player) => player.status == "in-pair"
    );
    console.log(`teams`, teams);
    const unique = [...new Set(teams.map((player) => player.pair_id))];
    let half = Math.ceil(unique.length / 2);

    //Slice
    let first_pair = unique.slice(0, half);
    let second_pair = unique.slice(-half);
    
    //Mitchell full
    let tables = [];
    let rounds = [];

    //Chenge to function
    for (var round = 1; round <= tours[tour_name].board_round; round++) {
      for (var table = 1; table <= unique.length / 2; table++) {
        tables.push({
          table_id: `r${round}b${table}`, //mongodb id
          versus: `${first_pair[table]},${second_pair[table]}`,
        });
      }
      rounds.push({
        round_id: `${round}`,
        card: card.random_card(),
        tables: tables,
      });
      tables = [];
      let temp_second = second_pair.shift();
      second_pair.push(temp_second);
    }
    tours[tour_name][`rounds`] = rounds;
    io.in(tour_name).emit("start-tour", _.omit(...rounds, "card"));
    // res.status(201).send("back");
  });

  socket.on("send-bidding", (player_name, roomname, bid, status, callback) => {
    //Check play have status to use this socket
    socket.to(roomname).emit("send-bidding");
  });
  //Leave team
  //Join room
  //--Check user in a room
  socket.on("get-username-room", async (roomName) => {
    let userList = io.sockets.adapter.rooms.get(roomName);
    console.log(userList);
    socket.emit("get-username-room");
  });

  //create board
  socket.on("create-board", async (admin_name, title, data) => {
    const board = await TourR.create({
      admin_name,
      title,
      data,
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
