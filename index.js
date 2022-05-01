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
const News = require("./model/news");
const History = require("./model/history");
const { log, table } = require("console");

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

const DIRECTIONS = ["N", "E", "S", "W"];
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

const biddingObj = () => {
  return {
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

const playingObj = () => {
  return {
    turn: 0,
    doubles: [],
    bidSuite: 0,
    communityCards: [],
    initSuite: undefined,
    tricks: [0, 0],
    playedCards: [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}],
  };
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

const ioToRoomOnStartBidding = ({
  room = "",
  tour_name = "",
  table_id = "",
  round_num,
  // room = "",
  // contract = -1,
  // tour_name,
  // round_num,
  // table_id,
  // nextDirection = 0,
  // doubleEnable = true,
}) => {
  let table_data = access_table(tour_name, round_num, table_id);
  ioToRoomOnPlaying({
    room,
    status: "initial_bidding",
    payload: {
      board_type: BOARD[table_data.cur_board - 1],
      cur_board: table_data.cur_board,
      board_per_round: tours[tour_name].board_per_round,
      cur_round: round_num,
      total_round:
        tours[tour_name].board_to_play / tours[tour_name].board_per_round,
    },
  });
};

const ioToRoomOnBiddingPhase = ({
  room = "",
  contract = -1,
  tour_name,
  round_num,
  table_id,
  nextDirection = 0,
  doubleEnable = true,
}) => {
  let table_data = access_table(tour_name, round_num, table_id);
  let round_data = access_round(tour_name, round_num);

  let access_bidding = table_data.bidding;

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
      doubleEnable: doubleEnable,
    },
  });
};

