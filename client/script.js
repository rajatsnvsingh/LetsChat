$(function() {
  let user = null;
  var socket = io();
  $(".alert").hide();
  // Logic to handle message submission and user commands
  $("form").submit(function(e) {
    e.preventDefault();
    let message = $("#m").val();
    if (message.startsWith("/nickcolor")) {
      let value = getValueFromCommand(message);
      if (/(^[0-9A-F]{6}$)/i.test(value)) {
        value = "#" + value;
      }
      let colorOk = /(^#[0-9A-F]{6}$)/i.test(value);
      if (colorOk) {
        socket.emit("change namecolor", value, function(success, message) {
          if (success) {
            user.color = value;
            $(".user-name")
              .text(user.name)
              .css("color", user.color);
            showAlert("Your color has changed to: " + value);
          } else {
            //name = value;
            showAlert("Please enter a unique color!");
          }
        });
      } else {
        showAlert("Please enter a valid color!!");
        return;
      }
    } else if (message.startsWith("/nick")) {
      let value = getValueFromCommand(message);
      if (value.length > 8) {
        showAlert("Please choose a nick name that is less than 8 characters!");
        return;
      }
      socket.emit("change name", value, function(success, message) {
        if (success) {
          //name = value;
          user.name = value;
          $(".user-name")
            .text(user.name)
            .css("color", user.color);
          showAlert("Your name has changed to: " + value);
        } else {
          showAlert("Please enter a unique name!");
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
    addMessage(msg);
  });

  // This function is called when the user is initially setup by the server.
  socket.on("info", function(data, chatLog) {
    user = data;
    $(".user-name")
      .text(user.name)
      .css("color", user.color);
    if (chatLog.length > 0) {
      for (i = 0; i < chatLog.length; i++) {
        addMessage(chatLog[i]);
      }
    }
  });

  // Updates the User List
  socket.on("user list", function(data) {
    $(".user-list").empty();
    for (i = 0; i < data.length; i++) {
      $(".user-list").append(
        $("<div>")
          .text(data[i].name)
          .addClass("list-user")
          .css("color", data[i].color)
      );
    }
  });

  function addMessage(msg) {
    let messageContent =
      '<div class="message-content">' + msg.message + "</div>";
    let messageUser =
      '<div class="message-user"' +
      'style="color: ' +
      msg.user.color +
      ';"' +
      ">" +
      msg.user.name +
      "</div>";
    let messageTime =
      '<div class="message-time">' + generateTimeStamp(msg.time) + "</div>";
    console.log(msg);
    $("#chat-log").append(
      $("<div>")
        .html(messageTime + messageUser + messageContent)
        .addClass(function() {
          let cl = "message";
          if (msg.user.name == user.name) {
            cl = cl + " own-message";
          }
          return cl;
        })
    );
    var d = $("#chat-log");
    d.scrollTop(d.prop("scrollHeight"));
  }
});

function showAlert(message) {
  $(".alert").text(message);
  $(".alert")
    .show()
    .delay(1200)
    .fadeOut();
}

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
