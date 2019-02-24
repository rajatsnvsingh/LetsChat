var express = require("express");
var app = express();
var http = require("http").Server(app);
app.use(express.static(__dirname + "/client"));

var io = require("socket.io")(http);

const userNames = ["parrot", "carrot", "harlot"];
const colorLibrary = ["#F1C40F", "#8E44AD", "#1ABC9C"];
let users = [];
let colors = [];

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/client/index.html");
});

io.on("connection", function(socket) {
  // When a user connects
  console.log("a user connected");
  socket.user = randomName();
  socket.color = randomColor();
  users.push(socket.user);
  socket.emit("name", socket.user);
  io.emit("user list", users);

  // On Disconnect
  socket.on("disconnect", function() {
    console.log(socket.user + " disconnected");
    users = users.filter(name => name !== socket.user);
    colors = colors.filter(color => color !== socket.color);
    io.emit("user list", users);
  });

  // Relaying Chat Message
  socket.on("chat message", function(msg) {
    io.emit("chat message", {
      user: socket.user,
      color: socket.color,
      message: msg,
      time: new Date()
    });
  });

  // Changing User Name
  socket.on("change name", function(name, callback) {
    if (users.includes(name)) {
      callback(false, "Name not unique in room");
    } else {
      users[users.indexOf(socket.user)] = name;
      socket.user = name;
      callback(true, "Name changed to " + name);
      io.emit("user list", users);
    }
  });

  // Changing User Name
  socket.on("change namecolor", function(color, callback) {
    if (colors.includes(color)) {
      callback(false, "Color is not unique in room");
    } else {
      colors[colors.indexOf(socket.color)] = color;
      socket.color = color;
      callback(true, "Color changed to " + color);
      io.emit("user list", users);
    }
  });
});

http.listen(3000, function() {
  console.log("listening on *:3000");
});

function randomName() {
  let availableNames = userNames.filter(name => !users.includes(name));
  return availableNames[Math.floor(Math.random() * availableNames.length)];
}

function randomColor() {
  let availableColors = colorLibrary.filter(color => !colors.includes(color));
  return availableColors[Math.floor(Math.random() * availableColors.length)];
}