const matchmaking = async (tour_name) => {
  if ((tours[tour_name].players.length / 2) % 2 != 0) {
    await tours[tour_name].players.push({
      id: "not_player",
      name: "not_player",
      status: "in-pair",
      pair_id: 999,
    });
    await tours[tour_name].players.push({
      id: "not_player",
      name: "not_player",
      status: "in-pair",
      pair_id: 999,
    });
  }
  //let unique_team = _.range(1, tours[tour_name].players.length / 2 + 1).sort();
  let unique_team = _.uniq(
    tours[tour_name].players.map((player) => player.pair_id)
  );
  let half = Math.ceil(unique_team.length / 2);

  //Slice
  let first_pair = unique_team.slice(0, half);
  let second_pair = unique_team.slice(-half);

  //Mitchell full
  let tables = [];
  let rounds = [];

  //Change to function create tournament round
  let play_round =
    tours[tour_name].board_to_play / tours[tour_name].board_per_round;
  for (var round = 0; round < play_round; round++) {
    for (var table = 0; table < unique_team.length / 2; table++) {
      let temp_versus = _.sortBy(
        tours[tour_name].players.filter(
          (player) =>
            player.pair_id === first_pair[table] ||
            player.pair_id === second_pair[table]
        ),
        ["pair_id"]
      );
      let versus = temp_versus.map((team, index) => {
        if (index == 2) {
          return { ...team, direction: 1 };
        } else if (index == 1) {
          return { ...team, direction: 2 };
        }
        return { ...team, direction: index };
      });
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
        bidding: biddingObj(),
        playing: playingObj(),
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
      status: "playing",
    });
    tables = [];
    let temp_second = second_pair.shift();
    second_pair.push(temp_second);
  }
  ///Create boardScores
  let count_board = _.range(1, round * tours[tour_name].board_per_round + 1);
  tours[tour_name].boardScores = count_board.map((count) => ({
    board_num: count,
    count_done: 0,
    pairs_score: [],
  }));
  tours[tour_name].rankPairs = unique_team.map((pair) => ({
    pair_id: pair,
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
  //console.log("TABLE :", tour_name, round_num, table_id, direction);
  let round_data = access_round(tour_name, round_num);
  let table_data = access_table(tour_name, round_num, table_id);
  if (sendAll === true)
    io.to(room).emit(
      "opposite",
      round_data.cards[
        table_data.cur_board -
          tours[tour_name].board_per_round * (parseInt(round_num) - 1) -
          1
      ][direction],
      direction
    );
  io.to(socket_id).emit(
    "card",
    round_data.cards[
      table_data.cur_board -
        tours[tour_name].board_per_round * (parseInt(round_num) - 1) -
        1
    ][direction],
    direction
  );
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
  if (users[socket.handshake.query.username] == undefined) {
    // let user_db = await User.findOne({
    //   username: socket.handshake.query.username,
    // });
    const user = {
      socket_id: socket.id,
      username: socket.handshake.query.username,
      access: "user",
      //access: user_db.access,
      tour: undefined,
      session: undefined,
    };
    users[socket.handshake.query.username] = user;
  } else {
    users[socket.handshake.query.username].socket_id = socket.id;
  }
  // console.log("username", socket.handshake.query.username);
  // console.log("socket", socket.id);

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
    //console.log("NEW TOUR ", tours[tour_data.tour_name]);
    try {
      /// Validate
      // const sameTour = await TourR.findOne({ tour_name: tour_data.tour_name });
      // if (sameTour) {
      //   //callback(false, "This tour already create");
      //   return socket.emit("create-tour", "This tour already create");
      // }

      // Create tournament on database
      let tournament = await TourR.create({
        ...tour_data,
      });
      console.log("created tournament successful");

      tours[tour_data.tour_name] = tour_data;

      ///Set time to force user
      // let startTime = "2022-04-16T17:56:00.000Z";
      // let milStartTime = new Date(startTime).getTime();
      // let curTime = new Date();
      // let milCurTme = curTime.getTime();
      // let diff_time = milStartTime - milCurTme;

      // tours[tour_data.tour_name].count_update++;
      // let count = tours[tour_data.tour_name].count_update;
      // socket.timeout(5000).emit("test", () => {
      //   socket.emit("test", "Prepare for join start tour");
      //   if (tours[tour_data.tour_name].count_update == count) {
      //     io.emit("test", "Use this time");
      //   }
      // });
      // console.log("update", tours[tour_data.tour_name].count_update);
      // console.log("update", count);

      const tourList = [];
      for (const tour_name in tours) {
        let tourData = {
          host: "",
          title: tours[tour_name].tour_name,
          type: String(tours[tour_name].type),
          players: String(tours[tour_name].players.length),
          team_runnum: 1,
          mode: tours[tour_name].mode,
          status: tours[tour_name].status,
        };
        tourList.push(tourData);
      }
      io.emit("update-tour-list", tourList);
      callback(true);
      //callback(true, "Room created");
    } catch (error) {
      callback(false);
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
        mode: tours[tour_name].mode,
        status: tours[tour_name].status,
      };
      tourList.push(tourData);
    }
    console.log(`tourList`, tourList);
    callback(tourList);
  });

  //Update tour
  socket.on("update-tour", async (tour_data) => {
    try {
      //fist time not have
      // const haveTour = await TourR.findOne({ tour_name: tour_data.tour_name });
      // if (!haveTour) {
      //   //callback(false, "This tour already create");
      //   console.log("failed");
      //   return socket.emit(
      //     "update-tour",
      //     "This tour name not have in our tournament"
      //   );
      // }
      //Encrypt password tour
      //let encryptedPassword = await bcrypt.hash(tour_data.password, 10);
      //Update tournament on database
      const tournament = await TourR.updateOne(
        { tour_name: tour_data.tour_name },
        {
          $set: {
            tour_name: tour_data.tour_name,
            max_player: tour_data.max_player,
            type: tour_data.type,
            password: tour_data.password,
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
      // tours[tour_data.tour_name].count_update++;
      // let count = tours[tour_data.tour_name].count_update;
      // socket.timeout(5000).emit("test", () => {
      //   socket.emit("test", "Prepare for join start tour");
      //   if (tours[tour_data.tour_name].count_update == count) {
      //     io.emit("test", "Use this time");
      //   }
      // });
      // console.log("updated success");
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

      // const hasTour = await TourR.findOne({ tour_name: tour_name });
      // if (!hasTour) {
      //   //callback(false, "This tour already create");
      //   return socket.emit(
      //     "delete-tour",
      //     "This tour name not have in our tournament"
      //   );
      // }
      delete tours[tour_name];
      //Create tournament on database
      // const tournament = await TourR.deleteOne({
      //   tour_name: tour_name,
      //   createBy: current_TD,
      // });
      console.log("delete successful");
      updateTourList();

      io.to(tour_name).emit("please-leave-tour");
      // io.emit("delete-tour");
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
      console.log('players', tours[tour_name].players)
      if (tours[tour_name].players.find((player) => player.id == player_name)) {
        console.log("ALREADY EXIST");
        users[player_name].tour = tour_name;
        // tours[tour_name].player_waiting.push(player_name)
        var waitingPlayer = tours[tour_name].players
          .filter((player) => player.status == "waiting")
          .map((player) => player.name);

        var pairPlayers = tours[tour_name].players.filter(
          (player) => player.status == "in-pair"
        );
        // let timeStart = TourR.find({ tour_name: tour_name }).time_start;
        // let timeJoin = new Date().getTime();
        //io.timeout(timeJoin - timeStart).emit("test", "Good luck");
        io.in(tour_name).emit("update-player-pair", pairPlayers);
        io.in(tour_name).emit("");
        io.in(tour_name).emit("update-player-waiting", waitingPlayer);
        updateTourList();
        callback(true);
        return;
      }

      if (
        tours[tour_name].players.length < tours[tour_name].max_player &&
        users[player_name].tour == undefined
      ) {
        tours[tour_name].players.push({
          id: player_name,
          name: player_name,
          status: "waiting",
          //pair_id: 0,
        });
        // tours[tour_name].players.push({
        //   id: player_name,
        //   name: player_name,
        //   status: "waiting",
        //   //pair_id: 0,
        // });
        // tours[tour_name].players.push(player_name)
        users[player_name].tour = tour_name;
        // tours[tour_name].player_waiting.push(player_name)
        var waitingPlayer = tours[tour_name].players
          .filter((player) => player.status == "waiting")
          .map((player) => player.name);

        var pairPlayers = tours[tour_name].players.filter(
          (player) => player.status == "in-pair"
        );
        // let timeStart = TourR.find({ tour_name: tour_name }).time_start;
        // let timeJoin = new Date().getTime();
        //io.timeout(timeJoin - timeStart).emit("test", "Good luck");
        io.in(tour_name).emit("update-player-pair", pairPlayers);
        io.in(tour_name).emit("");
        io.in(tour_name).emit("update-player-waiting", waitingPlayer);
        updateTourList();
        callback(true);
        ///Comment for test backend : Mark
        // callback(true);
      }
    } catch (error) {
      console.log(`error`, error);
      callback(false);
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
        mode: tours[tour_name].mode,
        status: tours[tour_name].status,
      };
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

        // const tourList = [];
        // for (const tour_name in tours) {
        //   let tourData = {
        //     host: "",
        //     title: tours[tour_name].tour_name,
        //     type: String(tours[tour_name].type),
        //     players: String(tours[tour_name].players.length),

        //   };
        //   tourList.push(tourData);
        // }
        // io.emit("update-tour-list", tourList);
        updateTourList();
      }
      // socket
      //   .to(tour_name)
      //   .emit("leave-tour", `User ${user} is exit this tournament`);
    } catch (error) {}
  });

  //Get user tour
  socket.on("get-tour-client", (tour_name) => {
    clients = io.sockets.adapter.rooms.get(tour_name);
    console.log(clients);
    socket.emit("get-tour-client", clients);
  });

  socket.on("get-tour-data", (tour_name, callback) => {
    console.log("GETTING ", tours[tour_name]);
    callback(tours[tour_name]);
  });

  socket.on("update-tour-data", (tour_data, callback) => {
    tours[tour_data.tour_name] = tour_data;
    console.log("UPDAIN", tour_data);
    callback(true);
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
    console.log(sender, " :=> send message to tour >>>", message);
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
  socket.on("start", async (tour_name) => {
    ///Remove player has not pair_id
    tours[tour_name].players = tours[tour_name].players.filter(
      (player) => player.pair_id != undefined
    );

    ///Sort player when player left the room
    tours[tour_name].players.sort((a, b) => {
      return a.pair_id - b.pair_id;
    });
    // let pairIdArray = tours[tour_name].players.map((pair) => pair.pair_id);
    let defaultPairId = [
      ..._.range(1, tours[tour_name].players.length / 2 + 1),
      ..._.range(1, tours[tour_name].players.length / 2 + 1),
    ].sort();
    tours[tour_name].players.map((pair, index) => {
      pair.pair_id = defaultPairId[index];
    });

    let rounds = await matchmaking(tour_name);
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
    ///Update tour status to running
    tours[tour_name].status = "running";

    ///Send tourdata without round
    let select_data = (({ rounds, ...data }) => ({ ...data }))(
      tours[tour_name]
    );
    io.to(tour_name).emit("tour-no-round", select_data);

    ///Update players
    await TourR.updateOne(
      { tour_name },
      { $set: { players: tours[tour_name].players } }
    );

    ///Save in database history
    let round_num = _.range(
      1,
      tours[tour_name].board_to_play / tours[tour_name].board_per_round + 1
    );
    await History.create({
      tid: tour_name,
      rounds: round_num.map((round) => {
        return { round_num: round, boards: [] };
      }),
    });
  });

  /*
   * Join table #jt
   */
  socket.on(
    "join",
    async ({
      player_id,
      player_name,
      tour_name,
      direction,
      room = "room_1",
      round_num,
      table_id,
    }) => {
      socket.join(room);
      //users[player_name].game_status = "player";
      // console.log("direction", direction);
      /// return current players.
      // io.to(room).emit("waiting_for_start", tours[tour_name].players);

      let table_data = access_table(
        (tour_name = tour_name),
        (round_num = round_num),
        (table_id = table_id)
      );
      ///Player get cards
      let socket_id = users[player_id].socket_id;
      ///fake id
      // let socket_id = "123";
      sendCardOneHand({
        room,
        socket_id,
        direction,
        tour_name,
        round_num,
        table_id,
      });
      // ///Real check
      // let [...idInRoom] = io.sockets.adapter.rooms.get(table_id);
      // let userScreen = Object.keys(users).map((key) => {
      //   return users[key];
      // });
      // let playerInRoom = handler_room.accessInRoom(idInRoom, userScreen);
      // /// if fully player, change to 'bidding phase'.
      // if (playerInRoom.length === 4 && table_data.status == "waiting") {
      //   table_data.status = "playing";

      //   ioToRoomOnBiddingPhase({ room, tour_name, round_num, table_id });
      //   ///!send table status
      //   io.to(tours[tour_name]).emit("update-room-status", table_data.status);
      //   console.log("can go bidding phase");
      // }
      // // else if (table_data.status == "playing" && player_id in spec) {
      // // }
      ///Fake check
      let [...idInRoom] = io.sockets.adapter.rooms.get(room);
      /// Log player in room
      // console.log("idInRoom", idInRoom);
      // console.log("table status", table_data.status);
      //let playerInRoom = handler_room.accessInRoom(idInRoom, userScreen);
      /// if fully player, change to 'bidding phase'.
      if (idInRoom.length === 4 && table_data.status == "waiting") {
        table_data.status = "playing";
        ioToRoomOnStartBidding({ room, tour_name, round_num, table_id });
        ioToRoomOnBiddingPhase({ room, tour_name, round_num, table_id });
        ///!send table status
        io.to(tours[tour_name]).emit("update-room-status", table_data.status);
        console.log("can go bidding phase");
      }
    }
  );

  /*
   * Bidding phase #bp
   */
  socket.on(
    "bid",
    async ({
      player_id,
      room,
      contract,
      direction,
      tour_name,
      round_num,
      table_id,
    }) => {
      console.log("direction now", direction, contract);
      const nextDirection = direction < 3 ? parseInt(direction, 10) + 1 : 0;

      /// convert contract to suite.
      const suite = contract % 5;
      const team = direction % 2;
      const anotherTeam = nextDirection % 2;
      const isPass = suite === -1;

      console.log("TABLE ID to get", table_id);
      let table_data = access_table(
        (tour_name = tour_name),
        (round_num = round_num),
        (table_id = table_id)
      );
      let access_bidding = table_data.bidding;
      let access_playing = table_data.playing;
      console.log("TABLE ID to get", table_data, access_bidding);

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
              maxContract: access_bidding.maxContract,
            },
          });
          return;
        }
        if (access_bidding.passCount === 4) {
          access_bidding.passCount = 0;

          if (++table_data.cur_board >= tours.maxRound) {
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

      let doubleEnable = !(access_bidding.doubles[team][TYPE.RDBL] == true);
      //ioToRoomOnBiddingPhase({ room, contract, nextDirection });
      ioToRoomOnBiddingPhase({
        room,
        contract,
        nextDirection,
        tour_name,
        round_num,
        table_id,
        doubleEnable,
      });
    }
  );

  socket.on(
    "play_card",
    async ({
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

      //Save played card
      access_playing.playedCards[access_playing.turn - 1] = await {
        ...access_playing.playedCards[access_playing.turn - 1],
        ...{
          [DIRECTIONS[direction]]: card,
          //[`D${direction}`]: card,
        },
      };

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

        // access_bidding.declarer = 0;
        // access_bidding.passCount = 0;
        // access_bidding.isPassOut = true;
        // access_bidding.maxContract = -1;
        // access_bidding.doubles = INIT.doubles;
        // access_bidding.firstDirectionSuites = INIT.firstDirectionSuites;

        /// playing for 13 turn.
        if (
          access_playing.turn >= 13
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
          ///Send board summary
          io.to(room).emit(
            "board-summary",
            access_playing.tricks,
            table_data.score
          );
          ///Save score to boardScores
          let boardIndex = score.findIndexScoreBoard(
            tours[tour_name].boardScores,
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
          ///Save history of board
          await History.updateOne(
            {
              tid: tour_name,
              rounds: {
                $elemMatch: {
                  round_num: parseInt(
                    table_data.table_id.substring(1).split("b")[0]
                  ),
                },
              },
            },
            {
              $push: {
                "rounds.$.boards": table_data,
              },
            }
          );

          ///reset bidding
          // access_bidding.declarer = 0;
          // access_bidding.passCount = 0;
          // access_bidding.isPassOut = true;
          // access_bidding.maxContract = -1;
          // access_bidding.doubles = INIT.doubles;
          // access_bidding.firstDirectionSuites = INIT.firstDirectionSuites;

          ///Change status table to finish
          table_data.status = "Finish";

          ///Count finish
          let finish_table = round_data.tables.filter(
            ({ status }) => status == "Finish"
          );
          let count_finish_table = finish_table.length;

          ioToRoomOnPlaying({
            room,
            status: "default",
            payload: {
              card,
              nextDirection: leader,
              prevDirection: direction,
              initSuite: access_playing.initSuite,
              isFourthPlay: access_playing.communityCards.length === 4,
            },
          });

          io.emit("get-tours", tours[tour_name].rounds);
          //Change board
          if (access_playing.turn >= 13) {
            // if (++table_data.cur_board > tours[tour_name].board_per_round) {
            /// clear all temp var here ...
            ///reset bidding
            // access_bidding.declarer = 0;
            // access_bidding.passCount = 0;
            // access_bidding.isPassOut = true;
            // access_bidding.maxContract = -1;
            // access_bidding.doubles = INIT.doubles;
            // access_bidding.firstDirectionSuites = INIT.firstDirectionSuites;
            // ///reset playing
            // access_playing.turn = 0;
            // access_playing.doubles = [];
            // access_playing.bidSuite = 0;
            // access_playing.communityCards = [];
            // access_playing.initSuite = undefined;
            // access_playing.tricks = [0, 0];
            // access_playing.playedCards = [];
            ioToRoomOnPlaying({
              room,
              status: "ending",
              payload: {
                tricks: access_playing.tricks,
              },
            });
          }

          ///Calculate score per rounds
          if (count_finish_table >= round_data.tables.length) {
            let allBoardIndex = _.range(0, tours[tour_name].board_to_play);
            allBoardIndex.map((boardIndex) => {
              //Save board score NS
              let selectIndexNS = [];
              ///Select pair from all ns
              let selectNS = tours[tour_name].boardScores[
                boardIndex
              ].pairs_score.filter((pair) => pair.direction == 0);
              ///Convert to score array
              let getScoreNS = selectNS.map((score) => score.score);
              console.log("getScoreNS", getScoreNS);
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
                tours[tour_name].boardScores[boardIndex].pairs_score[
                  pair_index
                ]["imp"] = mpNS[index];
                tours[tour_name].boardScores[boardIndex].pairs_score[
                  pair_index
                ]["percent"] = percentNS[index];
              });

              //Save board score EW
              let selectIndexEW = [];
              ///Select pair from all ns
              let selectEW = tours[tour_name].boardScores[
                boardIndex
              ].pairs_score.filter((pair) => pair.direction == 1);
              ///Convert to score array
              let getScoreEW = selectEW.map((score) => score.score);
              let [mpEW, percentEW] = score.calBoardMps(getScoreEW);
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
                tours[tour_name].boardScores[boardIndex].pairs_score[
                  pair_index
                ]["imp"] = mpEW[index];
                tours[tour_name].boardScores[boardIndex].pairs_score[
                  pair_index
                ]["percent"] = percentEW[index];
              });

              socket.to(room).emit("score", tours[tour_name].boardScores);
              socket
                .to("start-room")
                .emit("score", tours[tour_name].boardScores);
            });
            //?Rank
            tours[tour_name].rankPairs.map(({ pair_id }) => {
              let rankIndex = score.findIndexRankPairId(
                tours[tour_name].rankPairs,
                pair_id
              );
              let selfIMP = game.getSelfIMPArray(
                pair_id,
                tours[tour_name].boardScores
              );
              let selfPercent = game.getSelfIPercentArray(
                pair_id,
                tours[tour_name].boardScores
              );
              let [totalMps, rankingPercentage] = score.calRankingScore(
                selfIMP,
                selfPercent
              );
              tours[tour_name].rankPairs[rankIndex]["totalMP"] = totalMps;
              tours[tour_name].rankPairs[rankIndex]["rankPercent"] =
                rankingPercentage;
            });

            io.to(room).emit("all-board-score", tours[tour_name].boardScores);
            ///Send ranking score with name of players
            let rankConvert = await game.convertPairToNameRank(
              tours[tour_name].players,
              tours[tour_name].rankPairs
            );

            io.to(room).emit("rank-with-name", rankConvert);

            io.to(tour_name).emit(
              "finish-all-table",
              finish_table,
              count_finish_table
            );
            round_data.status = "Finish";
            ///Endgame
            let finish_round = tours[tour_name].rounds.filter(
              ({ status }) => status == "Finish"
            );
            let count_finish_round = finish_round.length;
            if (
              count_finish_round >=
              tours[tour_name].board_to_play / tours[tour_name].board_per_round
            ) {
              tours[tour_name].status = "finished";
              await TourR.updateOne(
                { tour_name },
                {
                  $set: {
                    boardScores: tours[tour_name].boardScores,
                    rankPairs: tours[tour_name].rankPairs,
                    status: tours[tour_name].status,
                  },
                }
              );
              console.log("finish game");
              io.to(tour_name).emit("finish-game", "done tour");
            }
            return;
          }

          // ioToRoomOnBiddingPhase({
          //   room,
          //   // contract,
          //   nextDirection,
          //   tour_name,
          //   round_num,
          //   table_id,
          // });

          // access_playing.turn = 0;
          return;
        }

        ioToRoomOnPlaying({
          room,
          status: "default",
          payload: {
            card,
            nextDirection: leader,
            prevDirection: direction,
            initSuite: access_playing.initSuite,
            isFourthPlay: access_playing.communityCards.length === 4,
            bidSuite: access_playing.bidSuite,
          },
        });

        ioToRoomOnPlaying({
          room,
          status: "initial_turn",
          payload: {
            leader,
            turn: ++access_playing.turn,
            tricks: access_playing.tricks,
          },
        });
        access_playing.initSuite = undefined;
        access_playing.communityCards = [];
        return;
      }
      ioToRoomOnPlaying({
        room,
        status: "default",
        payload: {
          card,
          nextDirection,
          prevDirection: direction,
          initSuite: access_playing.initSuite,
          isFourthPlay: access_playing.communityCards.length === 4,
          bidSuite: access_playing.bidSuite,
        },
      });
    }
  );

  socket.on("leave-table", (table_id) => {
    socket.leave(table_id);
  });

  socket.on("join-tour-spec", async (player_name, tour_name) => {
    socket.join(tour_name);
    tours[tour_name]["non_player"].push({
      id: player_name,
      name: player_name,
      status: "spec",
    });
    io.to(tour_name).emit("join-tour-spec", tours[tour_name]);
  });

  socket.on(
    "join-room-spec",
    ({
      spec_name,
      tour_name = "Mark1",
      room = "room_1",
      round_num = 1,
      table_id = "r1b1",
    }) => {
      try {
        socket.join(room);
        users[spec_name].game_status = "spec";

        ///Get all card in round
        let round_data = access_round(tour_name, round_num);
        let get_all_cards = round_data.cards[cur_board];
        let table_data = access_table(tour_name, round_num, table_id);
        socket.emit("test", round_data.cards);
        ///Get played card and convert to array
        let played_card_object = table_data.playing.playedCards;
        let played_card_array = [[], [], [], []];
        played_card_object.map((turn) => {
          played_card_array[0].push(turn["N"]);
          played_card_array[1].push(turn["E"]);
          played_card_array[2].push(turn["S"]);
          played_card_array[3].push(turn["W"]);
        });
        ///Select left card
        let left_card_array = [[], [], [], []];
        get_all_cards.map((all, index_all) => {
          played_card_array.map((played, index_played) => {
            if (index_all == index_played) {
              let left = all.filter((x) => !played.includes(x));
              left_card_array[index_all].push(...left);
              return left;
            }
          });
        });
        //socket.emit("test", get_all_cards, played_card_array, left_card_array);
        socket.emit("test", table_data, left_card_array);
      } catch (error) {
        console.log("error", error);
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
    async (
      tour_id = "Mark1",
      round_num = 1,
      table_id = "r1b1",
      cur_board = 0,
      player_id = "peterpan"
    ) => {
      try {
        //!------------------------------------------------------------------------
        // let now = new Date();
        // // let prevtime = "12/18/2021, 5:06:00 PM";
        // let startTime = "2022-04-16T17:56:00.000Z";
        // let milStartTime = new Date(startTime).getTime();
        // let min = 2;
        // let plus2min = milStartTime + 60000 * min;
        // let human = new Date(plus2min);
        // console.log("human", human);
        // let curTime = new Date();
        // let milCurTme = curTime.getTime();
        // let diff_time = milStartTime - milCurTme;
        // console.log("diff_time", diff_time);
        // console.log("now", now);
        //!------------------------------------------------------------------------
        // let userInRoom = ["aaabbb", "ccscaaa", "wwweee", "qweqwe"];
        // let count = 0;
        // userInRoom.map((id) => {
        //   tours["Mark1"].players.map((player) => {
        //     console.log("player", player);
        //     if (id == player.socket_id) {
        //       count++;
        //     }
        //   });
        // });
        // console.log("pass");
        // console.log("pass", count);
        // if (count == 4) {
        //   console.log("joinroom");
        // }
        //!------------------------------------------------------------------------
        // let all_room = io.sockets.adapter.sids;
        // //let all_room = io.sockets.adapter.sids.get(socket.id);
        // console.log("all_room", all_room);
        // console.log("first", socket.id, typeof socket.id);
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
        let temp_bid = (({ declarer, maxContract, doubles }) => ({
          declarer,
          maxContract,
          doubles,
        }))(table_data.bidding);
        let temp_play = (({ tricks }) => ({ tricks }))(table_data.playing);
        let output = {
          round: round_num,
          boardSequence: table_data.boards.length,
          board_num: table_data.cur_board,
          total_round:
            tours[tour_id].board_to_play / tours[tour_id].board_per_round,
          ...temp_bid,
          ...temp_play,
        };

        socket.emit("getCurrentMatchInfo", output);
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
      let selfScore = game.getSelfScore(getPairId, tours[tour_id].boardScores);
      socket.emit("getSelfScore", selfScore);
    } catch (error) {
      console.log("error", error);
    }
  });

  socket.on("getNsRankings", (tour_id) => {
    try {
      let SelectNSPair = [];
      let boardIndex = 0;
      tours[tour_id].boardScores[boardIndex].pairs_score.map((pair) => {
        if (pair.direction == 0) {
          SelectNSPair.push(parseInt(pair.pair_id));
        }
      });
      let getNSRank = tours[tour_id].rankPairs.filter((pair) =>
        SelectNSPair.includes(pair.pair_id)
      );
      socket.emit("getNsRankings", getNSRank);
    } catch (error) {
      console.log("error", error);
    }
  });

  socket.on("getEwRankings", (tour_id) => {
    try {
      let SelectEWPair = [];
      let boardIndex = 0;
      tours[tour_id].boardScores[boardIndex].pairs_score.map((pair) => {
        if (pair.direction == 1) {
          SelectEWPair.push(parseInt(pair.pair_id));
        }
      });
      let getEWRank = tours[tour_id].rankPairs.filter((pair) =>
        SelectEWPair.includes(pair.pair_id)
      );
      socket.emit("getEwRankings", getEWRank);
    } catch (error) {
      console.log("error", error);
    }
  });

  socket.on(
    "getCurrentMatchStatus",
    (tour_id = "Mark1", round_num = 1, table_id = "r1b1") => {
      let table_data = access_table(tour_id, round_num, table_id);
      let versus = table_data.versus.split(",");
      return {
        nsTeam: versus[0],
        nsTeam: versus[1],
        status: table_data.status,
      };
    }
  );

  socket.on(
    "getMyPastMatch",
    async (tour_id = "Mark1", username = "plantA") => {
      try {
        let pairId = game.getPairId(tours[tour_id], username);
        let all_round = tours[tour_id].rounds.map((round) => {
          let select_table = round.tables.filter((table) =>
            table.versus.split(",").includes(pairId.toString())
          );
          let all_table = select_table.map((table) => {
            let boardIndex = score.findIndexScoreBoard(
              tours[tour_id].boardScores,
              table.cur_board
            );
            let rankIndex = score.findIndexRankPairId(
              tours[tour_id].rankPairs,
              pairId
            );
            if (
              tours[tour_id].boardScores[boardIndex].pairs_score[rankIndex] ==
                undefined ||
              tours[tour_id].rankPairs[rankIndex] == undefined
            ) {
              return {
                table_id: table.table_id,
                directions: table.directions,
                declarer: table.bidding.declarer,
                NSScore: table.score[0],
                EWScore: table.score[1],
                MP: undefined,
                totalMP: undefined,
              };
            } else
              return {
                table_id: table.table_id,
                directions: table.directions,
                declarer: table.bidding.declarer,
                NSScore: table.score[0],
                EWScore: table.score[1],
                MP: tours[tour_id].boardScores[boardIndex].pairs_score[
                  rankIndex
                ].imp,
                totalMP: tours[tour_id].rankPairs[rankIndex].totalMP,
              };
          });
          return { round: round.round_num, tables: all_table };
        });
        socket.emit("getMyPastMatch", all_round);
      } catch (error) {
        console.log("error is", error);
      }
    }
  );

  socket.on("grant_user_to_td", async (admin, username = "plantA") => {
    let db_user = await User.findOne({ username });
    if (users[username] != undefined) {
      users[username].access = "td";
      io.emit("grant_user_to_td", (users[username].access = "td"));
    }
    console.log("data", users[username]);
    let update_user = await User.updateOne(
      {
        username,
      },
      {
        $set: {
          access: "td",
        },
      }
    );
    socket.emit("grant_user_to_td", update_user);
  });

  socket.on("refuse_user_to_td", async (admin, username = "plantA") => {
    let db_user = await User.findOne({ username });
    if (users[username] != undefined) {
      users[username].access = "user";
      io.emit("refuse_user_to_td", (users[username].access = "user"));
    }
    console.log("data", users[username]);
    let update_user = await User.updateOne(
      {
        username,
      },
      {
        $set: {
          access: "user",
        },
      }
    );
    socket.emit("refuse_user_to_td", update_user);
  });

  socket.on("ban_user", async (admin, username = "plantA") => {
    let db_user = await User.findOne({ username });
    if (users[username] != undefined) {
      users[username].access = "ban";
      io.emit("refuse_user_to_td", (users[username].access = "ban"));
    }
    let update_user = await User.updateOne(
      {
        username,
      },
      {
        $set: {
          access: "ban",
        },
      }
    );
    socket.emit("ban_user", update_user);
  });
  socket.on("refuse_ban_user", async (admin, username = "plantA") => {
    let db_user = await User.findOne({ username });
    if (users[username] != undefined) {
      users[username].access = "user";
      io.emit("refuse_ban_user", (users[username].access = "user"));
    }
    let update_user = await User.updateOne(
      {
        username,
      },
      {
        $set: {
          access: "user",
        },
      }
    );
    socket.emit("refuse_ban_user", update_user);
  });
  socket.on("get-time", () => {
    let currentTime = new Date();
    let currentHours = currentTime.getHours();
    let currentMinutes = currentTime.getMinutes();
    let currentSeconds = currentTime.getSeconds();

    // Pad the minutes and seconds with leading zeros, if required
    currentMinutes = (currentMinutes < 10 ? "0" : "") + currentMinutes;
    currentSeconds = (currentSeconds < 10 ? "0" : "") + currentSeconds;

    // Choose either "AM" or "PM" as appropriate
    let timeOfDay = currentHours < 12 ? "AM" : "PM";

    // Convert the hours component to 12-hour format if needed
    currentHours = currentHours > 12 ? currentHours - 12 : currentHours;

    // Convert an hours component of "0" to "12"
    currentHours = currentHours == 0 ? 12 : currentHours;

    // Compose the string for display
    let currentTimeString =
      currentHours +
      ":" +
      currentMinutes +
      ":" +
      currentSeconds +
      " " +
      timeOfDay;
    socket.emit("test", currentTimeString);
  });
  socket.on("getAllUserList", async () => {
    let all_user = await User.find();
    socket.emit("getAllUserList", all_user);
  });
  socket.on("getAllScore", async (tour_id) => {
    socket.emit("getAllScore", tours[tour_id].boardScores);
  });
  socket.on("removeAllHistoryData", async (tour_id) => {
    await History.deleteMany({ tid: tour_id });
  });
  socket.on("getAllUserOnline", () => {
    socket.emit("test", users);
  });
  socket.on("getAllFinishedTour", async (/*callback*/) => {
    try {
      let endTour = await TourR.find({ status: "finished" });
      console.log("endTour", endTour);
      let tourList = [];
      endTour.map((tour) => {
        let tourData = {
          host: tour.createBy,
          title: tour.tour_name,
          type: String(tour.type),
          players: String(tour.players.length),
          mode: tour.score_type,
          status: tour.status,
        };
        tourList.push(tourData);
      });
      console.log(`tourList`, tourList);
      socket.emit("getAllFinishedTour", tourList);
      // callback(tourList);
    } catch (error) {
      console.log("error", error);
    }
  });
  socket.on("getScoreFinishedTour", async (tour_name) => {
    try {
      let getFinTour = await TourR.find({ tour_name });
      console.log("getFinTour", getFinTour);
      socket.emit("getScoreFinishedTour", getFinTour);
    } catch (error) {
      console.log("error", error);
    }
  });
  socket.on(
    "TdEditScore",
    async (tour_name, board_num, pair_id, typeScore, key, value) => {
      board_num = parseInt(board_num);
      pair_id = parseInt(pair_id);
      value = parseInt(value);
      let this_tour = await TourR.find({ tour_name });
      this_tour = this_tour[0];
      if (typeScore == "boardScores") {
        let newPairsScore = this_tour.boardScores[
          board_num - 1
        ].pairs_score.map((pair) => {
          if (pair.pair_id == pair_id) {
            pair[key] = value;
          }
          return pair;
        });
        this_tour.boardScores[board_num - 1].pairs_score = newPairsScore;
      } else if (typeScore == "rankPairs") {
        let newRankPair = this_tour.rankPairs.map((pair) => {
          if (pair.pair_id == pair_id) {
            pair[key] = value;
          }
          return pair;
        });
        this_tour.rankPairs = newRankPair;
      }
      await TourR.updateOne({ tour_name }, { $set: { ...this_tour } });
      io.emit("TdEditScore", this_tour);
    }
  );
  socket.on("getPastScore", async (tour_name) => {
    let this_tour = await TourR.find({ tour_name });
    this_tour = this_tour[0];
    let getPastScore = this_tour.boardScores.map((board) => {
      let newScore = board.pairs_score.map((pair) => {
        let player = this_tour.players.filter(
          (player) => player.pair_id == pair.pair_id
        );
        return {
          pair_id: pair.pair_id,
          name1: player[0].name,
          name2: player[1].name,
          direction: pair.direction,
          score: pair.score,
        };
      });
      return { board_num: board.board_num, newScore };
    });
    io.emit("getPastScore", getPastScore);
  });
  socket.on("test-join", (name) => {
    socket.join(name);
    console.log("my-room", io.sockets.adapter.sids.get(socket.id));
    console.log("all-room", io.sockets.adapter.rooms);
  });
  socket.on("leave-join", (name) => {
    socket.leave(name);
  });
  socket.on("create-finish-tour", async () => {
    await TourR.create(bypass.generateFullGameData());
    console.log("create finish tour successful");
  });
  socket.on("disconnect", async () => {
    console.log("User was disconnect");
    // console.log("all room", io.sockets.adapter.sids);
    let this_user = socket.handshake.query.username;
    let this_tour = users[this_user].tour;
    if (users[this_user].tour != undefined) {
      users[this_user].tour = undefined;
      tours[this_tour].players = tours[this_tour].players.filter(
        (player) => player.name != this_user
      );
    }
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
