$(function() {
  let user = null;
  var socket = io();

  // Logic to handle message submission and user commands
  $("form").submit(function(e) {
    e.preventDefault();
    let message = $("#m").val();
    if (message.startsWith("/nickcolor")) {
      let value = getValueFromCommand(message);
      let colorOk = /(^#[0-9A-F]{6}$)|(^[0-9A-F]{6}$)/i.test(value);
      if (colorOk) {
        socket.emit("change namecolor", value, function(success, message) {
          if (success) {
            alert("Your color has changed to: " + value);
          } else {
            //name = value;
            alert("Please enter a unique color!");
          }
        });
      } else {
        alert("Please enter a valid color!!");
        return;
      }
    } else if (message.startsWith("/nick")) {
      let value = getValueFromCommand(message);
      socket.emit("change name", value, function(success, message) {
        if (success) {
          alert("Your name has changed to: " + value);
        } else {
          name = value;
          alert("Please enter a unique name!");
        }
      });
    } else {
      socket.emit("chat message", $("#m").val());
    }
    $("#m").val("");
    return false;
  });

  // Method called when someone sends a message.
  socket.on("chat message", function(msg) {
    let timestamp = generateTimeStamp(msg.time);
    let message = msg.user.name + ": " + msg.message + "  (" + timestamp + ")";
    if (msg.user.name == user.name) message = "<b>" + message + "</b>";
    $("#messages").append(
      $("<li>")
        .html(message)
        .css("color", msg.user.color)
    );
  });

  // This function is called when the user is initially setup by the server.
  socket.on("info", function(data) {
    user = data;
    $("#messages").append(
      $("<li>")
        .text("You are: " + user.name)
        .css("color", user.color)
    );
  });

  // Updates the User List
  socket.on("user list", function(data) {
    $("#user-list").empty();
    for (i = 0; i < data.length; i++) {
      $("#user-list").append(
        $("<li>")
          .text(data[i].name)
          .css("color", data[i].color)
      );
    }
  });
});

function generateTimeStamp(input) {
  let current = new Date(input);
  let hours = current.getHours();
  let min = current.getMinutes();
  let sec = current.getSeconds();
  let meridiem = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours == 0) hours = 12;
  if (min < 10) min = "0" + min;
  if (sec < 10) sec = "0" + sec;
  return hours + ":" + min + ":" + sec + " " + meridiem;
}

function getValueFromCommand(command) {
  return command.substr(command.indexOf(" ") + 1).trim();
}
