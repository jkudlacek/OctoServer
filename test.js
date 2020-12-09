let socket = new WebSocket("ws://localhost:8765");

socket.onopen = function(e) {
  //alert("[open] Connection established");
  //alert("Sending to server");
  // socket.send("My name is John");

  var msg = {
    source: "js"
  };
  socket.send(JSON.stringify(msg))
};

socket.onmessage = function(event) {
  // console.log(`[message] Data received from server: ${event.data}`);
  // console.log(typeof event.data)
  var obj = JSON.parse(event.data);
  console.log(obj);
  // console.log(obj)
  // for (var key in obj) {
  //   if (obj.hasOwnProperty(key)) {
  //       console.log(key + " -> " + obj[key]);
  //   }
  // }
  // console.log(obj.state.text);
  if ("state" in obj){
    $("#state").text(obj.state.text);
    $("#print-progress").val(obj.progress.completion);
  };
  if ("local" in obj){
    $.each(obj.local, function(key, value){
      $("#files").append("<p>" + key + "</p><hr>");
    });
    console.log(obj.local);
  }

};

socket.onclose = function(event) {
  if (event.wasClean) {
    //alert(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
  } else {
    // e.g. server process killed or network down
    // event.code is usually 1006 in this case
    //alert('[close] Connection died');
  }
};

socket.onerror = function(error) {
  //alert(`[error] ${error.message}`);
};