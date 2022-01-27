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
// app.use(
//   cors({
//     origin: "http://localhost:3000",
//     credentials: true, //access-control-allow-credentials:true
//     optionSuccessStatus: 500,
//   })
// );
// app.use(function (req, res, next) {
//   res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000"); //หรือใส่แค่เฉพาะ domain ที่ต้องการได้
//   res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type");
//   res.setHeader("Access-Control-Allow-Credentials", true);
//   next();
// });
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
let score = require("./handlers/score");
let board = require("./handlers/board");
const { access } = require("fs");

let users = {};
let tours = {};

const DIRECTION = {
  N: 0,
  E: 1,
  S: 2,
  W: 3,
};

const INIT = {
  doubles: [
    [false, false],
    [false, false],
  ],
};

const TYPE = {
  DBL: 0,
  RDBL: 1,
};

const CONTRACT = {
  PASS: -1,
  DBL: 99,
};

const BOARD = board.createBoard();

const ioToRoomOnPlaying = ({ status = "", room = "", payload = {} }) => {
  io.to(room).emit("playing", { status, payload });
};

const ioToRoomOnBiddingPhase = ({
  room = "",
  contract = -1,
  tour_name,
  round_id,
  table_id,
  nextDirection = access_table(tour_name, round_id, table_id).bidding.round % 4,
}) => {
  console.log("next", nextDirection);
  ioToRoomOnPlaying({
    room,
    status: "waiting_for_bid",
    payload: {
      contract,
      nextDirection,
      round: access_table(tour_name, round_id, table_id).bidding.round,
      turn: access_table(tour_name, round_id, table_id).playing.turn,
    },
  });
};

const matchmaking = (tour_name) => {
  let unique_team = _.range(1, tours[tour_name].players.length / 2 + 1).sort();
  let half = Math.ceil(unique_team.length / 2);

  console.log(`unique_team`, unique_team);
  //Slice
  let first_pair = unique_team.slice(0, half);
  let second_pair = unique_team.slice(-half);

  //Mitchell full
  let tables = [];
  let rounds = [];

  const bidding = {
    round: 0,
    declarer: 0,
    passCount: 0,
    isPassOut: true,
    maxContract: -1,
    prevBidDirection: 0,
    firstDirectionSuites: [
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ],
    doubles: [
      [false, false],
      [false, false],
    ],
  };

  const playing = {
    turn: 0,
    doubles: [],
    bidSuite: 0,
    communityCards: [],
    initSuite: undefined,
    trick: [],
  };

  //Change to function create tournament round
  for (var round = 0; round < tours[tour_name].board_round; round++) {
    for (var table = 0; table < unique_team.length / 2; table++) {
      let temp_versus = _.sortBy(
        tours[tour_name].players.filter(
          (player) =>
            player.pair_id === first_pair[table] ||
            player.pair_id === second_pair[table]
        ),
        ["pair_id"]
      );
      console.log("temp_versus", temp_versus);
      tables.push({
        table_id: `r${round + 1}b${table + 1}`, //mongodb id
        board_num: `${round + 1}`,
        versus: `${first_pair[table]},${second_pair[table]}`,
        bidding: bidding,
        playing: playing,
        count_player: [],
      });
    }
    rounds.push({
      round_id: `${round + 1}`,
      card: card.random_card(),
      tables: tables,
    });
    tables = [];
    let temp_second = second_pair.shift();
    second_pair.push(temp_second);
  }
  return rounds;
};

const access_table = (tour_name, round_id, table_id) => {
  let round = _.find(tours[tour_name].rounds, ["round_id", round_id]);
  let table = _.find(round.tables, ["table_id", table_id]);
  return table;
};

// // Authentication user
// io.use(function (socket, next) {
//   if (socket.handshake.query && socket.handshake.query.token) {
//     console.log(socket.handshake.query.token);
//     jwt.verify(
//       socket.handshake.query.token,
//       config.TOKEN_KEY,
//       function (err, decoded) {
//         if (err) return next(new Error("Authentication error"));
//         socket.decoded = decoded;
//         //Check login 1 get token and go login 2 -> pass
//         if (socket.handshake.query.username != socket.decoded.username) {
//           return next(new Error("Authentication error by user"));
//         }
//         next();
//       }
//     );
//   } else {
//     next(new Error("Authentication error"));
//   }
// });

