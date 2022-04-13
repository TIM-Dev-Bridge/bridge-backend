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
let card_handle = require("./handlers/card");
let score = require("./handlers/score");
let board = require("./handlers/board");
let bypass = require("./handlers/bypass");
let game = require("./handlers/game");
let handler_room = require("./handlers/room");
const { access } = require("fs");
const { random } = require("lodash");

let users = {};
let tours = {};
let rooms = [];

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
  firstDirectionSuites: [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
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

const bidding = {
  round: 0,
  declarer: 0,
  passCount: 0,
  isPassOut: true,
  maxContract: -1,
  prevBidDirection: 0,
  doubles: [
    [false, false],
    [false, false],
  ],
  firstDirectionSuites: [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
  ],
};

const playing = {
  turn: 0,
  doubles: [],
  bidSuite: 0,
  communityCards: [],
  initSuite: undefined,
  tricks: [0, 0],
  playedCards: [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}],
};

const BOARD = board.createSettingBoard();

const ioToPlayerCardPhase = ({
  socket_id,
  direction,
  tour_name,
  round_num,
  table_id,
}) => {
  let round_data = tours[tour_name].rounds[round_num];
  let table_data = round_data.tables[table_id];
  io.to(socket_id).emit(
    "get_cards",
    round_data.cards[table_data.cur_board - 1][direction]
  );
};

const ioToRoomOnPlaying = ({ status = "", room = "", payload = {} }) => {
  io.to(room).emit("playing", { status, payload });
};

