let socket = new WebSocket("ws://localhost:8765");
var last;
var buf = {};
var received = false;
buf["tool"] = [];
buf["bed"] = [];
buf["tool_target"] = [];
buf["bed_target"] = [];

var config = {
    type: 'line',
    data: {
        datasets: [{
            label: 'Tool 0',
            borderColor: 'rgb(255, 99, 132)',
            fill: false,
            backgroundColor: 'rgb(255, 99, 132)',
            lineTension: 0
        }, {
            label: 'Bed',
            borderColor: 'rgb(54, 162, 235)',
            fill: false,
            backgroundColor: 'rgb(54, 162, 235)',
            lineTension: 0
        }, {
            label: 'Tool 0 Target',
            borderColor: '#FF9CB0',
            fill: false,
            backgroundColor: '#FFB0C1',
            lineTension: 0
        }, {
            label: 'Bed Target',
            borderColor: '#8FD1F5',
            fill: false,
            backgroundColor: '#8FD1F4',
            lineTension: 0
        }]
    },
    options: {
        scales: {
            xAxes: [{
                type: 'realtime',
                realtime: {
                    duration: 1800000,
                    refresh: 1000,
                    delay: 2000,
                    pause: false,
                    onRefresh: onRefresh
                }
            }],
            yAxes: [{
                ticks: {
                    suggestedMin: 0,
                    suggestedMax: 300
                }
            }]
        },
        tooltips: {
            mode: 'nearest',
            intersect: false
        },
        hover: {
            mode: 'nearest',
            intersect: false
        },
        elements: {
            point: {
                radius: 0
            }
        },
    }
};

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
        console.log("Connection died");
    }
};

//Reakce na chybu ve spojení websocketu
socket.onerror = function (error) {
    console.log("Error in connection");
};

//Funkce, která se vyvolá při přijetí zprávy ze serveru
socket.onmessage = function (event) {

    var obj = JSON.parse(event.data);
    received = true;
    if ("ports" in obj) {
        $("#serial").empty();
        $("#baudrate").empty();
        $("#delay_serial").empty();
        $("#delay_baudrate").empty();

        if (obj.portPreference) {
            $("#serial, #delay_serial").append('<option>' + obj.portPreference + '</option>');
        } else {
            $("#serial, #delay_serial").append('<option>AUTO</option>');
        }
        if (obj.baudratePreference) {
            $("#baudrate, #delay_baudrate").append('<option>' + obj.baudratePreference + '</option>');
        } else {
            $("#baudrate, #delay_baudrate").append('<option>AUTO</option>');
        }

        $(document).ready(function () {
            $.each(obj.ports, function (key, val) {
                $("#serial, #delay_serial").append('<option>' + val + '</option>');
            });
            $.each(obj.baudrates, function (key, val) {
                $("#baudrate, #delay_baudrate").append('<option>' + val + '</option>');
            });
        })
    }
    ;

    if ("state" in obj) {
        state = obj.state.text;
        disableButtons(state);
        $("#state").text(state);
        if (state == last) {
            $("#loading").attr("value", 0);
        }
        last = state;
        if (obj.job.file.name != null) {
            var date = new Date(obj.job.file.date * 1000).toLocaleDateString("en-US");
            $("#uploaded").text(date);
            $("#file").text(obj.job.file.name);
            $("#circa").text(getTime(obj.job.estimatedPrintTime) + "s");
            $("#print_time").text(getTime(obj.progress.printTime) + "s");
            $("#time_left").text(getTime(obj.progress.printTimeLeft) + "s");

            $("#print_progress").val(obj.progress.completion);
        }

        var tool = obj.temps.tool0.actual;
        var tool_target = obj.temps.tool0.target;
        var bed = obj.temps.bed.actual;
        var bed_target = obj.temps.bed.target;
        var rnow = new Date($.now());

        if (tool != 0 && bed != 0) {
            $("#tool").text(Math.round(tool * 10) / 10 + "°C");
            $("#bed").text(Math.round(bed * 10) / 10 + "°C");
            buf["tool"].push({
                x: rnow,
                y: tool
            });
            buf["bed"].push({
                x: rnow,
                y: bed
            });
            buf["tool_target"].push({
                x: rnow,
                y: tool_target
            });
            buf["bed_target"].push({
                x: rnow,
                y: bed_target
            });
        }

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
        $(document).ready(function () {
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
            })
        })

    }
    ;

};