io.on("connection", (socket) => {
  console.log("can connected");
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
  socket.on("get-user-data", () => {
    try {
      // const user_data = await User.findOne({ username: username });
      // socket.emit("get-user-data", user_data);
      console.log(users);
      console.log("in function");
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
      let encryptedPassword = await bcrypt.hash(tour_data.password, 10);
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
          pair_id: 1,
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
            pair_id: 1,
          });
          tours[tour_name].players.push({
            id: "",
            name: "mutizaki",
            status: "in-pair",
            pair_id: 4,
          });
          tours[tour_name].players.push({
            id: "",
            name: "seperite",
            status: "in-pair",
            pair_id: 3,
          });
          tours[tour_name].players.push({
            id: "",
            name: "pokemon",
            status: "in-pair",
            pair_id: 2,
          });
          tours[tour_name].players.push({
            id: "",
            name: "carspian",
            status: "in-pair",
            pair_id: 3,
          });
          tours[tour_name].players.push({
            id: "",
            name: "qwerty",
            status: "in-pair",
            pair_id: 4,
          });
          tours[tour_name].players.push({
            id: "",
            name: "teseded",
            status: "in-pair",
            pair_id: 2,
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
  //#start
  socket.on("start", (tour_name) => {
    let rounds = matchmaking(tour_name);
    tours[tour_name][`rounds`] = rounds;
    io.in(tour_name).emit(
      "start-tour",
      rounds.map(({ round_id, tables }) => {
        let new_table = tables.map(({ table_id, versus }) => ({
          table_id,
          versus,
        }));
        return { round_id, tables: new_table };
      })

      // rounds.map(({ card, ...round }) => {
      //   let new_table = round.tables.map(({ bidding, playing, ...table }) => ({
      //     ...table,
      //   }));
      //   return { ...round, tables: new_table };
      // }),

      // rounds.map((round) => {
      //   let newTable = round.tables.map((table) =>
      //     _.omit(table, ["bidding", "playing"])
      //   );
      //   console.log(`newTable`, newTable)
      //   return { round: _.omit(round, ["card","tables"]), tables: newTable };
      // }),
    );
  });

  /*
   * Join table #jt
   */
  socket.on(
    "join",
    ({
      player_id,
      player_name,
      tour_name,
      room = "room_1",
      round_id,
      table_id,
    }) => {
      console.log("tour_name", tour_name);
      socket.join(room);
      let clients = io.sockets.adapter.rooms.get(room);
      /// return current players.
      // io.to(room).emit("waiting_for_start", tours[tour_name].players);

      /// if fully player, change to 'bidding phase'.
      if (clients.size === 4) {
        ioToRoomOnBiddingPhase({ room, tour_name, round_id, table_id });
        console.log("can go bidding phase");
      }
    }
  );

  /*
   * Bidding phase #bp
   */
  socket.on(
    "bid",
    ({
      player_id,
      room = "room_1",
      contract = CONTRACT.PASS,
      direction = DIRECTION.N,
      //Chage
      tour_name = "Mark1",
      round_id = "1",
      table_id = "r1b1",
    }) => {
      const nextDirection = direction < 3 ? parseInt(direction, 10) + 1 : 0;

      /// convert contract to suite.
      const suite = contract % 5;
      const team = direction % 2;
      const anotherTeam = nextDirection % 2;
      const isPass = suite === -1;
      let access_bidding = access_table(
        (tour_name = "Mark1"),
        (round_id = "1"),
        (table_id = "r1b1")
      ).bidding;

      let access_playing = access_table(
        (tour_name = "Mark1"),
        (round_id = "1"),
        (table_id = "r1b1")
      ).playing;

      if (isPass) {
        ++access_bidding.passCount;
        if (access_bidding.passCount === 3 && !access_bidding.isPassOut) {
          const winnerSuite = access_bidding.maxContract % 5;
          const winnerTeam = access_bidding.declarer % 2;
          const isSameTeam =
            access_bidding.firstDirectionSuites[winnerTeam][winnerSuite] % 2 ===
            winnerTeam;

          /// if winner is the first one who bidding this suite (max contract suite), he is declarer.
          /// else another player in his team is declarer.
          /// leader is next direction of declarer.
          const declarer = isSameTeam
            ? access_bidding.firstDirectionSuites[winnerTeam][winnerSuite]
            : access_bidding.declarer;
          const leader = declarer < 3 ? declarer + 1 : 0;

          access_playing.bidSuite = winnerSuite;
          access_playing.doubles = access_bidding.doubles;
          console.log("pass");
          /// clear access_table here ...
          access_bidding.passCount = 0;
          access_bidding.isPassOut = true;
          access_bidding.doubles = INIT.doubles;

          console.log(`playing.doubles`, access_playing.doubles);

          ioToRoomOnPlaying({
            room,
            status: "initial_playing",
            payload: {
              leader,
              round: access_bidding.round,
              bidSuite: winnerSuite,
              turn: ++access_playing.turn,
            },
          });
          return;
        }
        if (access_bidding.passCount === 4) {
          access_bidding.passCount = 0;

          if (++access_bidding.round >= tour.maxRound) {
            /// clear all temp var here ...
            ioToRoomOnPlaying({
              room,
              status: "ending",
              payload: {},
            });
            return;
          }

          ioToRoomOnBiddingPhase({
            room,
            contract,
            nextDirection,
            tour_name,
            round_id,
            table_id,
          });

          return;
        }
      } else {
        /// reset passCount to zero.
        access_bidding.passCount = 0;
        access_bidding.isPassOut = false;

        /* 
                TODO: check and handle available to dbl or rdbl. 
                * handle on impossible case.
            */
        if (contract === CONTRACT.DBL) {
          if (
            !access_bidding.doubles[team][TYPE.DBL] &&
            !access_bidding.doubles[anotherTeam][TYPE.DBL]
          )
            access_bidding.doubles[team][TYPE.DBL] = true;
          else access_bidding.doubles[team][TYPE.RDBL] = true;
        } else {
          access_bidding.doubles = INIT.doubles;

          /// did player bidding first suite of his team.
          const isFirst =
            access_bidding.firstDirectionSuites[team][suite] === 0;

          if (isFirst)
            access_bidding.firstDirectionSuites[team][suite] = direction;

          if (access_bidding.maxContract < contract) {
            access_bidding.declarer = direction;
            access_bidding.maxContract = contract;
            console.log("contract", contract);
            console.log("maxContract", access_bidding.maxContract);
          }
          //else send error
        }
      }
      //ioToRoomOnBiddingPhase({ room, contract, nextDirection });
      ioToRoomOnBiddingPhase({
        room,
        contract,
        nextDirection,
        tour_name,
        round_id,
        table_id,
      });
    }
  );

  socket.on(
    "play_card",
    ({ player_id, room = "room_1", card, direction, turn }) => {
      /* 
            TODO: check client and server property are according together. 
        */
      let access_bidding = access_table(
        (tour_name = "Mark1"),
        (round_id = "1"),
        (table_id = "r1b1")
      ).bidding;

      let access_playing = access_table(
        (tour_name = "Mark1"),
        (round_id = "1"),
        (table_id = "r1b1")
      ).playing;
      if (turn !== access_playing.turn) return;

      const nextDirection = direction < 3 ? parseInt(direction, 10) + 1 : 0;
      const suite = parseInt(card / 13, 10);

      access_playing.communityCards.push({
        card,
        direction,
      });

      /// if initSuite is 'undefined', it mean you are leader.
      access_playing.initSuite =
        access_playing.initSuite === undefined
          ? suite
          : access_playing.initSuite;

      if (access_playing.communityCards.length === 4) {
        const bidSuite = access_playing.bidSuite;
        const sameBidSuiteCards = access_playing.communityCards.filter(
          ({ card }) => parseInt(card / 13, 10) === bidSuite
        );
        const sameInitSuiteCards = access_playing.communityCards.filter(
          ({ card }) => parseInt(card / 13, 10) === access_playing.initSuite
        );
        let maxCard = 0;

        /* 
                playing card of 'leader' affect to his card suite become to the secondary most valuable suite of this turn.
                the most valuable suite of round is 'bidding_suite' from 'bidding_phase' (if is not 'no trump').
                bidSuite 4 is mean 'no trump'.
            */
        if (sameBidSuiteCards.length > 0 && bidSuite !== 4)
          maxCard = _.maxBy(sameBidSuiteCards, "card");
        //#AP
        // access_playing.trick;
        else maxCard = _.maxBy(sameInitSuiteCards, "card");

        const { direction: leader } = _.find(
          access_playing.communityCards,
          maxCard
        );
        //Calculate trick if leader = NS then + 1
        leader % 2 == 0 ? access_playing.trick[0]++ : access_playing.trick[1]++;

        console.log(`access_playing`, access_playing);
        console.log(`leader`, leader);
        access_playing.initSuite = undefined;
        access_playing.communityCards = [];

        /// playing for 13 turn.
        if (access_playing.turn >= 2) {
          if (++access_bidding.round >= 2 /*tours["Mark1"].maxRound*/) {
            /// clear all temp var here ...
            ioToRoomOnPlaying({
              room,
              status: "ending",
              payload: {},
            });
            return;
          }
          //Calulate score for 13 turn
          //access_playing.score = score.calScore()
          ioToRoomOnBiddingPhase({
            room,
            // contract,
            nextDirection,
            tour_name,
            round_id,
            table_id,
          });

          access_playing.turn = 0;
          return;
        }

        ioToRoomOnPlaying({
          room,
          status: "initial_turn",
          payload: {
            leader,
            turn: ++access_playing.turn,
          },
        });
        return;
      }

      ioToRoomOnPlaying({
        room,
        status: "default",
        payload: {
          card,
          nextDirection,
          prevDirection: direction,
        },
      });
    }
  );

  //Leave team
  //Join room
  //--Check user in a room
  socket.on("get-username-room", async (room) => {
    let userList = io.sockets.adapter.rooms.get(room);
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
