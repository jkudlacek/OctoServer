let socket = new WebSocket("ws://localhost:8765");
var buf = {};
var last;
buf["tool"]=[];
buf["tool_target"]=[];
buf["bed"]=[];
buf["bed_target"]=[];

//Pošle zprávu při navázaní spojení
socket.onopen = function (e) {
    var msg = {
        source: "js"
    };
    socket.send(JSON.stringify(msg))
};

//Reakce na uzavření spojení
socket.onclose = function (event) {
    if (event.wasClean) {
        console.log("Connection close clean");
    } else {
        console.log("Connection dieded");
    }
};

//Reakce na chybu ve spojení websocketu
socket.onerror = function (error) {
    console.log("Errorik");
};

//Funkce, která se vyvolá při přijetí zprávy ze serveru
socket.onmessage = function (event) {
    var obj = JSON.parse(event.data);

    // console.log(obj);
    if ("ports" in obj) {
        console.log(obj.ports);
        console.log(obj.baudrates);
        console.log(obj.portPreference);
        console.log(obj.baudratePreference);

        $("#serial").empty();
        $("#baudrate").empty();
        $("#delay_serial").empty();
        $("#delay_baudrate").empty();

        if (obj.portPreference) {
            $("#serial").append('<option>' + obj.portPreference + '</option>');
            $("#delay_serial").append('<option>' + obj.portPreference + '</option>');
        } else {
            $("#serial").append('<option>AUTO</option>');
            $("#delay_serial").append('<option>AUTO</option>');
        }
        if (obj.baudratePreference) {
            $("#baudrate").append('<option>' + obj.baudratePreference + '</option>');
            $("#delay_baudrate").append('<option>' + obj.baudratePreference + '</option>');
        } else {
            $("#baudrate").append('<option>AUTO</option>');
            $("#delay_baudrate").append('<option>AUTO</option>');
        }

        $.each(obj.ports, function (key, val) {
            $("#serial").append('<option>' + val + '</option>');
            $("#delay_serial").append('<option>' + val + '</option>');
        });
        $.each(obj.baudrates, function (key, val) {
            $("#baudrate").append('<option>' + val + '</option>');
            $("#delay_baudrate").append('<option>' + val + '</option>');
        });

    }
    ;

    if ("state" in obj) {
        $("#state").text(obj.state.text);
        if (obj.state.text == last) {
            $("#loading").attr("value", 0);
        }
        // console.log(obj.job.file.name);
        if (obj.job.file.name != null) {
            var date = new Date(obj.job.file.date * 1000).toLocaleDateString("en-US");
            $("#uploaded").text(date);
            $("#file").text(obj.job.file.name);
            $("#circa").text(getTime(obj.job.estimatedPrintTime) + "s");
            $("#print_time").text(getTime(obj.progress.printTime) + "s");
            $("#time_left").text(getTime(obj.progress.printTimeLeft) + "s");

            $("#print-progress").val(obj.progress.completion);
        }
        var tool = obj.temps.tool0.actual;
        var tool_target = obj.temps.tool0.target;
        var bed = obj.temps.bed.actual;
        var bed_target = obj.temps.bed.target
        var rnow = new Date($.now());

        if (tool != 0 && bed != 0) {
            $("#tool").text(Math.round(obj.temps.tool0.actual * 10) / 10 + "°C");
            $("#bed").text(Math.round(obj.temps.bed.actual * 10) / 10 + "°C");
            buf["tool"].push({
                x: rnow,
                y: tool
            });
            buf["tool_target"].push({
                x: rnow,
                y: tool_target
            });
            buf["bed"].push({
                x: rnow,
                y: bed
            });
            buf["bed_target"].push({
                x: rnow,
                y: bed_target
            });

            console.log(buf["tool"]);


            $("input[name=tool_target]").val(tool_target);
            $("input[name=bed_target]").val(bed_target);
        }
        disableButtons(obj.state.text);
    }
    ;

    if ("local" in obj) {
        $("#files").empty();

        var file_list = [];
        $.each(obj.local, function (key, value) {
            if (value.type == "folder") {
                $.each(value.children, function (k, v) {
                    if (v.type == "machinecode") {
                        file_list.push(v.path);
                    }
                })
            } else if (value.type == "machinecode") {
                file_list.push(value.path);
            }
        });

        $.each(file_list, function (key, value) {
            var file_item = '<div class="field has-addons">' +
                ' <p class="control"><button value="' + value + '" class="button is-small file_load">\n' +
                ' <span class="icon is-small">\n' +
                ' <i class="fas fa-print"></i>\n' +
                ' </span>\n' +
                ' </button><button value="' + value + '" class="button is-small file_delay">\n' +
                ' <span class="icon is-small">\n' +
                ' <i class="fas fa-hourglass-start"></i>\n' +
                ' </span>\n' +
                ' </button>' +
                '</p></div>';
            $("#files").append("<p class='name'>" + value + "</p>" + file_item + (key === (file_list.length - 1) ? '' : "<hr>"));
            console.log(file_list.length);
        })
    }
    ;

};

