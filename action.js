$(document).ready(function () {
    //Výchozí nastavení html elementů na stránce
    $("#loading").val(0);
    $(".button:not(#connect)").addClass("is-static");
    $(".input").attr("disabled", true);

    //Po kliknutí na jakékoli tlačítko se zapne načítací pruh, který se vypne po přijetí další zprávy
    $(".button").click(function () {
        if (received) {
            $("#loading").removeAttr("value");
        }
    });

    //Připojení k tiskárně
    $("#connect").click(function () {
        //Jestli se chce připojit
        if ($(this).text() == "Connect") {
            //získání hodnot ze stránky
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
            socket.send(JSON.stringify(obj));
        //    jestli se chce odpojit
        } else if ($(this).text() == "Disconnect") {
            var obj = {
                origin: "js",
                disconnect: "disconnect"
            }
            socket.send(JSON.stringify(obj));
        }

        // Nastavení viditelnosti elementů které již nejsou potřeba
        $("#connection > .card-content, #connection > .card-footer").toggleClass("is-hidden");
    });

    //Schová element
    $("#hide").click(function () {
        $("#connection > .card-content, #connection > .card-footer").toggleClass("is-hidden");
    })

    //Zvolení souboru pro tisk a následný tisk
    $("#files").on("click", ".file_load", function () {
        // jméno souboru
        let filename = $(this).val();
        let obj = {
            origin: "js",
            job: filename
        };
        socket.send(JSON.stringify(obj))
    });

    //Po kliknutí na tlačítko opožděný start
    $("#files").on("click", ".file_delay", function () {
        //zobrazení okna a naplnění hodnotami
        $("#plan_menu").addClass("is-active");
        $("#filename").text($(this).val());

        const d = new Date();

        const h = d.getHours();
        $("#hours").val(h);

        const m = d.getMinutes();
        $("#minutes").val(m);
    });

    //zobrazení přídavného nastavení při zaškrtnutém check boxu
    $("#conn_opts").change(function () {
        if (this.checked) {
            $("#conn_dropdown").removeClass("is-hidden");
        } else {
            $("#conn_dropdown").addClass("is-hidden");
        }
    });

    //zavře okno pro nastavení opožděného tisku
    $(".modal-background, .modal-close").click(function () {
        $("#plan_menu").removeClass("is-active");
    });

    $("#submit").click(function () {
        //kontrolní proměnná aktuálního času
        const d = new Date();
        //získání hodnot ze vstupních polí
        let day = $("#day").val();
        const hours = $("#hours").val();
        const minutes = $("#minutes").val();
        //prázdná proměnná typu datum
        const newDate = new Date();
        //vynulování vteřin u požadovaného data
        newDate.setSeconds(0);

        // zjistí jestli je plánovaný tisk na aktuální den nebo den poté
        if (day == 1) {
            day = d.getDate() + 1;
        } else if (day == 0) {
            day = d.getDate();
        } else {
            return;
        }
        //nastaví den v požadovaném datu
        newDate.setDate(day);

        //kontrola a nastavení hodin a minut
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

        //plánované datum/čas tisku převedený do timestamp
        const stamp = new Date(newDate).getTime();
        //výpočet rozdílu mezi časem nyní a plánovaným časem
        const diff = stamp - d.getTime();
        //jméno souboru
        const filename = $("#filename").text();
        const obj = {
            origin: "js"
        };
        //booleovská hodnota stavu check boxu
        const bool = $("#conn_opts").is(":checked");
        //data pro odeslání
        obj["delay"] = {
            file: filename,
            difference: diff,
            serial: bool ? $("#delay_serial").val() : "",
            baud: bool ? $("#delay_baudrate").val() : ""
        }

        socket.send(JSON.stringify(obj))
        $("#plan_menu").removeClass("is-active");
    });

    //Tisk nebo restart načteného souboru
    $("#print").click(function () {
        //získání hodnoty tlačítka
        const button_text = $("#print").children("span").eq(1).text();
        //Pošle příkaz pro tisk souboru
        if (button_text == "Print") {
            var obj = {
                origin: "js",
                cmd: "print"
            };
            socket.send(JSON.stringify(obj))
        //Odešle příkaz pro zastavení tisku a opětovný start
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

    // Příkaz pro zastavení tisku
    $("#cancel").click(function () {
        const obj = {
            origin: "js",
            cmd: "cancel"
        };

        socket.send(JSON.stringify(obj))
    });

    //Příkaz pro pozastavení/pokračování probíhajícího tisku
    $("#print_toggle").click(function () {
        const obj = {
            origin: "js",
            cmd: "toggle"
        };

        socket.send(JSON.stringify(obj))
    });

    //Libovolný lineární pohyb se specifikovanými osami tiskárny
    $(".jog").click(function () {
        const obj = {
            origin: "js",
            jog: $(this).val()
        };

        socket.send(JSON.stringify(obj))
    })

    //Příkaz pro pohyb do nulové pozice specifikovaných os
    $(".home").click(function () {
        const obj = {
            origin: "js",
            home: $(this).val()
        };

        socket.send(JSON.stringify(obj))
    })

    //Nastavení teploty trysky
    $("#set_tool").click(function () {
        const obj = {
            origin: "js",
            tool0: $("input[name=tool_target]").val()
        };

        socket.send(JSON.stringify(obj))
    })

    //Nastavení teploty podložky
    $("#set_bed").click(function () {
        const obj = {
            origin: "js",
            bed: $("input[name=bed_target]").val()
        };

        socket.send(JSON.stringify(obj))
    })

    //Žádost o poslání souborů
    $("#file_sync").click(function () {
        const obj = {
            origin: "js",
            file_reload: true
        };
        socket.send(JSON.stringify(obj))
    });
});