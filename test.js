let socket = new WebSocket("ws://localhost:8765");

socket.onopen = function(e) {
  var msg = {
    source: "js"
  };
  socket.send(JSON.stringify(msg))
};

socket.onmessage = function(event) {
  var obj = JSON.parse(event.data);
  console.log(obj);
  if ("state" in obj){
    $("#state").text(obj.state.text);
    console.log(obj.job.file.name);
    if (obj.job.file.name != null){
      var date = new Date(obj.job.file.date*1000).toLocaleDateString("en-US");
      $("#uploaded").text(date);
      $("#file").text(obj.job.file.name);
      $("#circa").text(getTime(obj.job.estimatedPrintTime)+"s");
      $("#print_time").text(getTime(obj.progress.printTime)+"s");
      $("#time_left").text(getTime(obj.progress.printTimeLeft)+"s");

      $("#print-progress").val(obj.progress.completion);
    }
    disableButtons(obj.state.text);
  };

  if ("local" in obj){
    $("#files").empty();
    $.each(obj.local, function(key, value){
      var file_item = '<div class="field has-addons"><p class="control"><button value="' + key + '" class="button is-small file_load">\n' +
      '    <span class="icon is-small">\n' +
      '      <i class="fas fa-print"></i>\n' +
      '    </span>\n' +
      '  </button></p></div>';
      $("#files").append("<p class='name'>" + key + "</p>" + file_item + "<hr>");
    });
    console.log(obj.local);
  }

};

socket.onclose = function(event) {
  if (event.wasClean) {
    console.log("Connection close clean");
  } else {
    console.log("Connection dieded");
  }
};

socket.onerror = function(error) {
  console.log("Errorik");
};

$(document).ready(function() {
  $(".file_load").click(function(){
    var file_name = $(this).val();

    var obj = {
      origin: "js",
      job: file_name
    };

    console.log(obj);
    socket.send(JSON.stringify(obj))
  });

  $("#cancel").click(function() {
    var obj = {
      origin: "js",
      cmd: "cancel"
    };

    socket.send(JSON.stringify(obj))
  });

  $("#print_toggle").click(function(){
    var obj = {
      origin: "js",
      cmd: "toggle"
    };

    socket.send(JSON.stringify(obj))
  });
});

function getTime(seconds){
  var leftover = seconds;

  var days = Math.floor(leftover / 86400);

  leftover = leftover - (days * 86400);

  var hours = Math.floor(leftover / 3600);

  leftover = leftover - (hours * 3600);

  var minutes = Math.floor(leftover / 60);

  leftover = leftover - (minutes * 60);
  leftover = Math.floor(leftover);
  return((days >= 1 ? days + ':' : '')  + hours + ':' + minutes + ':' + leftover);
}

function disableButtons(state){
  if (state == "Operational"){
    $("#print_toggle").addClass("is-static");
    $("#cancel").addClass("is-static");
  } else if (state == "Printing") {
    $("#print_toggle").removeClass("is-static");
    $("#print_toggle").html('<span class="icon"><i class="fas fa-pause"></i></span>\n' + '<span>Pause</span>');

    $("#cancel").removeClass("is-static");
    $("#print").addClass("is-static");
    $("#print").addClass("is-info");
    $("#print").removeClass("is-danger");
    $("#print").html('<span class="icon"><i class="fas fa-print"></i></span>\n' + '<span>Print</span>');

  } else if (state == "Paused" || state =="Pausing"){
    $("#print").removeClass("is-static");
    $("#print").removeClass("is-info");
    $("#print").addClass("is-danger");
    $("#print").html('<span class="icon"><i class="fas fa-undo"></i></span>\n' + '<span>Restart</span>');

    $("#print_toggle").html('<span class="icon"><i class="fas fa-play"></i></span>\n' + '<span>Resume</span>');

  }
}