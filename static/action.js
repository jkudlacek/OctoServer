$(document).ready(function () {
    // Výchozí nastavení html elementů na stránce
    $("#loading").val(0);
    $(".button:not(#connect)").addClass("is-static");
    $(".input, #step").attr("disabled", true);


    // Po kliknutí na jakékoli tlačítko se zapne načítací pruh, který se vypne po přijetí další zprávy
    $(".button").click(function () {
        if (received) {
            $("#loading").removeAttr("value");
        }
    });

    //Připojení k tiskárně
    $("#connect").click(function () {
        //Jestli se chce připojit
        if ($(this).text() == "Connect") {
            // získání hodnot ze stránky
            const serial_port = $("#serial").val();
            const rate = $("#baudrate").val();
            // seznam hodnot které se posílají
            var obj = {
                origin: "js",
                connect: {
                    port: serial_port,
                    baudrate: rate
                }

            };
            // Nastavení viditelnosti elementů které již nejsou potřeba
            $("#connection > .card-content, #connection > .card-footer").toggleClass("is-hidden");

            // Odeslání zprávy
            socket.send(JSON.stringify(obj));
        //    jestli se chce odpojit
        } else if ($(this).text() == "Disconnect") {
            var obj = {
                origin: "js",
                disconnect: "disconnect"
            }
            socket.send(JSON.stringify(obj));
        }
    });

    // Schová/ukáže element
    $("#hide").click(function () {
        $("#connection > .card-content, #connection > .card-footer").toggleClass("is-hidden");
    })

    // Zvolení souboru pro tisk a následný tisk
    $("#files").on("click", ".file_load", function () {
        // jméno souboru
        let filename = $(this).val();
        let obj = {
            origin: "js",
            job: filename
        };
        socket.send(JSON.stringify(obj))
    });

    // Po kliknutí na tlačítko opožděný start
    $("#files").on("click", ".file_delay", function () {
        // Zobrazení okna a naplnění hodnotami
        $("#plan_menu").addClass("is-active");
        $("#filename").text($(this).val());

        // Získání aktuálního času a doplnění do vstupních polí
        const d = new Date();

        const h = d.getHours();
        $("#hours").val(h);

        const m = d.getMinutes();
        $("#minutes").val(m);
    });

    // Zobrazení přídavného nastavení při zaškrtnutém check boxu
    $("#conn_opts").change(function () {
        if (this.checked) {
            $("#conn_dropdown").removeClass("is-hidden");
        } else {
            $("#conn_dropdown").addClass("is-hidden");
        }
    });

    // Zavře aktivni dialogové okno
    $(".modal-background, .modal-close, .modal .button").click(function () {
        $(".modal").removeClass("is-active");
    });

    $("#submit").click(function () {
        // Kontrolní proměnná aktuálního času
        const d = new Date();
        // Získání hodnot ze vstupních polí
        let day = $("#day").val();
        const hours = $("#hours").val();
        const minutes = $("#minutes").val();
        // Prázdná proměnná typu datum
        const newDate = new Date();
        // Vynulování vteřin u požadovaného data
        newDate.setSeconds(0);

        // Zjistí jestli je plánovaný tisk na aktuální den nebo den poté
        if (day == 1) {
            day = d.getDate() + 1;
        } else if (day == 0) {
            day = d.getDate();
        } else {
            return;
        }
        // Nastaví den v požadovaném datu
        newDate.setDate(day);

        // Kontrola a nastavení hodin a minut
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

        // Plánované datum/čas tisku převedený do timestamp
        const stamp = new Date(newDate).getTime();
        // Výpočet rozdílu mezi časem nyní a plánovaným časem
        const diff = stamp - d.getTime();
        // Jméno souboru
        const filename = $("#filename").text();
        const obj = {
            origin: "js"
        };
        // Booleovská hodnota stavu check boxu
        const bool = $("#conn_opts").is(":checked");
        // Data pro odeslání
        obj["delay"] = {
            file: filename,
            difference: diff,
            // Specifikace pro připojení k tiskárně
            serial: bool ? $("#delay_serial").val() : "",
            baud: bool ? $("#delay_baudrate").val() : ""
        }

        socket.send(JSON.stringify(obj))
        $("#plan_menu").removeClass("is-active");
    });

    // Tisk nebo restart načteného souboru
    $("#print").click(function () {
        // získání hodnoty tlačítka
        const button_text = $("#print").children("span").eq(1).text();
        // Pošle příkaz pro tisk souboru
        if (button_text == "Print") {
            var obj = {
                origin: "js",
                cmd: "print"
            };
            socket.send(JSON.stringify(obj))
        // Odešle příkaz pro zastavení tisku a opětovný start
        } else if (button_text == "Restart") {
            var obj = {
                origin: "js",
                cmd: "cancel"
            };
            // Vyšlou se dvě zprávy, první tisk zruší, druhá ho znovu začne
            socket.send(JSON.stringify(obj))
            obj.cmd = "print";
            socket.send(JSON.stringify(obj))
        }
    });

    // Zobrazí okno pro potvrzení zrušení tisku
    $("#cancel").click(function () {
        $("#cancel_menu").addClass("is-active");
    });


    // Příkaz pro zastavení tisku
    $("#cancel_submit").click(function () {
        // Specifikace příkazu - cancel
        const obj = {
            origin: "js",
            cmd: "cancel"
        };

        socket.send(JSON.stringify(obj))
        $("#cancel_menu").removeClass("is-active");
    });

    // Příkaz pro pozastavení/pokračování probíhajícího tisku
    $("#print_toggle").click(function () {
        const obj = {
            origin: "js",
            cmd: "toggle"
        };

        socket.send(JSON.stringify(obj))
    });

    // Libovolný lineární pohyb se specifikovanými osami tiskárny
    $(".jog").click(function () {
        const step = $("#step").val();
        const obj = {
            origin: "js"
        };
        // Pole obsahující písmeno osy, znaménko a vzdálenost
        obj["jog"] = {
            axis: $(this).val(),
            step: step
        }

        socket.send(JSON.stringify(obj));
        console.log(obj);
    })

    // Příkaz pro pohyb do nulové pozice specifikovaných os
    $(".home").click(function () {
        const obj = {
            origin: "js",
            home: $(this).val()
        };

        socket.send(JSON.stringify(obj))
    })

    // Nastavení teploty trysky
    $("#set_tool").click(function () {
        const obj = {
            origin: "js",
            tool0: $("input[name=tool_target]").val()
        };

        socket.send(JSON.stringify(obj))
    })

    // Nastavení teploty podložky
    $("#set_bed").click(function () {
        const obj = {
            origin: "js",
            bed: $("input[name=bed_target]").val()
        };

        socket.send(JSON.stringify(obj))
    })

    // Žádost o poslání souborů
    $("#file_sync").click(function () {
        const obj = {
            origin: "js",
            file_reload: true
        };

        socket.send(JSON.stringify(obj))
    });
});