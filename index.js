let express = require("express");
let app = express();
let http = require("http").Server(app);
let cookieManager = require("cookie");
let io = require("socket.io")(http);

// This limits the amount of messages to store.
let chatLogLimit = 500;
let serverStartTime = Date.now();

// Serve static client files
app.use(express.static(__dirname + "/client"));

// Library from which random names and colors are served
const userNames = ["parrot", "carrot", "harlot", "sharlot", "marriot", "riot"];
const colorLibrary = [
  "#F1C40F",
  "#8E44AD",
  "#1ABC9C",
  "#2BAFA7",
  "#C0DA05",
  "#DA05D4"
];

// Structures used for semi-persistent storage.
let users = [];
let chatLog = [];

// Default route where client gets served the app.
app.get("/", function(req, res) {
  res.sendFile(__dirname + "/client/index.html");
});

// Socket Connection Logic
io.on("connection", function(socket) {
  // Check cookies to see if the customer is a returning customer
  var checkReturn = checkReturning(socket.handshake.headers.cookie);
  if (checkReturn) {
    // If returning, reactivate the user object.
    console.log("returning User: " + checkReturn);
    socket.user = checkReturn;
    // tabs are used to account for concurrent sessions from the same user.
    socket.user.tabs = socket.user.tabs + 1;
    socket.user.active = true;
  } else {
    // If the room is full (active and inactive), reject entry for user.
    if (users.length === userNames.length) {
      socket.emit("full room");
      return;
    }
    // Creating a new user
    socket.user = {};
    socket.user.name = randomName();
    socket.user.color = randomColor();
    socket.user.tabs = 1;
    socket.user.active = true;
    users.push(socket.user);
    console.log("new user: " + socket.user.name);
  }

  socket.emit("info", socket.user, chatLog, Date.now());
  io.emit("user list", users.filter(e => e.active === true));

  // On Disconnect
  socket.on("disconnect", function() {
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

// Random Name Helper Function
function randomName() {
  let availableNames = userNames.filter(
    name => !users.some(user => user.name === name)
  );
  return availableNames[Math.floor(Math.random() * availableNames.length)];
}

// Random Color Helper Function
function randomColor() {
  let availableColors = colorLibrary.filter(
    color => !users.some(user => user.color === color)
  );
  return availableColors[Math.floor(Math.random() * availableColors.length)];
}

// This function checks for various conditions to determine whether to treat a user as new or returning.
function checkReturning(cookie) {
  // If client sends no cookies
  if (typeof cookie == "undefined") return false;
  let c = cookieManager.parse(cookie);
  // If the user cookie doesn't exist
  if (typeof c.user == "undefined") return false;
  // If the cookies were created before the server started
  // This is important because of lack of server persistence.
  if (c.timeC < serverStartTime) return false;
  // Check if there is a user object in the server for the mentioned cookie.
  // Implementation for denying customer modified cookie usernames.
  let result = users.filter(function(x) {
    return x.name == c.user;
  });
  if (result.length < 1) return false;
  return result[0];
}
