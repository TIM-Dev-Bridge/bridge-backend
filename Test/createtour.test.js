const { JsonWebTokenError } = require("jsonwebtoken");
const { io } = require("socket.io-client");

// Setup

const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNjIxZGYxODkyYTNmYmM2ZmYwZGIzYWFhIiwiZW1haWwiOiJ0ZEBnbWFpbC5jb20iLCJ1c2VybmFtZSI6InRkMDAwMSIsImFjY2VzcyI6InRkIiwiaWF0IjoxNjQ2MTI5NjMwLCJleHAiOjE2NDYxMzY4MzB9.PRrJfC-b9whjfPlRRXKzM62DEG3hoQl95JqAk0a-1FA";
const username = "td0001";
var socket = io("http://localhost:4000", { query: { token, username } });
jest.setTimeout(10000);

beforeAll(async () => {
  socket.on("connect", function () {
    console.log("worked...");
  });
  socket.on("disconnect", function () {
    console.log("disconnected...");
  });
  await new Promise((resolve) => {
    setTimeout(resolve, 3000);
  });
});

// test("should work", () => {
//   const aaa = new Promise((resolve) => {
//     console.log("MARK");
//     socket.emit("test", (arg) => {
//       console.log(arg.msg);
//       resolve("MARKKODTAE");
//     });
//   });
//   return aaa.then((msg) =>{
//     expect(msg).toBe("MARKKODTAE");
//   });
// });

// test("should work 2", () => {
//   return new Promise((resolve) => {
//     console.log("MARK");
//     socket.on("test2", (arg) => {
//       console.log(arg);
//       resolve(arg);
//     });
//     socket.emit("test2")
//   }).then((msg) =>{
//     expect(msg).toBe("KODTAE");
//     expect(msg).toBe("KODMARK");
//   });
// });

// test("should work", done => {
//   console.log("MARK");
//   socket.emit("test", (arg) => {
//     console.log(arg.msg);
//     expect(msg).toBe("MARKPONGTAI")
//     expect(msg).toBe("MARKHEETAD")
//     done()
//   });
// });

describe("Create tournament with valid information", () => {
  test("not already exist : respond with message : Tournament created successfully", () => {
    return new Promise((resolve) => {
      console.log("Start");
      socket.on("create-tour", (arg) => {
        console.log(arg);
        resolve(arg);
      });
      socket.emit("create-tour", {
        tour_name: "testtournament",
        max_player: 20,
        type: "Pairs",
        password: "11501112",
        player_name: [],
        player_team: [],
        time_start: "13/12/2021, 5:08:00 PM",
        status: "Pending",
        board_to_play: 8,
        minute_board: 15,
        board_round: 6,
        movement: "Pairs",
        scoring: "MP",
        barometer: true,
        createBy: "td0001",
      })
    }).then((msg) =>{
      expect(msg.tourId).toBeDefined();
      expect(msg.status).toBe("Tournament created successfully");
    });
  });
});

