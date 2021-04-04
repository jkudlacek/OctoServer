from websocket_server import WebsocketServer
import threading
import json


# Přijatá zpráva
def message_received(client, server, message):
    print(message)
    msg = json.loads(message)

    # Kontrola obsahu zprávy
    if "source" in msg:
        client["source"] = msg["source"]
        message_template(msg, message, "source", "js", "octoprint")

    if "origin" in msg:
        message_template(msg, message, "origin", "octoprint", "js")

        message_template(msg, message, "origin", "js", "octoprint")
    else:
        print("No specified origin")


# Funkce websocket server
def server():
    # Globální proměnná server dostupná všem funkcím
    global server
    # Nastavení adresy a portu na kterém bude server hostovat
    server = WebsocketServer(8765, host='127.0.0.1')
    # Specifikace funkce pro přijetí nové zprávy
    server.set_fn_message_received(message_received)
    server.run_forever()

# Přeposlání zprávy druhému klientovi
def message_template(msg, message, key, source, destination):
    # kontrola typu zdroje
    if msg[key] == source:
        for x in server.clients:
            # hledání správného příjemce
            if "source" in x and x["source"] == destination:
                server.send_message(x, message)


# Start nového vlákna které bude běžet v pozadí
server_thread = threading.Thread(target=server)
server_thread.start()