const ioToRoomOnBiddingPhase = ({
  room = "",
  contract = -1,
  tour_name,
  round_num,
  table_id,
  nextDirection = 0,
}) => {
  let table_data = access_table(tour_name, round_num, table_id);
  let round_data = access_round(tour_name, round_num);
  console.log("next", nextDirection);
  ioToRoomOnPlaying({
    room,
    status: "waiting_for_bid",
    payload: {
      contract,
      nextDirection,
      board: table_data.cur_board,
      turn: table_data.playing.turn,
      ///Front-end must filter
      cards: round_data.cards,
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

  //Change to function create tournament round
  for (var round = 0; round < tours[tour_name].board_per_round; round++) {
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
      let versus = temp_versus.map((team, index) => {
        if (index == 2) {
          return { ...team, direction: 1 };
        } else if (index == 1) {
          return { ...team, direction: 2 };
        }
        return { ...team, direction: index };
      });
      console.log("versus", versus);
      tables.push({
        table_id: `r${round + 1}b${table + 1}`, //mongodb id
        status: "waiting",
        boards: board.createBoardPerRound(
          tours[tour_name].board_per_round,
          round
        ),
        versus: `${versus[0].pair_id},${versus[2].pair_id}`,
        directions: versus.map(({ id, direction }) => {
          return { id, direction };
        }),
        cur_board: round * tours[tour_name].board_per_round + 1,
        bidding,
        playing,
        score: [],
        ///Should create room variable
        count_player: 0,
        count_spec: 0,
        count_td: 0,
      });
    }
    rounds.push({
      round_num: round + 1,
      cards: card_handle.random_card(tours[tour_name].board_per_round),
      tables: tables,
      mp_round: [],
    });
    tables = [];
    let temp_second = second_pair.shift();
    second_pair.push(temp_second);
  }
  ///Create boardScores
  let count_board = _.range(1, round * tours[tour_name].board_per_round + 1);
  tours[tour_name].boardScores = count_board.map((count) => ({
    board_num: count,
    pairs_score: [],
  }));
  return rounds;
};

const access_round = (tour_name, round_num) => {
  try {
    let round = _.find(tours[tour_name].rounds, [
      "round_num",
      parseInt(round_num),
    ]);
    return round;
  } catch (error) {
    console.log("error", error);
  }
};
const access_table = (tour_name, round_num, table_id) => {
  try {
    let round = _.find(tours[tour_name].rounds, [
      "round_num",
      parseInt(round_num),
    ]);
    console.log("round", round);
    let table = _.find(round.tables, ["table_id", table_id]);
    return table;
  } catch (error) {
    console.log("error", error);
  }
};

const sendCardOneHand = ({
  room,
  socket_id,
  direction,
  tour_name,
  round_num,
  table_id,
  sendAll = false,
}) => {
  let round_data = access_round(tour_name, round_num);
  let table_data = access_table(tour_name, round_num, table_id);
  if (sendAll === true)
    io.to(room).emit(
      "opposite",
      round_data.cards[table_data.cur_board - 1][direction],
      direction
    );
  else console.log("CURRENT", socket_id);
  io.to(socket_id).emit(
    "card",
    round_data.cards[table_data.cur_board - 1][direction]
  );

  console.log("card", round_data.cards[table_data.cur_board - 1][direction]);
  console.log("direction", direction);
};

const specWhilePlaying = ({ socket_id, tour_name, room = "room_1" }) => {
  let rounds = tours[tour_name][`rounds`];
  rounds.map(({ round_num, tables }) => {
    let new_table = tables.map(({ table_id, versus, boards, cur_board }) => ({
      table_id,
      versus,
      boards,
      cur_board,
    }));
    return { round_num, tables: new_table };
  });
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

io.on("connection", async (socket) => {
  console.log("can connected");

  if (users[socket.handshake.query.username] == undefined) {
    let user_db = await User.findOne({
      username: socket.handshake.query.username,
    });
    const user = {
      socket_id: socket.id,
      username: socket.handshake.query.username,
      access: user_db.access,
      tour: undefined,
      session: undefined,
    };
    users[socket.handshake.query.username] = user;
    console.log("User created", users[socket.handshake.query.username]);
  } else {
    console.log("Exist User", socket.handshake.query.username);
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
      // const sameTour = await TourR.findOne({ tour_name: tour_data.tour_name });
      // if (sameTour) {
      //   //callback(false, "This tour already create");
      //   return socket.emit("create-tour", "This tour already create");
      // }

      //Encrypt password tour
      //encryptedPassword = await bcrypt.hash(tour_data.password, 10);
      //Create tournament on database
      // let tournament = await TourR.create({
      // ...tour_data
      // });
      // console.log("created tournament successful");

      tours[tour_data.tour_name] = tour_data;
      console.log(tours[tour_data.tour_name]);

      const tourList = [];
      for (const tour_name in tours) {
        let tourData = {
          host: "",
          title: tours[tour_name].tour_name,
          type: String(tours[tour_name].type),
          players: String(tours[tour_name].players.length),
          team_runnum: 1,
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
    // const temp = await TourR.find();
    // console.log("temp", temp, temp.length);
    const tourList = [];
    // for (var i = 0; i < temp.length; i++) {
    //   // console.log("FETCH", tours[temp[i].tour_name]);
    //   if (tours[temp[i].tour_name] == undefined) {
    //     temp[i].player_pair = [];
    //     tours[temp[i].tour_name] = temp[i];
    //   }
    // }
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
            board_per_round: tour_data.board_per_round,
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
      const hasTour = await TourR.findOne({ tour_name: tour_name });
      if (!hasTour) {
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
          id: player_name,
          name: player_name,
          status: "waiting",
          pair_id: undefined,
        });
        console.log("PUSH", tours[tour_name].players);
        // tours[tour_name].players.push(player_name)
        users[player_name].tour = tour_name;
        // tours[tour_name].player_waiting.push(player_name)
        var waitingPlayer = tours[tour_name].players
          .filter((player) => player.status == "waiting")
          .map((player) => player.name);

        //         if (player_name == "taetae11") {
        //           tours[tour_name].players.push({
        //             id: player_name,
        //             name: player_name,
        //             status: "in-pair",
        //             pair_id: 1,
        //           });
        //         }
        //
        //         if (player_name == "mickschumacher") {
        //           tours[tour_name].players.push({
        //             id: player_name,
        //             name: player_name,
        //             status: "in-pair",
        //             pair_id: 1,
        //           });
        //         }
        //
        //         if (player_name == "charlesleclerc16") {
        //           tours[tour_name].players.push({
        //             id: player_name,
        //             name: player_name,
        //             status: "in-pair",
        //             pair_id: 2,
        //           });
        //         }
        //
        //         if (player_name == "Sebvettel05") {
        //           tours[tour_name].players.push({
        //             id: player_name,
        //             name: player_name,
        //             status: "in-pair",
        //             pair_id: 2,
        //           });
        //         }

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

        var pairPlayers = tours[tour_name].players.filter(
          (player) => player.status == "in-pair"
        );

        io.in(tour_name).emit("update-player-pair", pairPlayers);
        io.in(tour_name).emit("");
        io.in(tour_name).emit("update-player-waiting", waitingPlayer);
        updateTourList();
        ///Comment for test backend : Mark
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
      // const hasTour = await TourR.findOne({ tour_name });
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
          var pairToRemove;
          tours[tour_name].players.forEach((player, index) => {
            if (tours[tour_name].players[index].name == player_name) {
              pairToRemove = tours[tour_name].players[index].pair_id;
              tours[tour_name].players[index].status = "waiting";
              tours[tour_name].players[index].pair_id = undefined;
            }
          });

          tours[tour_name].players.forEach((player, index) => {
            if (tours[tour_name].players[index].pair_id == pairToRemove) {
              tours[tour_name].players[index].status = "waiting";
              tours[tour_name].players[index].pair_id = undefined;
            }
          });

          // const yourPair = tours[tour_name].player_pair.find(
          //   (pair) => pair.user_a == player_name || pair.user_b == player_name
          // );
          //remove your pair from list
          // const newPair = tours[tour_name].players.filter(
          //   (pair) => pair != yourPair
          // );
          // tours[tour_name].player_pair = newPair;
          // console.log("pair after remove : ", newPair);
          // const yourPairName =
          //   player_name == yourPair.user_a ? yourPair.user_b : yourPair.user_a;
          //move your pair back to waiting
          // tours[tour_name].players.find(
          //   (player) => player.name == yourPairName
          // ).status = "waiting";
          // console.log("players after leave :", tours[tour_name].players);
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
        var pairPlayers = tours[tour_name].players.filter(
          (player) => player.status == "in-pair"
        );
        console.log(
          "player after really leave ",
          tours[tour_name].players,
          newList
        );
        io.in(tour_name).emit("update-player-waiting", newList);
        io.in(tour_name).emit("update-player-pair", pairPlayers);

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
      }
      // socket
      //   .to(tour_name)
      //   .emit("leave-tour", `User ${user} is exit this tournament`);
    } catch (error) {}

    //     if (users[player_name].tour != undefined) {
    //       const tour_name = users[player_name].tour;
    //       console.log("player", player_name, "want to leave");
    //       if (
    //         tours[tour_name].players.find((player) => player.name == player_name)
    //           .status == "in-pair"
    //       ) {
    //         const yourPair = tours[tour_name].player_pair.find(
    //           (pair) => pair.user_a == player_name || pair.user_b == player_name
    //         );
    //         //remove your pair from list
    //         const newPair = tours[tour_name].player_pair.filter(
    //           (pair) => pair != yourPair
    //         );
    //         tours[tour_name].player_pair = newPair;
    //         console.log("pair after remove : ", newPair);
    //         const yourPairName =
    //           player_name == yourPair.user_a ? yourPair.user_b : yourPair.user_a;
    //         //move your pair back to waiting
    //         tours[tour_name].players.find(
    //           (player) => player.name == yourPairName
    //         ).status = "waiting";
    //         console.log("players after leave :", tours[tour_name].players);
    //       }
    //       //remove tour from your data
    //       users[player_name].tour = undefined;
    //       console.log("player :=> ", player_name, "leave!");
    //       //remove you from tour
    //
    //       tours[tour_name].players = tours[tour_name].players.filter(
    //         (player) => player.name != player_name
    //       );
    //       const newList = tours[tour_name].players
    //         .filter((player) => player.status == "waiting")
    //         .map((player) => player.name);
    //       const waitingPlayers = tours[tour_name].players.filter(
    //         (player) => player.status == "waiting"
    //       );
    //       console.log(
    //         "player after really leave ",
    //         tours[tour_name].players,
    //         newList
    //       );
    //       console.log(tours[tour_name]);
    //       io.in(tour_name).emit("update-player-waiting", newList);
    //       io.in(tour_name).emit("update-player-pair", tours[tour_name].player_pair);
    //
    //       const tourList = [];
    //       for (const tour_name in tours) {
    //         let tourData = {
    //           host: "",
    //           title: tours[tour_name].tour_name,
    //           type: String(tours[tour_name].type),
    //           players: String(tours[tour_name].players.length),
    //         };
    //         if (tour_name == "tour-f2") {
    //           tourData.players = 10 + tours[tour_name].players.length;
    //         }
    //         tourList.push(tourData);
    //       }
    //       io.emit("update-tour-list", tourList);
    //     }
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
        "invite-player",
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
      io.in(sockets.id).emit("invite-by", invite_player_name);
    }
  );

  socket.on(
    "accept-invite",
    (tour_name, invite_player_name, player_name, callback) => {
      console.log(
        "INVITE PLAYER :=> ",
        invite_player_name,
        " to ",
        player_name
      );
      // const pair = tours[tour_name].players
      //   .filter(
      //     ({ player_name, status }) =>
      //       (player_name == invite_player_name || player_name == player_name) &&
      //       status === "waiting"
      //   )
      //   .map((player) => ({
      //     ...player,
      //     status: "in-pair",
      //     player_id: tours[tour_name].team_runnum,
      //   }));
      if (tours[tour_name].team_runnum == undefined) {
        tours[tour_name].team_runnum = 1;
      }
      tours[tour_name].players.forEach((player, index) => {
        if (player.name == player_name || player.name == invite_player_name) {
          tours[tour_name].players[index].status = "in-pair";
          tours[tour_name].players[index].pair_id =
            tours[tour_name].team_runnum;
        }
      });

      tours[tour_name].team_runnum += 1;
      const pair = tours[tour_name].players.filter(
        (player) => player.status == "in-pair"
      );
      ///Check when cannot paired
      if (pair.length === 0) return "Cannot pair this player";

      const waiting = tours[tour_name].players
        .filter((player) => player.status == "waiting")
        .map((player) => player.name);
      console.log("Waiting ::", waiting);
      console.log("Waiting ::", pair);
      io.in(tour_name).emit("update-player-pair", pair);
      io.in(tour_name).emit("update-player-waiting", waiting);
      console.log(tours[tour_name].player_pair);
    }
  );
  //#start
  socket.on("start", (tour_name) => {
    let rounds = matchmaking(tour_name);
    tours[tour_name][`rounds`] = rounds;
    io.in(tour_name).emit(
      "start-tour",
      rounds.map(({ round_num, tables }) => {
        let new_table = tables.map(
          ({ table_id, versus, boards, cur_board, directions }) => ({
            table_id,
            versus,
            boards,
            cur_board,
            directions,
          })
        );
        console.log("DATA", new_table);
        return { round_num, tables: new_table };
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
      direction,
      room = "room_1",
      round_num,
      table_id,
    }) => {
      socket.join(room);
      users[spec_name].game_status = "player";
      console.log("direction", direction);
      /// return current players.
      // io.to(room).emit("waiting_for_start", tours[tour_name].players);

      let table_data = access_table(
        (tour_name = tour_name),
        (round_num = round_num),
        (table_id = table_id)
      );
      ///Player get cards
      //let socket_id = users[player_id].socket_id;
      ///fake id
      let socket_id = "123";
      sendCardOneHand({
        room,
        socket_id,
        direction,
        tour_name,
        round_num,
        table_id,
      });
      let [...idInRoom] = io.sockets.adapter.rooms.get(table_id);
      let userScreen = Object.keys(users).map((key) => {
        return users[key];
      });
      let playerInRoom = handler_room.accessInRoom(idInRoom, userScreen);
      /// if fully player, change to 'bidding phase'.
      if (playerInRoom.length === 4 && table_data.status == "waiting") {
        table_data.status = "playing";

        ioToRoomOnBiddingPhase({ room, tour_name, round_num, table_id });
        ///!send table status
        io.to(tours[tour_name]).emit("update-room-status", table_data.status);
        console.log("can go bidding phase");
      }
      // else if (table_data.status == "playing" && player_id in spec) {
      // }
    }
  );

  /*
   * Bidding phase #bp
   */
  socket.on(
    "bid",
    ({
      player_id,
      room,
      contract,
      direction,
      //Chage
      tour_name,
      round_num,
      table_id,
    }) => {
      console.log("direction now", direction, contract);
      const nextDirection = direction < 3 ? parseInt(direction, 10) + 1 : 0;
      // const nextDirection = direction < 3 ? parseInt(direction, 10) + 1 : 0;

      /// convert contract to suite.
      const suite = contract % 5;
      const team = direction % 2;
      const anotherTeam = nextDirection % 2;
      const isPass = suite === -1;

      let table_data = access_table(
        (tour_name = tour_name),
        (round_num = round_num),
        (table_id = table_id)
      );
      let access_bidding = table_data.bidding;
      let access_playing = table_data.playing;

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
          console.log("leader", leader);
          console.log("declarer", declarer);
          console.log("before_direct", direction);

          ///Send card the opposite declarer to everyone
          let opposite = declarer < 2 ? declarer + 2 : declarer - 2;
          sendCardOneHand({
            room,
            direction: opposite,
            tour_name,
            round_num,
            table_id,
            sendAll: true,
          });
          console.log("after_direct", direction);
          /// clear access_table here ...
          // access_bidding.declarer = 0;
          // access_bidding.passCount = 0;
          // access_bidding.isPassOut = true;
          // access_bidding.maxContract = -1;
          // access_bidding.doubles = INIT.doubles;
          // access_bidding.firstDirectionSuites = INIT.firstDirectionSuites;

          ioToRoomOnPlaying({
            room,
            status: "initial_playing",
            payload: {
              leader,
              board: table_data.cur_board,
              bidSuite: winnerSuite,
              turn: ++access_playing.turn,
            },
          });
          return;
        }
        if (access_bidding.passCount === 4) {
          access_bidding.passCount = 0;

          if (++table_data.cur_board >= tour.maxRound) {
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
            round_num,
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
        round_num,
        table_id,
      });
    }
  );

  socket.on(
    "play_card",
    ({
      player_id,
      room = "room_1",
      card,
      direction,
      turn,
      tour_name,
      round_num,
      table_id,
    }) => {
      /* 
            TODO: check client and server property are according together. 
        */
      console.log("Play Card : ", {
        player_id,
        room,
        card,
        direction,
        turn,
        tour_name,
        round_num,
        table_id,
      });
      let round_data = access_round(
        (tour_name = tour_name),
        (round_num = round_num)
      );
      let table_data = access_table(
        (tour_name = tour_name),
        (round_num = round_num),
        (table_id = table_id)
      );
      let access_bidding = table_data.bidding;
      let access_playing = table_data.playing;
      if (turn !== access_playing.turn) return;

      const nextDirection = direction < 3 ? parseInt(direction, 10) + 1 : 0;
      const suite = parseInt(card / 13, 10);

      access_playing.communityCards.push({
        card,
        direction,
      });
      console.log("communityCards", access_playing.communityCards);

      //Save played card
      access_playing.playedCards[access_playing.turn - 1] = {
        ...access_playing.playedCards[access_playing.turn - 1],
        ...{
          [`${direction}`]: card,
        },
      };

      console.log("playedCards", access_playing.playedCards);

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
        // access_playing.tricks;
        else maxCard = _.maxBy(sameInitSuiteCards, "card");

        const { direction: leader } = _.find(
          access_playing.communityCards,
          maxCard
        );
        //Calculate tricks if leader = NS then + 1
        leader % 2 == 0
          ? access_playing.tricks[0]++
          : access_playing.tricks[1]++;
        console.log("access_bidding", access_bidding);
        console.log(`access_playing`, access_playing);
        console.log(`leader`, leader);
        console.log("cur_board", table_data.cur_board);

        // access_bidding.declarer = 0;
        // access_bidding.passCount = 0;
        // access_bidding.isPassOut = true;
        // access_bidding.maxContract = -1;
        // access_bidding.doubles = INIT.doubles;
        // access_bidding.firstDirectionSuites = INIT.firstDirectionSuites;

        access_playing.initSuite = undefined;
        access_playing.communityCards = [];
        /// playing for 13 turn.
        if (
          access_playing.turn >= 2
          //access_table.board_num >= tours[tour_name].board_per_round
        ) {
          ///Calculate score per tables
          table_data.score = score.calScore(
            card_handle.score_table(
              access_bidding.declarer,
              access_bidding.maxContract,
              access_bidding.doubles,
              BOARD[table_data.cur_board - 1].vulnerable,
              access_playing.tricks
            )
          );
          console.log("score", table_data.score);
          ///Save score to boardScores
          let boardIndex = score.findIndexScoreBoard(
            tours[tour_name],
            table_data.cur_board
          );
          ///Save score NS
          tours[tour_name].boardScores[boardIndex].pairs_score.push({
            pair_id: table_data.versus.split(",")[0],
            score: table_data.score[0],
            direction: 0,
          });
          ///Save score EW
          tours[tour_name].boardScores[boardIndex].pairs_score.push({
            pair_id: table_data.versus.split(",")[1],
            score: table_data.score[1],
            direction: 1,
          });

          ///!Save MP variable
          //Save board score NS
          let selectIndexNS = [];
          ///Select pair from all ns
          let selectNS = tours[tour_name].boardScores[
            boardIndex
          ].pairs_score.filter((pair) => pair.direction == 0);
          ///Convert to score array
          let getScoreNS = selectNS.map((score) => score.score);
          let [mpNS, percentNS] = score.calBoardMps(getScoreNS);

          ///Select index
          tours[tour_name].boardScores[boardIndex].pairs_score.map(
            (pair, index) => {
              if (pair.direction == 0) {
                selectIndexNS.push(index);
              }
            }
          );
          ///Fill mp,percent to boardScore
          selectIndexNS.map((pair_index, index) => {
            tours[tour_name].boardScores[boardIndex].pairs_score[pair_index][
              "imp"
            ] = mpNS[index];
            tours[tour_name].boardScores[boardIndex].pairs_score[pair_index][
              "percent"
            ] = percentNS[index];
          });

          //Save board score EW
          let selectIndexEW = [];
          ///Select pair from all ns
          let selectEW = tours[tour_name].boardScores[
            boardIndex
          ].pairs_score.filter((pair) => pair.direction == 1);
          ///Convert to score array
          let getScoreEW = selectEW.map((score) => score.score);
          let [mpEW, percentEW] = score.calBoardMps(getScoreNS);

          ///Select index
          tours[tour_name].boardScores[boardIndex].pairs_score.map(
            (pair, index) => {
              if (pair.direction == 1) {
                selectIndexEW.push(index);
              }
            }
          );
          ///Fill mp,percent to boardScore
          selectIndexEW.map((pair_index, index) => {
            tours[tour_name].boardScores[boardIndex].pairs_score[pair_index][
              "imp"
            ] = mpEW[index];
            tours[tour_name].boardScores[boardIndex].pairs_score[pair_index][
              "percent"
            ] = percentEW[index];
          });

          socket.emit("score", tours[tour_name].boardScores);
          //tours[tour_id].boardScores =
          ///reset bidding
          access_bidding.declarer = 0;
          access_bidding.passCount = 0;
          access_bidding.isPassOut = true;
          access_bidding.maxContract = -1;
          access_bidding.doubles = INIT.doubles;
          access_bidding.firstDirectionSuites = INIT.firstDirectionSuites;

          ///Change status table to finish
          table_data.status = "Finish";

          ///Count finish
          let finish_table = round_data.tables.filter(
            ({ status }) => status == "Finish"
          );
          let count_finish_table = finish_table.length;

          ///Calculate score per rounds
          if (count_finish_table >= round_data.tables.length) {
            ///Get score all ns & ew
            let score_all = round_data.tables.map(({ score }) => ({ score }));
            let score_all_ns = round_data.tables.map(({ score }) => score[0]);
            let score_all_ew = round_data.tables.map(({ score }) => score[1]);
            table_data.mp_rounds = [
              score.calBoardMps(score_all_ns),
              score.calBoardMps(score_all_ew),
            ];

            ///Send finsh all table
            socket.emit("finsh-all-table", finish_table, count_finish_table);
          }
          //Change board
          if (++table_data.cur_board > tours[tour_name].board_per_round) {
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
            // contract,
            nextDirection,
            tour_name,
            round_num,
            table_id,
          });

          access_playing.turn = 0;
          return;
        }

        ioToRoomOnPlaying({
          room,
          status: "default",
          payload: {
            card,
            nextDirection: leader,
            prevDirection: direction,
          },
        });

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

  socket.on(
    "join-room-spec",
    ({
      spec_id,
      spec_name,
      tour_name,
      room = "room_1",
      round_num,
      table_id,
    }) => {
      socket.join(room);
      users[spec_name].game_status = "spec";

      let round_data = access_round((tour_name = "Mark1"), (round_num = "1"));
      let table_data = access_table(
        (tour_name = "Mark1"),
        (round_num = "1"),
        (table_id = "r1b1")
      );

      if (table_data.status == "playing") {
        socket.emit("join-spec", table_data);
      }
    }
  );
  //Leave team
  //Join room
  ///Check user in a room
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

  ///Test
  socket.on(
    "test",
    (tour_id = "Mark1", round_num = 1, table_id = "r1b1", cur_board = 0) => {
      try {
        // let round_data = access_round(tour_id, round_num);
        let table_data = access_table(tour_id, round_num, table_id);

        // ///Get all card in round
        // let round_data = access_round(tour_id, round_num);
        // let get_all_cards = round_data.cards[cur_board];
        // let table_data = access_table(tour_id, round_num, table_id);

        // ///Get played card and convert to array
        // let played_card_object = table_data.playing.playedCards;
        // let played_card_array = [[], [], [], []];
        // played_card_object.map((turn) => {
        //   Object.keys(turn).map((key) => {
        //     played_card_array[parseInt(key)].push(turn[key]);
        //   });
        // });

        // ///Select left card
        // let left_card_array = [[], [], [], []];
        // get_all_cards.map((all, index_all) => {
        //   played_card_array.map((played, index_played) => {
        //     if (index_all == index_played) {
        //       let left = all.filter((x) => !played.includes(x));
        //       left_card_array[index_all].push(...left);
        //       return left;
        //     }
        //   });
        // });

        // socket.emit("test", get_all_cards, played_card_array, left_card_array);
        //!------------------------------------------------------------------------
        // let round_data = access_round(tour_id, round_num);
        // let score_all_ns = round_data.tables.map(({ score }) => score[0]);
        // let score_all_ew = round_data.tables.map(({ score }) => score[1]);
        // let mp_rounds = [
        //   score.calBoardMps(score_all_ns),
        //   score.calBoardMps(score_all_ew),
        // ];
        // let scores = [40, 30, 30, 30, 23, 23, 10];
        // console.log("score_all_ns : ", score_all_ns);
        // let [mps, percentage] = score.calBoardMps(scores);
        // socket.emit("test", mps, percentage);
        // socket.emit("test", mp_rounds);
        //!------------------------------------------------------------------------
        // let round_data = access_round(tour_id, round_num);
        // let score_all_ns = round_data.tables.map(({ score }) => score[0]);
        // let [mp_ns, percentage_ns] = score.calBoardMps(score_all_ns);
        // let pairs_ns = round_data.tables.map(
        //   ({ versus }) => versus.split(",")[0]
        // );

        // let teams_ns = pairs_ns.map((pair, index) => {
        //   return { pair: pair, mp: mp_ns[index] };
        // });

        // let score_all_ew = round_data.tables.map(({ score }) => score[1]);
        // let [mp_ew, percentage_ew] = score.calBoardMps(score_all_ew);
        // let pairs_ew = round_data.tables.map(
        //   ({ versus }) => versus.split(",")[1]
        // );

        // let teams_ew = pairs_ew.map((pair, index) => {
        //   return { pair: pair, mp: mp_ew[index] };
        // });

        // let teamScores = [...teams_ns, ...teams_ew];

        // console.log("score_all", pairs_ns);
        // console.log("mp_ns", mp_ns);
        // console.log("teamScores", teamScores);
        //!------------------------------------------------------------------------
        let boardIndex = score.findIndexScoreBoard(
          tours[tour_id].boardScores,
          table_data.cur_board
        );
        tours[tour_id].boardScores[boardIndex].pairs_score.push({
          pair_id: 1,
          score: 900,
          direction: 0,
        });
        tours[tour_id].boardScores[boardIndex].pairs_score.push({
          pair_id: 3,
          score: 0,
          direction: 1,
        });
        tours[tour_id].boardScores[boardIndex].pairs_score.push({
          pair_id: 2,
          score: 500,
          direction: 0,
        });
        tours[tour_id].boardScores[boardIndex].pairs_score.push({
          pair_id: 4,
          score: 0,
          direction: 1,
        });
        tours[tour_id].boardScores[3].pairs_score.push({
          pair_id: 1,
          score: 0,
          direction: 0,
        });
        tours[tour_id].boardScores[3].pairs_score.push({
          pair_id: 3,
          score: 400,
          direction: 1,
        });
        //?NS
        let selectIndexNS = [];
        ///Select pair from all ns
        let selectNS = tours[tour_id].boardScores[
          boardIndex
        ].pairs_score.filter((pair) => pair.direction == 0);
        ///Convert to score array
        let getScoreNS = selectNS.map((score) => score.score);
        let [mpNS, percentNS] = score.calBoardMps(getScoreNS);

        ///Select index
        tours[tour_id].boardScores[boardIndex].pairs_score.map(
          (pair, index) => {
            if (pair.direction == 0) {
              selectIndexNS.push(index);
            }
          }
        );
        ///Fill mp,percent to boardScore
        selectIndexNS.map((pair_index, index) => {
          tours[tour_id].boardScores[boardIndex].pairs_score[pair_index][
            "imp"
          ] = mpNS[index];
          tours[tour_id].boardScores[boardIndex].pairs_score[pair_index][
            "percent"
          ] = percentNS[index];
        });

        socket.emit("test", tours[tour_id].boardScores);
        //!------------------------------------------------------------------------
        // let fake_data = [
        //   {
        //     board_num: 1,
        //     pair_1: { score: 0, direction: "NS" },
        //     pair_3: { score: 800, direction: "EW" },
        //   },
        //   {
        //     board_num: 2,
        //     pair_1: { score: 550, direction: "NS" },
        //     pair_3: { score: 0, direction: "EW" },
        //   },
        //   {
        //     board_num: 3,
        //     pair_2: { score: 0, direction: "NS" },
        //     pair_4: { score: 800, direction: "EW" },
        //   },
        //   {
        //     board_num: 4,
        //     pair_2: { score: 0, direction: "NS" },
        //     pair_4: { score: 800, direction: "EW" },
        //   },
        //   { board_num: 5 },
        //   { board_num: 6 },
        //   { board_num: 7 },
        //   { board_num: 8 },
        //   { board_num: 9 },
        // ];
        // let filterNS = fake_data.map((board) =>
        // [...board].filter((pair) => pair.direction == "NS")
        // );
        // console.log('filterNS', filterNS)
      } catch (error) {
        console.log("error", error);
      }
    }
  );
  socket.on(
    "test2",
    (tour_id = "Mark1", round_num = 1, table_id = "r1b1", cur_board = 0) => {
      try {
        let room = "r1b1";
        socket.join(room);
        let clients = io.sockets.adapter.rooms.get(room);
        console.log("clients", clients);
        console.log("room", socket.rooms);
        let getRoom = io.sockets.adapter.rooms;
        console.log("getRoom", getRoom);
        let room1 = io.sockets.adapter.rooms.get(room);
        console.log("room1", room1);
      } catch (error) {
        console.log("error", error);
      }
    }
  );

  socket.on("bypass", (tour_id = "Mark1") => {
    //let db_score = Match.find((tour_id = tour_id));
    //console.log("db_score", db_score);
    tours[tour_id] = bypass.generateFullGameData();
    socket.emit("test", tours[tour_id]);
    console.log("bypass created");
  });
  ///getCurrentMatchInfo
  socket.on(
    "getCurrentMatchInfo",
    (tour_id = "Mark1", round_num = 1, table_id = "r1b1") => {
      try {
        let table_data = access_table(
          (tour_id = tour_id),
          (round_num = round_num),
          (table_id = table_id)
        );
        let temp_bid = (({ maxContract, doubles }) => ({
          maxContract,
          doubles,
        }))(table_data.bidding);
        let temp_play = ({ tricks }) => ({ tricks });
        console.log("data", { ...temp_bid, ...temp_play });

        socket.emit("test", temp_play);
      } catch (error) {
        console.log("error", error);
      }
    }
  );

  socket.on("getBoardType", (boardNumber) => {
    socket.emit("getBoardType", BOARD[boardNumber - 1]);
  });

  socket.on("getSelfScore", (player_id = "peterpan", tour_id = "Mark1") => {
    try {
      let getPairId = game.getPairId(tours[tour_id], player_id);
      let rounds = tours[tour_id][`rounds`];
      let selfScore = game.getSelfScore(getPairId, rounds);
      socket.emit("getSelfScore", selfScore);
    } catch (error) {
      console.log("error", error);
    }
  });

  socket.on("getNsRankings", () => {});
  socket.on("getEwRankings", () => {});

  socket.on("getCurrentMatchStatus", () => {});

  socket.on("grant_user_to_td", (admin) => {});

  socket.on("disconnect", () => {
    console.log("User was disconnect");
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
