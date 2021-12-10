const http = require("http");
const app = require("../app");
const Server = require("socket.io");
const Client = require("socket.io-client");


describe("my awesome project", () => {
  let io, serverSocket, clientSocket;

  beforeAll((done) => {

    // let token ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNjFiMmY3NGEyZjJlMTJjZmIyNDAwNjMwIiwiZW1haWwiOiJ1c2VyQGdtYWlsLmNvbSIsInVzZXJuYW1lIjoidXNlciIsImFjY2VzcyI6InVzZXIiLCJpYXQiOjE2MzkxMjA3ODgsImV4cCI6MTYzOTEyNzk4OH0.FZhdLkjMOuybY3h6RdQKL9iv1AP1A1D1EFBT8C9SXbc"
    // let username = "user"
    // httpServerAddr = httpServer.listen().address();
    // io = new Server();
    // serverSocket = io.connect(`http://localhost:${port}`, {'query': { token, username }});

    const httpServer = http.createServer(app);
    io = new Server(httpServer);
    httpServer.listen(8000, () => {
      clientSocket = new Client(`http://localhost:8000`);
      io.on("connection", (socket) => {
        serverSocket = socket;
      });
      clientSocket.on("connect", done);
    });
  });

  afterAll(() => {
    serverSocket.close();
    clientSocket.close();
  });

  test("should work", (done) => {
    clientSocket.on("hello", (arg) => {
      expect(arg).toBe("world");
      done();
    });
    serverSocket.emit("hello", "world");
  });

//   test("should work (with ack)", (done) => {
//     serverSocket.on("hi", (cb) => {
//       cb("hola");
//     });
//     clientSocket.emit("hi", (arg) => {
//       expect(arg).toBe("hola");
//       done();
//     });
//   });
});
