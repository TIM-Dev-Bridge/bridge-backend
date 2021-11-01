const http = require("http");
const app = require("./app");
const server = http.createServer(app);
const io = require("socket.io")(server);
const { API_PORT } = process.env;
const port = process.env.PORT || API_PORT;


io.on("connection", (socket) => {
    console.log("New connection");
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});