$(document).ready(function () {
    $("#loading").val(0);
    $(".button:not(#connect)").addClass("is-static");
    $(".input").attr("disabled", true);

    $(".button").click(function () {
        if (received) {
            $("#loading").removeAttr("value");
        }
    });

    $("#connect").click(function () {
        if ($(this).text() == "Connect") {
            var serial_port = $("#serial").val();
            var rate = $("#baudrate").val();
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

        $("#connection > .card-content, #connection > .card-footer").toggleClass("is-hidden");

    });

    $("#hide").click(function () {
        $("#connection > .card-content, #connection > .card-footer").toggleClass("is-hidden");
    })

    $("#files").on("click", ".file_load", function () {
        var filename = $(this).val();

        var obj = {
            origin: "js",
            job: filename
        };
        socket.send(JSON.stringify(obj))
    });

    $("#files").on("click", ".file_delay", function () {
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
        var d = new Date();
        var day = $("#day").val();
        var hours = $("#hours").val();
        var minutes = $("#minutes").val();
        var newDate = new Date();
        newDate.setSeconds(0);

        if (day == 1) {
            day = d.getDate() + 1;
        } else if (day == 0) {
            day = d.getDate();
        } else {
            return;
        }
        newDate.setDate(day);

        var h = d.getHours();

        var m = d.getMinutes();

        if (hours >= 0 && hours <= 23) {
            newDate.setHours(hours)
        } else {
            return;
        }

        if (minutes >= 0 && minutes <= 59) {
            newDate.setMinutes(minutes);
        } else {
            return;
        }
        var stamp = new Date(newDate).getTime();
        var diff = stamp - d.getTime();
        var filename = $("#filename").text();
        var obj = {
            origin: "js"
        };
        var bool = $("#conn_opts").is(":checked")
        obj["delay"] = {
            file: filename,
            difference: diff,
            serial: bool ? $("#delay_serial").val() : "",
            baud: bool ? $("#delay_baudrate").val() : ""
        }

        socket.send(JSON.stringify(obj))
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

    $(".jog").click(function () {
        var obj = {
            origin: "js",
            jog: $(this).val()
        };

        socket.send(JSON.stringify(obj))
    })

    $(".home").click(function () {
        var obj = {
            origin: "js",
            home: $(this).val()
        };

        socket.send(JSON.stringify(obj))
    })

    $("#set_tool").click(function () {
        var obj = {
            origin: "js",
            tool0: $("input[name=tool_target]").val()
        };

        socket.send(JSON.stringify(obj))
    })

    $("#set_bed").click(function () {
        var obj = {
            origin: "js",
            bed: $("input[name=bed_target]").val()
        };

        socket.send(JSON.stringify(obj))
    })

    $("#file_sync").click(function () {
        var obj = {
            origin: "js",
            file_reload: true
        };
        socket.send(JSON.stringify(obj))
    });


});

window.onload = function () {
    var ctx = document.getElementById('temps').getContext('2d');
    window.myChart = new Chart(ctx, config);
};

function onRefresh(chart) {
    var i = 0;
    $.each(buf, function (key, val) {
        if (val[0]) {
            chart.config.data.datasets[i].data.push(val[0]);
            i++;
        }

    })
    buf["tool"] = [];
    buf["tool_target"] = [];
    buf["bed"] = [];
    buf["bed_target"] = [];
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
        $("#connection select").attr("disabled", true)
        config.options.scales.xAxes[0].realtime.pause = false;
        window.myChart.update({duration: 0});
    } else {
        $("#connect").text("Connect");
        config.options.scales.xAxes[0].realtime.pause = true;
        window.myChart.update({duration: 0});
        $("#connection > .card-content, #connection > .card-footer").removeClass("is-hidden");
        $(".button:not(#connect)").addClass("is-static");
        $(".input").attr("disabled", true);
    }
    if (state == "Operational") {
        $(".button:not(#print_toggle, #cancel)").removeClass("is-static");
        $(".input").attr("disabled", false);
        $("#print_toggle, #cancel").addClass("is-static");
        $("#print").addClass("is-info");
        $("#print").removeClass("is-danger");
        $("#print").html('<span class="icon"><i class="fas fa-print"></i></span>\n' + '<span>Print</span>');
    } else if (state == "Printing") {
        $("#print_toggle").removeClass("is-static");
        $("#print_toggle").html('<span class="icon"><i class="fas fa-pause"></i></span>\n' + '<span>Pause</span>');

        $("#cancel").removeClass("is-static");
        $(".input").attr("disabled", true);
        $(".button:not(#print_toggle, #cancel)").addClass("is-static");
        $("#print").addClass("is-info");
        $("#print").removeClass("is-danger");
        $("#print").html('<span class="icon"><i class="fas fa-print"></i></span>\n' + '<span>Print</span>');
    } else if (state == "Paused" || state == "Pausing") {
        $("#print").removeClass("is-static");
        $("#print").removeClass("is-info");
        $("#print").addClass("is-danger");
        $(".input").attr("disabled", true);
        $("#print").html('<span class="icon"><i class="fas fa-undo"></i></span>\n' + '<span>Restart</span>');

        $("#print_toggle").html('<span class="icon"><i class="fas fa-play"></i></span>\n' + '<span>Resume</span>');
        $("#cancel").removeClass("is-static");
        $("#print_toggle").removeClass("is-static");
    }
}