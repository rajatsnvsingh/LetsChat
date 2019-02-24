var express = require("express");
var app = express();
var http = require("http").Server(app);
app.use(express.static(__dirname + "/client"));

var io = require("socket.io")(http);

const userNames = ["parrot", "carrot", "harlot"];
let users = [];

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/client/index.html");
});

io.on("connection", function(socket) {
  console.log("a user connected");
  let userName = randomName();
  users.push(userName);
  socket.user = userName;
  socket.emit("name", userName);
  io.emit("user list", users);
  socket.on("disconnect", function() {
    console.log("user disconnected");
    users = users.filter(name => name !== userName);
    io.emit("user list", users);
  });
  socket.on("chat message", function(msg) {
    console.log("message: " + msg);
    var today = new Date();
    var time =
      today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    io.emit("chat message", {
      user: socket.user,
      message: msg,
      timestamp: generateTimeStamp()
    });
  });
});

http.listen(3000, function() {
  console.log("listening on *:3000");
});

function randomName() {
  let availableNames = userNames.filter(name => !users.includes(name));
  return availableNames[Math.floor(Math.random() * availableNames.length)];
}

function generateTimeStamp() {
  let current = new Date();
  let hours = current.getHours();
  let min = current.getMinutes();
  let meridiem = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours == 0) hours = 12;
  if (min < 10) min = "0" + min;
  return hours + ":" + min + " " + meridiem;
}
