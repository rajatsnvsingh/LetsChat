var express = require("express");
var app = express();
var http = require("http").Server(app);
app.use(express.static(__dirname + "/client"));

var io = require("socket.io")(http);

const userNames = ["parrot", "carrot", "harlot"];
const colorLibrary = ["#F1C40F", "#8E44AD", "#1ABC9C"];
let users = [];
//let colors = [];

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/client/index.html");
});

io.on("connection", function(socket) {
  // When a user connects
  console.log("a user connected");
  socket.user = {};
  socket.user.name = randomName();
  socket.user.color = randomColor();
  users.push(socket.user);
  socket.emit("info", socket.user);
  io.emit("user list", users);

  // On Disconnect
  socket.on("disconnect", function() {
    console.log(socket.user + " disconnected");
    users = users.filter(user => user !== socket.user);
    io.emit("user list", users);
  });

  // Relaying Chat Message
  socket.on("chat message", function(msg) {
    io.emit("chat message", {
      user: socket.user,
      message: msg,
      time: new Date()
    });
  });

  // Changing User Name
  socket.on("change name", function(name, callback) {
    if (users.some(user => user.name === name)) {
      callback(false, "Name not unique in room");
    } else {
      users[users.indexOf(socket.user)].name = name;
      socket.user.name = name;
      callback(true, "Name changed to " + name);
      io.emit("user list", users);
    }
  });

  // Changing User Color
  socket.on("change namecolor", function(color, callback) {
    if (users.some(user => user.color === color)) {
      callback(false, "Color is not unique in room");
    } else {
      users[users.indexOf(socket.user)].color = color;
      socket.user.color = color;
      callback(true, "Color changed to " + color);
      io.emit("user list", users);
    }
  });
});

http.listen(3000, function() {
  console.log("listening on *:3000");
});

function randomName() {
  let availableNames = userNames.filter(
    name => !users.some(user => user.name === name)
  );
  return availableNames[Math.floor(Math.random() * availableNames.length)];
}

function randomColor() {
  let availableColors = colorLibrary.filter(
    color => !users.some(user => user.color === color)
  );
  return availableColors[Math.floor(Math.random() * availableColors.length)];
}
