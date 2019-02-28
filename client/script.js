$(function() {
  // Application Setup
  let user = null;
  let socket = io();
  $(".alert").hide();

  // Logic to handle message submission and user commands
  $("form").submit(function(e) {
    e.preventDefault();
    let message = $("#m").val();

    // Check for color change command.
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
      // execute if nick name command detected
      let value = getValueFromCommand(message);
      if (value.length > 8) {
        showAlert("Please choose a nick name that is less than 8 characters!");
        return;
      }
      socket.emit("change name", value, function(success, message) {
        if (success) {
          user.name = value;
          // Must update cookies for identification.
          setCookie("user", user.name, 3);
          $(".user-name")
            .text(user.name)
            .css("color", user.color);
          showAlert("Your name has changed to: " + value);
        } else {
          showAlert("Please enter a unique name!");
        }
      });
    } else {
      // No command found - transmit chat message.
      socket.emit("chat message", $("#m").val());
    }
    $("#m").val("");
    return false;
  });

  // Method called when someone sends a message.
  socket.on("chat message", function(msg) {
    addMessage(msg);
  });

  // Handle for when the room is at max capacity
  socket.on("full room", function() {
    showAlert("The chat room is full, please try later.");
  });

  // This function is called when the user is initially setup by the server.
  socket.on("info", function(data, chatLog, time) {
    user = data;
    // Setting Cookies and User Info
    setCookie("user", user.name, 3);
    setCookie("timeC", time, 3);
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

  // This function adds a message to the chat log.
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
    $("#chat-log").scrollTop($("#chat-log").prop("scrollHeight"));
  }

  // Used to show a 1.2 sec alert to the user.
  function showAlert(message) {
    $(".alert").text(message);
    $(".alert")
      .show()
      .delay(1200)
      .fadeOut();
  }

  // Creates a time stamp which is appended to the chat message.
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

  // Retrieves the command the user enters.
  function getValueFromCommand(command) {
    return command.substr(command.indexOf(" ") + 1).trim();
  }

  // Function used to set cookie.
  function setCookie(cname, cvalue, exdays) {
    let date = new Date();
    date.setTime(date.getTime() + exdays * 24 * 60 * 60 * 1000);
    let expires = "expires=" + date.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
  }
});
