const io = require("socket.io-client");
describe("Suite of unit tests", function () {
  var socket;

  beforeEach(function (done) {
    // Setup
    let token =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNjFiMzAyYjgzNGFhMjFkMDVmNjg5Zjc4IiwiZW1haWwiOiJhZG1pbkBlbWFpbC5jb20iLCJ1c2VybmFtZSI6IkFkbWluIiwiYWNjZXNzIjoidXNlciIsImlhdCI6MTYzOTEyMTY0MiwiZXhwIjoxNjM5MTI4ODQyfQ.3JLWR5AH5PH8j6Yzq0vFYtArSs1kRPvW67qCCmJdQF0";
    let username = "Admin";
    socket = io.connect("http://localhost:3000", {
      query: { token, username },
    });
    socket.on("connect", function () {
      console.log("worked...");
      done();
    });
    socket.on("disconnect", function () {
      console.log("disconnected...");
    });
  });

  afterEach(function (done) {
    // Cleanup
    // if (socket.connected) {
    //   console.log("disconnecting...");
    //   socket.disconnect();
    // } else {
    //   // There will not be a connection unless you have done() in beforeEach, socket.on('connect'...)
    //   console.log("no connection to break...");
    // }
    done();
  });

  test("should work", () => {
    socket.on("test", (arg) => {
      expect(arg).toBe("test done");
      done();
    });
    //serverSocket.emit("test", "test done");
  });
  // describe("First (hopefully useful) test", function () {
  //   it("Doing some things with indexOf()", function (done) {
  //     expect([1, 2, 3].indexOf(5)).to.be.equal(-1);
  //     expect([1, 2, 3].indexOf(0)).to.be.equal(-1);
  //     done();
  //   });

  //   it("Doing something else with indexOf()", function (done) {
  //     expect([1, 2, 3].indexOf(5)).to.be.equal(-1);
  //     expect([1, 2, 3].indexOf(0)).to.be.equal(-1);
  //     done();
  //   });
  // });
});
