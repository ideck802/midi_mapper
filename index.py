from fastapi import FastAPI, WebSocket, Request
from fastapi.staticfiles import StaticFiles
from fastapi import APIRouter
import uvicorn
import webview
import pygame.midi
import time
import asyncio
import threading
import json
import traceback
import win32gui
import win32con
import pywinauto
import re
from vk_keys import KEY_TO_VK, normalize_key
from pythonosc.osc_message_builder import OscMessageBuilder
from pythonosc.osc_packet import OscPacket
import socket
import math

pygame.midi.init()

poll = False
main_poll = None

devices = {
    "ins": {},
    "outs": {}
}

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.settimeout(2)

settings = {}

# comm starters
# ----
router = APIRouter()
app = FastAPI()
# exposed funcs
FUNCTIONS = {}
ws_clients = set()

def expose(func):
    FUNCTIONS[func.__name__] = func
    return func
# ----

def is_number(s):
    try:
        num = float(s)
        return math.isfinite(num)
    except ValueError:
        return False

@expose
def load_settings():
    global settings
    ini_file = open('./saved_data/settings.ini', 'r')
    contents = ini_file.read()
    ini_file.close()
    settings = json.loads(contents)
    return settings

@expose
def save_settings(data):
    with open('./saved_data/settings.ini', 'w') as ini_file:
        ini_file.write(json.dumps(data))
        ini_file.close()
    load_settings()

@expose
def get_devices():
    global devices

    for i in range(pygame.midi.get_count()):
        interface, name, is_input, is_output, is_open = pygame.midi.get_device_info(i)

        print(pygame.midi.get_device_info(i))

        name = name.decode()

        if (bool(is_input) and not name in devices["ins"]):
            devices["ins"][name] = {
                "id": i,
                "stream": pygame.midi.Input(i)
            }
        
        if (bool(is_output) and not name in devices["outs"]):
            devices["outs"][name] = {
                "id": i,
                "stream": pygame.midi.Output(i)
            }

    return devices

# flush a single midi input
@expose
def flush_midi_input(midi_input):
    while midi_input.poll():
        midi_input.read(1024)

# flush all the stored midi inputs
@expose
def flush_all_inputs():
    for midi_input in devices["ins"].values():
        flush_midi_input(midi_input["stream"])

# start main midi input listening thread
@expose
def main_listen_input():
    get_devices()
    if (poll == False):
        print('starting main listener')
        main_poll = threading.Thread(target=poll_midi_in, args=(True,))
        main_poll.start()

# polling for midi input func
@expose
def poll_midi_in(blocking = False):
    global poll
    button = None

    pressed_notes = set()

    cycles_cnt = {}

    poll = True
    while poll:
        for name, device in devices["ins"].items():

            if device["stream"].poll():
                events = device["stream"].read(10)

                for event in events:
                    data = event[0]

                    device = name
                    status = data[0]
                    note = data[1]
                    velocity = data[2]

                    # Normalize Note Off (some devices use velocity 0)
                    is_note_on = (status & 0xF0) == 0x90 and velocity > 0
                    is_note_off = (status & 0xF0) == 0x80 or ((status & 0xF0) == 0x90 and velocity == 0)
                    is_cc = (status & 0xF0) == 0xB0

                    if is_note_on:
                        if note not in pressed_notes:
                            pressed_notes.add(note)
                            print("Device: ", name, "NOTE:", note, "VELOCITY:", velocity)
                            note_data = {"type": "button", "device": name, "note": note, "velo": velocity}
                            if (not blocking):
                                poll = False
                            
                    elif is_note_off:
                        pressed_notes.discard(note)

                    if is_cc:
                        print("KNOB:", note, velocity)
                        note_data = {"type": "knob", "device": name, "note": note, "velo": velocity}
                        if (not blocking):
                                poll = False

                    if (blocking and (is_note_on or is_cc)):
                        for macro in settings['macros']:
                            macro_input = settings['macros'][macro]['input']
                            macro_outputs = settings['macros'][macro]['outputs']
                            if (macro_input['device'] == device and macro_input['note'] == str(note)):

                                if (settings['macros'][macro]['out_type'] == 'all'):
                                    for output in macro_outputs:
                                        trigger_output(output)
                                elif (settings['macros'][macro]['out_type'] == 'cycle'):
                                    if (not macro in cycles_cnt):
                                        cycles_cnt[macro] = 0
                                    trigger_output(macro_outputs[cycles_cnt[macro]])
                                    if (cycles_cnt[macro] == len(macro_outputs) - 1):
                                        cycles_cnt[macro] = 0
                                    else:
                                        cycles_cnt[macro] += 1

        time.sleep(0.01)

    if (not blocking):
        return note_data

