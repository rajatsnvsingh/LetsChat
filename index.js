let express = require("express");
let app = express();
let http = require("http").Server(app);
let cookieManager = require("cookie");
let io = require("socket.io")(http);
let chatLogLimit = 200;
let serverStartTime = Date.now();

app.use(express.static(__dirname + "/client"));
const userNames = ["parrot", "carrot", "harlot", "sharlot", "marriot", "riot"];
const colorLibrary = [
  "#F1C40F",
  "#8E44AD",
  "#1ABC9C",
  "#2BAFA7",
  "#C0DA05",
  "#DA05D4"
];
let users = [];
//let activeUsers = [];
let chatLog = [];

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/client/index.html");
});

io.on("connection", function(socket) {
  var checkReturn = checkReturning(socket.handshake.headers.cookie);

  if (checkReturn) {
    socket.user = checkReturn;
    socket.user.tabs = socket.user.tabs + 1;
    socket.user.active = true;
    // if (activeUsers.filter(e => e.name === socket.user.name).length < 1) {
    //   activeUsers.push(socket.user);
    // }
  } else {
    console.log("new user");
    if (users.length === userNames.length) {
      socket.emit("full room");
      return;
    }
    socket.user = {};
    socket.user.name = randomName();
    socket.user.color = randomColor();
    socket.user.tabs = 1;
    socket.user.active = true;
    users.push(socket.user);
  }

  socket.emit("info", socket.user, chatLog, Date.now());
  io.emit("user list", users.filter(e => e.active === true));

  // On Disconnect
  socket.on("disconnect", function() {
    console.log(socket.user.name + " disconnected");
    var openTabs = 0;
    for (var i in users) {
      if (users[i].name == socket.user.name) {
        users[i].tabs = users[i].tabs - 1;
        openTabs = users[i].tabs;
        break;
      }
    }
    if (openTabs < 1) {
      users[users.indexOf(socket.user)].active = false;
      //activeUsers = activeUsers.filter(user => user !== socket.user);
    }

    io.emit("user list", users.filter(e => e.active === true));
  });

  // Relaying Chat Message
  socket.on("chat message", function(msg) {
    let message = {
      user: socket.user,
      message: msg,
      time: new Date()
    };
    if (chatLog.length === chatLogLimit) chatLog.shift();
    chatLog.push(message);
    io.emit("chat message", message);
  });

  // Changing User Name
  socket.on("change name", function(name, callback) {
    if (users.some(user => user.name === name)) {
      callback(false, "Name not unique in room");
    } else {
      users[users.indexOf(socket.user)].name = name;
      socket.user.name = name;
      callback(true, "Name changed to " + name);
      io.emit("user list", users.filter(e => e.active === true));
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
      io.emit("user list", users.filter(e => e.active === true));
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

function checkReturning(cookie) {
  if (typeof cookie == "undefined") return false;
  let c = cookieManager.parse(cookie);
  if (this.timeC < serverStartTime) return false;
  if (typeof c.user == "undefined") return false;
  let result = users.filter(function(x) {
    return x.name == c.user;
  });
  if (result.length < 1) return false;
  return result[0];
}
