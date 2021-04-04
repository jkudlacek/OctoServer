import logging
from websocket_server import WebsocketServer
import threading
import json


#### Websocket methods
#def new_client(client, server):

def message_received(client, server, message):
    print(message)
    try:
        msg = json.loads(message)
    except:
        print("Error")

    if "source" in msg:
        client["source"] = msg["source"]
        message_template(msg, message, "source", "js", "octoprint")

    if "origin" in msg:
        message_template(msg, message, "origin", "octoprint", "js")

        message_template(msg, message, "origin", "js", "octoprint")
    else:
        print("neni")

###Websocket
def server():
    global server
    server = WebsocketServer(8765, host='127.0.0.1')
    server.set_fn_message_received(message_received)
    server.run_forever()

server_thread = threading.Thread(target=server)
server_thread.start()


def message_template(msg, message, key, source, destination):
    if msg[key] == source:
        for x in server.clients:
            # print(x)
            if "source" in x and x["source"] == destination:
                server.send_message(x, message)