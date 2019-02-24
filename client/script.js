let name = null;
$(function() {
  var socket = io();
  $("form").submit(function(e) {
    e.preventDefault(); // prevents page reloading
    socket.emit("chat message", $("#m").val());
    $("#m").val("");
    return false;
  });
  socket.on("chat message", function(msg) {
    let message = msg.user + ": " + msg.message + "  (" + msg.timestamp + ")";
    if (msg.user === name) message = "<b>" + message + "</b>";
    $("#messages").append($("<li>").html(message));
  });
  socket.on("name", function(msg) {
    name = msg;
    $("#messages").append($("<li>").text("You are: " + name));
  });
  socket.on("user list", function(msg) {
    $("#user-list").empty();
    for (i = 0; i < msg.length; i++) {
      $("#user-list").append($("<li>").text(msg[i]));
    }
  });
});
