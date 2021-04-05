// Spojení se serverem
let socket = new WebSocket("ws://localhost:8765");

//Inicializace kontrolních proměnných
let last;
let buf = {};
let received = false;
buf["tool"] = [];
buf["bed"] = [];
buf["tool_target"] = [];
buf["bed_target"] = [];
// Html šablona
var old_html = $("body").html();

// Konfigurační konstanta obsahující vlastnosti grafu
const config = {
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
socket.onopen = function () {
    const msg = {
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
socket.onerror = function () {
    console.log("Error in connection");
};

//Funkce, která se vyvolá při přijetí zprávy ze serveru
socket.onmessage = function (event) {
    //Načtení zprávy do objektu
    let obj = JSON.parse(event.data);
    //Důkaz o přijetí zprávy
    received = true;

    //Reakce na přijatou zprávu obsahující informace k připojení
    if ("ports" in obj) {
        //Vyprázdnění hodnot
        $("#serial").empty();
        $("#baudrate").empty();
        $("#delay_serial").empty();
        $("#delay_baudrate").empty();

        //Jestli je nastavená preference portu, zvolí se jako první možnost, pokud ne, první možnost bude automatické zjištění
        if (obj.portPreference) {
            $("#serial, #delay_serial").append("<option>" + obj.portPreference + "</option>");
        } else {
            $("#serial, #delay_serial").append("<option>AUTO</option>");
        }
        //Totožné s výše uvedeným, preference rychlosti přenosu dat
        if (obj.baudratePreference) {
            $("#baudrate, #delay_baudrate").append("<option>" + obj.baudratePreference + "</option>");
        } else {
            $("#baudrate, #delay_baudrate").append("<option>AUTO</option>");
        }

        //Naplnění elementu select hodnotami dostupných portů a rychlostí
        $(document).ready(function () {
            $.each(obj.ports, function (key, val) {
                $("#serial, #delay_serial").append("<option>" + val + "</option>");
            });
            $.each(obj.baudrates, function (key, val) {
                $("#baudrate, #delay_baudrate").append("<option>" + val + "</option>");
            });
        })
    }

    //Funkce vyvolaná pokud zpráva obsahuje aktualizaci stavu
    if ("state" in obj) {
        state = obj.state.text;
        disableButtons(state);
        $("#state").text(state);
        //Vizuální informace o správně odeslané zprávě pomocí načítacího pruhu
        if (state == last) {
            $("#loading").attr("value", 0);
        }
        last = state;
        //Jestli je nějaký soubor načtený
        if (obj.job.file.name != null) {
            //Implementace informací o tisku na stránku
            let date = new Date(obj.job.file.date * 1000).toLocaleDateString("en-US");
            $("#uploaded").text(date);
            $("#file").text(obj.job.file.name);
            $("#circa").text(getTime(obj.job.estimatedPrintTime) + "s");
            $("#print_time").text(getTime(obj.progress.printTime) + "s");
            $("#time_left").text(getTime(obj.progress.printTimeLeft) + "s");

            $("#print_progress").val(obj.progress.completion);
        }

        //Získání hodnot teplot z objektu
        let tool = obj.temps.tool0.actual;
        let tool_target = obj.temps.tool0.target;
        let bed = obj.temps.bed.actual;
        let bed_target = obj.temps.bed.target;
        let rnow = new Date($.now());

        if (tool != 0 && bed != 0) {
            //Zobrazení teplot v uživatelském rozhraní
            $("#tool").text(Math.round(tool * 10) / 10 + "°C");
            $("#bed").text(Math.round(bed * 10) / 10 + "°C");

            //Vložení hodnot do bufferu
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

        //Vložení požadovaných hodnot do vstupního pole
        //Zkontrolouje jestli je pole aktivní, pro zamezení přepisování hodnoty
        if (!$("input[name=tool_target]").is(":focus")) {
            $("input[name=tool_target]").val(tool_target);
        }
        if (!$("input[name=bed_target]").is(":focus")) {
            $("input[name=bed_target]").val(bed_target);
        }
    }

    //Zpráva obsahuje seznam souborů
    if ("local" in obj) {
        //vymaže předchozí seznam souborů
        $("#files").empty();
        //pole pro uložení jmen souborů
        let file_list = [];
        $.each(obj.local, function (key, value) {
            //Kontrola typu položky
            if (value.type == "folder") {
                //Pokud je položka složka, zkontroluje se její obsah
                $.each(value.children, function (k, v) {
                    if (v.type == "machinecode") {
                        file_list.push(v.path);
                    }
                })
                //    Pokud je položka soubor pro tiskárnu (.gcode) přidá se do pole
            } else if (value.type == "machinecode") {
                file_list.push(value.path);
            }
        });

        //Doplní šablonu proměnnými a vloží ji do rozhraní
        $(document).ready(function () {
            $.each(file_list, function (key, value) {
                let file_item = '<div class="field is-grouped mt-2">' +
                    ' <p class="control"><button value="' + value + '" class="button is-small file_load">\n' +
                    ' <span class="icon is-small">\n' +
                    ' <i class="fas fa-print"></i>\n' +
                    ' </span>\n' +
                    ' </button></p><p class="control"><button value="' + value + '" class="button is-small file_delay">\n' +
                    ' <span class="icon is-small">\n' +
                    ' <i class="fas fa-hourglass-start"></i>\n' +
                    ' </span>\n' +
                    ' </button>' +
                    '</p></div>';
                $("#files").append('<p class="name">' + value + "</p>" + file_item + (key === (file_list.length - 1) ? "" : "<hr>"));
            })
        })

    }

    if ("left" in obj) {
        console.log("left")
        if (obj.left) {
            $("body").html(old_html);
        }
    }
};

//Zobrazení grafu po načtení celé stránky
window.onload = function () {
    //Specifikace elementu pro graf
    const ctx = document.getElementById("temps").getContext("2d");
    window.myChart = new Chart(ctx, config);
};

//Aktualizace grafu
function onRefresh(chart) {
    let i = 0;
    // Každá hodnota v bufferu se načte do grafu
    $.each(buf, function (key, val) {
        if (val[0]) {
            // Předávání hodnot do grafu
            chart.config.data.datasets[i].data.push(val[0]);
            i++;
        }
    })

    //Vyprázdnění bufferu
    buf["tool"] = [];
    buf["tool_target"] = [];
    buf["bed"] = [];
    buf["bed_target"] = [];
}

// Převod času na lépe čitelný formát
function getTime(seconds) {
    let leftover = seconds;

    const days = Math.floor(leftover / 86400);
    leftover = leftover - (days * 86400);

    const hours = Math.floor(leftover / 3600);
    leftover = leftover - (hours * 3600);

    const minutes = Math.floor(leftover / 60);
    leftover = leftover - (minutes * 60);

    leftover = Math.floor(leftover);
    // Ze vteřin se vypočíta počet dnů, hodin a minut, výsledek slouží jako vrácená hodnota
    return ((days >= 1 ? days + ":" : "") + hours + ":" + minutes + ":" + leftover);
}

// Změna obsahu html elementů dle daného stavu tiskárny
function disableButtons(state) {
    if (state != "Offline") {
        $("#connect").text("Disconnect");
        $("#connect").removeClass("is-static");
        $("#connection select").attr("disabled", true)
        config.options.scales.xAxes[0].realtime.pause = false;
        window.myChart.update({duration: 0});
    } else {
        $("#connect").text("Connect");
        $("#connect").removeClass("is-static");
        $("#connection select").attr("disabled", false)
        config.options.scales.xAxes[0].realtime.pause = true;
        window.myChart.update({duration: 0});
        $("#connection > .card-content, #connection > .card-footer").removeClass("is-hidden");
        $(".button:not(#connect)").addClass("is-static");
        $(".input, #step").attr("disabled", true);
    }
    if (state == "Operational") {
        $(".button:not(#print_toggle, #cancel, #cancel_menu .button)").removeClass("is-static");
        $(".input, #step").attr("disabled", false);
        $("#print_toggle, #cancel, #cancel_menu .button").addClass("is-static");
        $("#print").addClass("is-info");
        $("#print").removeClass("is-danger");
        $("#print").html('<span class="icon"><i class="fas fa-print"></i></span>\n' + '<span>Print</span>');
    } else if (state == "Printing") {
        $("#print_toggle").removeClass("is-static");
        $("#print_toggle").html('<span class="icon"><i class="fas fa-pause"></i></span>\n' + '<span>Pause</span>');

        $("#cancel, #cancel_menu .button").removeClass("is-static");
        $(".input, #step").attr("disabled", true);
        $(".button:not(#print_toggle, #cancel, #cancel_menu .button)").addClass("is-static");
        $("#print").addClass("is-info");
        $("#print").removeClass("is-danger");
        $("#print").html('<span class="icon"><i class="fas fa-print"></i></span>\n' + '<span>Print</span>');
    } else if (state == "Paused" || state == "Pausing") {
        $("#print").removeClass("is-static");
        $("#print").removeClass("is-info");
        $("#print").addClass("is-danger");
        $(".input, #step").attr("disabled", true);
        $("#print").html('<span class="icon"><i class="fas fa-undo"></i></span>\n' + '<span>Restart</span>');

        $("#print_toggle").html('<span class="icon"><i class="fas fa-play"></i></span>\n' + '<span>Resume</span>');
        $("#cancel, #cancel_menu .button").removeClass("is-static");
        $("#print_toggle").removeClass("is-static");
    }
}