$(document).ready(function () {
    $("#print-progress").val(0);
    // $("#loading").removeAttr("value");
    // $(".file_load").addClass("is-static");
    // $(".file_delay").addClass("is-static");
    // $("#print_toggle").addClass("is-static");
    // $("#cancel").addClass("is-static");
    // $("#print").addClass("is-static");
    $(".button:not(#connect)").addClass("is-static");
    $(".input").attr("disabled", true);

    $(".button").click(function () {
        $("#loading").removeAttr("value");
    });

    $("#connect").click(function () {
        if ($(this).text() == "Connect") {
            var serial_port = $("#serial").children("option:selected").val();
            var rate = $("#baudrate").children("option:selected").val();
            var obj = {
                origin: "js",
                connect: {
                    port: serial_port,
                    baudrate: rate
                }
            };
            socket.send(JSON.stringify(obj));
        } else {
            var obj = {
                origin: "js",
                disconnect: "disconnect"
            }
            socket.send(JSON.stringify(obj));
        }

    });

    $("#hide").click(function () {
        $("#connection > .card-content, #connection > .card-footer").toggleClass("is-hidden");
    })

    $(".file_load").click(function () {
        var filename = $(this).val();

        var obj = {
            origin: "js",
            job: filename
        };

        console.log(obj);
        socket.send(JSON.stringify(obj))
    });

    $(".file_delay").click(function () {
        $("#plan_menu").addClass("is-active");
        $("#filename").text($(this).val());

        var d = new Date();

        var h = d.getHours();
        var hours = $("#hours").val(h);

        var m = d.getMinutes();
        var hours = $("#minutes").val(m);
    });

    $("#conn_opts").change(function () {
        if (this.checked) {
            $("#conn_dropdown").removeClass("is-hidden");
        } else {
            $("#conn_dropdown").addClass("is-hidden");
        }
    });

    $(".modal-background, .modal-close").click(function () {
        $("#plan_menu").removeClass("is-active");
    });

    $("#submit").click(function () {
        var day = $("#day").val();
        var hours = $("#hours").val();
        var minutes = $("#minutes").val();

        if (day == 1) {
            hours = hours + 24;
        }

        var d = new Date();

        var h = d.getHours();

        var m = d.getMinutes();

        if (hours >= 0 && hours <= 23) {
            if (hours >= h) {
                hours = hours - h;
            }
        } else {
            hours = 0;
        }

        if (minutes >= 0 && minutes <= 59) {
            if (minutes >= m) {
                minutes = minutes - m;
            }
        } else {
            minutes = 0;
        }

        var time = hours + minutes;
        var filename = $("#filename").val();
    });


    $("#print").click(function () {
        var button_text = $("#print").children('span').eq(1).text();
        if (button_text == "Print") {
            var obj = {
                origin: "js",
                cmd: "print"
            };

            socket.send(JSON.stringify(obj))
        } else if (button_text == "Restart") {
            var obj = {
                origin: "js",
                cmd: "cancel"
            };
            socket.send(JSON.stringify(obj))

            obj.cmd = "print";
            socket.send(JSON.stringify(obj))
        }

    });

    $("#cancel").click(function () {
        var obj = {
            origin: "js",
            cmd: "cancel"
        };

        socket.send(JSON.stringify(obj))
    });

    $("#print_toggle").click(function () {
        var obj = {
            origin: "js",
            cmd: "toggle"
        };

        socket.send(JSON.stringify(obj))
    });

    $("#file_load").click(function () {
        var obj = {
        file_reload: true
    };
    socket.send(JSON.stringify(obj))
    });
});