def trigger_output(output):
    trigger = False

    if (output['cond'] == 'button'):
        trigger = True
    elif (output['cond'] == 'equals'):
        if (velocity == int(macro_input['velo'])):
            trigger = True
    elif (output['cond'] == 'less'):
        if (velocity < int(macro_input['velo'])):
            trigger = True
    elif (output['cond'] == 'greater'):
        if (velocity > int(macro_input['velo'])):
            trigger = True
    
    if (trigger == True):
        if (output['type'] == 'midiLt'):
            devices['outs'][output['device']]['stream'].note_on(
                int(output['note']), int(output['color'])
            )
        elif (output['type'] == 'key_to_wndw'):
            send_to_window('keystroke', output['keystroke'], output['wndw_match'])
        elif (output['type'] == 'str_to_wndw'):
            send_to_window('string', output['string'], output['wndw_match'])
        elif (output['type'] == 'osc_str'):
            command = output['msg'].split()
            if (len(command) == 2):
                if (is_number(command[1])):
                    command[1] = float(command[1])
            msg = OscMessageBuilder(address=command[0])
            msg.add_arg(command[1])
            msg = msg.build()
            sock.sendto(msg.dgram, (output['ip'], int(output['port'])))

@expose
def cancel_poll(main: bool=False):
    global poll
    print("cancel")
    poll = False
    if (main):
        main_poll.join()
    return "cancelled"

@expose
def list_windows():
    windows = []

    def callback(hwnd, _):
        if win32gui.IsWindowVisible(hwnd):
            title = win32gui.GetWindowText(hwnd)
            if (not title == ''):
                windows.append({"handle": hwnd, "title": title})
                print(win32gui.GetClassName(hwnd))

    win32gui.EnumWindows(callback, None)
    print(windows)
    return windows

@expose
def send_to_window(data_type, keys, wndw_match):
    windows = list_windows()

    handle = None

    for wndw in windows:
        if (wndw_match.startswith('r"')):
            wndw_match_cln = wndw_match[1:].strip('"')
            if (re.search(re.escape(wndw_match_cln), wndw['title']) is not None):
                handle = wndw['handle']
                break
        else:
            if (wndw_match == wndw['title']):
                handle = wndw['handle']
                break

    if (not handle == None):
        if (data_type == 'keystroke'):
            key = KEY_TO_VK.get(normalize_key(keys))
            win32gui.PostMessage(handle, win32con.WM_KEYDOWN, key, 0)
            win32gui.PostMessage(handle, win32con.WM_KEYUP, key, 0)
        elif (data_type == 'string'):
            app = pywinauto.Application().connect(handle=handle).window(handle=handle)
            app.type_keys(keys, with_spaces=True)
            # add checkbox that lets choose between uia and win32 backends (Application(backend="uia"))
        elif (data_type == 'knob'):
            print('todo')
    else:
        print("Couldn't find matching window")

# communication funcs
# ------
# rest api receive and return function
@app.post("/api/{func}")
async def rest_call(func: str, request: Request):
    kwargs = await request.json()
    result = FUNCTIONS[func](**kwargs)
    return {"result": result}

# websocket receive and return function
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    ws_clients.add(ws)

    try:
        while True:
            data = json.loads(await ws.receive_text())
            func = data["func"]
            kwargs = data.get("kwargs", {})

            if func not in FUNCTIONS:
                await ws.send_json({"error": "function not found"})
                continue

            result = FUNCTIONS[func](**kwargs)
            await ws.send_json({"result": result})
    except Exception:
        traceback.print_exc()
        ws_clients.remove(ws)

# broadcast an event to all clients
@expose
async def broadcast(event, data):
    message = {"event": event, "data": data}
    for ws in clients:
        await ws.send_json(message)
#asyncio.create_task(broadcast("event", {"arg": value}))

# starting code
# ------------
app.include_router(router, prefix='/api')

app.mount('/', StaticFiles(directory='web', html=True), name='web')

def run_server():
    uvicorn.run(app, host='0.0.0.0', port=9000)
threading.Thread(target=run_server, daemon=True).start()

webview.create_window('MIDI Keypad Mapper', 'http://127.0.0.1:9000')
webview.start()