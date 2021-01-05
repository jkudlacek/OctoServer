import logging
from websocket_server import WebsocketServer
from tkinter import *
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
        # if (msg["source"]=="js"):
        #     for x in server.clients:
        #         print(x)
        #         if "source" in x and x["source"] == "octoprint":
        #             server.send_message(x, message)

    # print(client["source"])

    if "origin" in msg:
        message_template(msg, message, "origin", "octoprint", "js")
        # if msg["origin"]=="octoprint":
        #     for x in server.clients:
        #         print(x)
        #         if "source" in x and x["source"]=="js":
        #             server.send_message(x, message)

        message_template(msg, message, "origin", "js", "octoprint")
        # if msg["origin"]=="js":
        #     for x in server.clients:
        #         print(x)
        #         if "source" in x and x["source"]=="octoprint":
        #             server.send_message(x, message)
    else:
        print("neni")

###Websocket
def server():
    global server
    server = WebsocketServer(8765, host='127.0.0.1')
    #server.set_fn_new_client(new_client)
    server.set_fn_message_received(message_received)
    server.run_forever()

server_thread = threading.Thread(target=server)
server_thread.start()


def message_template(msg, message, key, source, destination):
    if msg[key] == source:
        for x in server.clients:
            print(x)
            if "source" in x and x["source"] == destination:
                server.send_message(x, message)

# def send_command(value):
#     server.send_message_to_all(value)
#     for x in server.clients:
#         if x["id"]==2:
#             server.send_message(x, "Testik")

###TKINTER
# class Butt:
#     def __init__(self, value):
#         self.value=value


# def tkp():
#     master = Tk()
#     pause=Button(master, text="Pause", command=lambda: send_command("pause"))
#     pause.pack()
#     cancel = Button(master, text="Cancel", command=lambda: send_command("cancel"))
#     cancel.pack()
#     master.mainloop()


# tk_thread = threading.Thread(target=tkp)
# tk_thread.daemon = True
# tk_thread.start()