function onRefresh(chart) {
    chart.config.data.datasets[0].data.push(buf["tool"][0]);
    chart.config.data.datasets[2].data.push(buf["tool_target"][0]);
    chart.config.data.datasets[1].data.push(buf["bed"][0]);
    chart.config.data.datasets[3].data.push(buf["bed_target"][0]);
    buf["tool"] = [];
    buf["tool_target"] = [];
    buf["bed"] = [];
    buf["bed_target"] = [];
}

function onReceive(chart, event) {
	chart.config.data.datasets[event.index].data.push({
		x: event.timestamp,
		y: event.value
	});
	window.myChart.update({
		preservation: true
	});
}

function startFeed(index) {
	var receive = function() {
		onReceive({
			index: index,
			timestamp: Date.now(),
			value: randomScalingFactor()
		});
		timeoutIDs[index] = setTimeout(receive, Math.random() * 1000 + 500);
	}
	timeoutIDs[index] = setTimeout(receive, Math.random() * 1000 + 500);
}


function getTime(seconds) {
    var leftover = seconds;

    var days = Math.floor(leftover / 86400);

    leftover = leftover - (days * 86400);

    var hours = Math.floor(leftover / 3600);

    leftover = leftover - (hours * 3600);

    var minutes = Math.floor(leftover / 60);

    leftover = leftover - (minutes * 60);
    leftover = Math.floor(leftover);
    return ((days >= 1 ? days + ':' : '') + hours + ':' + minutes + ':' + leftover);
}

function disableButtons(state) {
    if (state != "Offline") {
        $("#connect").text("Disconnect");
        $("#connect").removeClass("is-static");
        $("select").attr("disabled", true)
    }
    switch (state) {
        case "Offline":
            $("#connect").text("Connect");
            break;

        case "Operational":
            $(".button:not(#print_toggle, #cancel)").removeClass("is-static");
            $("#print_toggle, #cancel").addClass("is-static");
            $("#print").addClass("is-info");
            $("#print").removeClass("is-danger");
            $("#print").html('<span class="icon"><i class="fas fa-print"></i></span>\n' + '<span>Print</span>');
            break;

        case "Printing":
            $("#print_toggle").removeClass("is-static");
            $("#print_toggle").html('<span class="icon"><i class="fas fa-pause"></i></span>\n' + '<span>Pause</span>');

            $("#cancel").removeClass("is-static");
            $(".button:not(#print_toggle, #cancel)").addClass("is-static");
            $("#print").addClass("is-info");
            $("#print").removeClass("is-danger");
            $("#print").html('<span class="icon"><i class="fas fa-print"></i></span>\n' + '<span>Print</span>');
            break;

        case state == "Paused" || state == "Pausing":
            $("#print").removeClass("is-static");
            $("#print").removeClass("is-info");
            $("#print").addClass("is-danger");
            $("#print").html('<span class="icon"><i class="fas fa-undo"></i></span>\n' + '<span>Restart</span>');

            $("#print_toggle").html('<span class="icon"><i class="fas fa-play"></i></span>\n' + '<span>Resume</span>');
            $("#cancel").removeClass("is-static");
            $("#print_toggle").removeClass("is-static");
            break;

    }
    // if (state != "Offline") {
    //
    // } else {
    //
    // }
    // if (state ==) {
    //
    // } else if (state ==) {
    //
    //
    // } else if (state == "Paused" || state == "Pausing") {
    //
    // } else {
    //
    // }
}