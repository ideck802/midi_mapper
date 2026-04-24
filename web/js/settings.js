
settingsCont = document.getElementById('settings_cont');

function renderSettings() {
    console.log(settings);
    let html = `<div class='macro-scroll'><div class='macro-list'>`

    for (const [key, value] of Object.entries(settings.macros)) {
        html += `<div class='macro' id='macro_${key}'>
            <div class='bar'>
                <p>${key}</p>
                <button onclick='modifyMacro("${key}")'><i class="fa-solid fa-pencil"></i></button>
                <button onclick='nameMacro("${key}")'><i class="fa-regular fa-clone"></i></button>
                <button onclick='deleteMacro("${key}")'><i class="fa-solid fa-trash"></i></button>
            </div>
            <div class='details-box' id='${key}_details_box'></div>
        </div>`
    }

    html += `</div></div>
        <div class='add-area' id='add_area'>
            <div class="name-macro" id="name_macro"></div>
            <button onclick='nameMacro()'>+</button>
        </div>
        <div class='ask-save-dialog' id='ask_save_dialog'></div>`
    settingsCont.innerHTML = html;
}

function nameMacro(copy = false) {
    const nameMacro = document.getElementById('name_macro');
    nameMacro.classList.add('open');
    html = `<p>Enter a name</p>
        <input type='text' id='new_name'/>
        <button onclick='createNewMacro("${copy}")'><i class="fa-solid fa-check"></i></button>`
    nameMacro.innerHTML = html;
    document.getElementById('new_name').focus();
}

function createNewMacro(copy) {
    const name = document.getElementById('new_name').value;
    if (copy == 'false') {
        settings.macros[name] = {
            "input": {"device": "","note": "0","velo": "0"}, "out_type": "all", "outputs": []
        }
    } else {
        settings.macros[name] = settings.macros[copy]
    }
    renderSettings();
    modifyMacro(name)
}

let oldMacro = {}
let isModifying = false

// triggers save dialog when clicking outside of edit div
function outsideModifyHandle(event) {
    const currMacro = document.getElementById('macro_' + isModifying);
    if (!currMacro.contains(event.target)) {
        finishModify(isModifying);
    }
}

function modifyMacro(name) {
    isModifying = name

    document.addEventListener('mousedown', outsideModifyHandle);

    const detailsBox = document.getElementById(name + '_details_box');
    oldMacro = settings.macros[name]
    const inputVals = settings.macros[name].input;
    const outType = settings.macros[name].out_type;

    let html = `<div class='listening-notice' id='listen_notice'><h2>Listening...</h2></div>
    <div class='finish-btns'>
        <button onclick='finishModify("${name}", true)'>Save and finish</button>
        <button onclick='finishModify("${name}", false)'>Discard and finish</button>
    </div>
    <div class='input'>
        <div class='row'>
            <h3>Input</h3>
            <button onclick='pollForMidi()'><i class="fa-solid fa-location-crosshairs"></i></button>
        </div>
        <div class='row'>
            <p>Input type:</p>
            <p id='note_type'></p>
        </div>
        <div class='row'>
            <p>Midi device:</p>
            <p id='in_device_name'>${inputVals.device}</p>
        </div>
        <div class='row'>
            <p>Note #:</p>
            <input type='number' id='in_note_id' value='${inputVals.note}' step='1'/>
        </div>
        <div class='row'>
            <p>Note velocity:</p>
            <input type='number' id='in_velocity' value='${inputVals.velo}' min='0' max='127' step='1'/>
        </div>
    </div>

    <div class='outputs'>
        <div class='row'>
            <h3>Outputs</h3>
            <div>
                <select name='out_type' id='out_type'>
                    <option value='all' ${outType == 'all' ? 'selected' : ''}>Activate all</option>
                    <option value='cycle' ${outType == 'cycle' ? 'selected' : ''}>Activate through cycle<option>
                </select>
                <button onclick='addOutput("${name}")'>Add output</button>
            </div>
        </div>
        <div class='outs-list' id='${name}_outputs'></div>
    </div>`
    detailsBox.innerHTML = html;
    renderOuts(name);
    detailsBox.classList.add('open');
}

function renderOuts(name) {
    const outsList = document.getElementById(name + '_outputs');
    const macroOuts = settings.macros[name].outputs.sort();

    outsList.innerHTML = '';

    // loop through the outs in the settings
    for (var i = 0; i < macroOuts.length; i++) {
        outsList.innerHTML += `<div class='output' id='${name}_output_${i}'>
            <div class='row dual-btns'>
                <button onclick='addOutput("${name}", ${i})'><i class="fa-regular fa-clone"></i></button>
                <button onclick='removeOutput("${name}", ${i})'><i class="fa-solid fa-trash"></i></button>
            </div>
            <div class='row'>
                <p>Output method:</p>
                <select name='output_device' id='${name}_output${i}_device' onchange='outputDeviceChng("${name}", ${i})'>
                    <option value='midiLt' ${macroOuts[i].type == 'midiLt' ? 'selected' : ''}>Midi Light</option>
                    <option value='key_to_wndw' ${macroOuts[i].type == 'key_to_wndw' ? 'selected' : ''}>Keypress to Window</option>
                    <option value='str_to_wndw' ${macroOuts[i].type == 'str_to_wndw' ? 'selected' : ''}>Type to Window</option>
                    <option value='osc_str' ${macroOuts[i].type == 'osc_str' ? 'selected' : ''}>Send OSC Message</option>
                </select>
            </div>
            <div class='row'>
                <p>Conditional:</p>
                <select name='condition' id='${name}_condition${i}'>
                    <option value='button' ${macroOuts[i].cond == 'button' ? 'selected' : ''}>Velocity any</option>
                    <option value='equals' ${macroOuts[i].cond == 'equals' ? 'selected' : ''}>Velocity equals =</option>
                    <option value='less' ${macroOuts[i].cond == 'less' ? 'selected' : ''}>Velocity less than <</option>
                    <option value='greater' ${macroOuts[i].cond == 'greater' ? 'selected' : ''}>Velocity greater than ></option>
                    <option value='cycle' ${macroOuts[i].cond == 'cycle' ? 'selected' : ''}>Cycle</option>
                </select>
            </div>
            <div class='output-settings' id='${name}_output${i}_settings'></div>
        </div>`

        outputDeviceChng(name, i.toString());
    }
}

function addOutput(name, copy = 'false') {
    applyOutput(name);
    if (copy == 'false') {
        settings.macros[name].outputs.push({
            "device": "",
            "note": "",
            "color": "",
            "type": "midiLt",
            "cond": "button"
        });
    } else {
        const outputs = settings.macros[name].outputs.sort();
        settings.macros[name].outputs.push(structuredClone(outputs[copy]));
    }
    renderOuts(name);
}

function removeOutput(name, i) {
    applyOutput(name);
    settings.macros[name].outputs.sort().splice(i, 1);
    renderOuts(name);
}

// read the type of output and render the right setting display
function outputDeviceChng(name, i) {
    const out_dev = document.getElementById(name + '_output' + i + '_device').value;
    let html = '';
    const outputVals = settings.macros[name].outputs[parseInt(i)]

    if (out_dev == 'midiLt') {
        html += `<div class='row'>
            <p>Midi device:</p>
            <p id='${name + i}_device_name'>${outputVals.device}</p>
            <button onclick='pollForMidi("out", "${name}", "${i}")'><i class="fa-solid fa-location-crosshairs"></i></button>
        </div>
        <div class='row'>
            <p>Light ID/note:</p>
            <input type='number' id='${name + i}_note_id' value='${outputVals.note}' step='1'/>
        </div>
        <div class='row'>
            <p>Color number:</p>
            <input type='number' id='${name + i}_color' value='${outputVals.color}' min='0' max='127' step='1'/>
        </div>`
    } else if (out_dev == 'key_to_wndw') {
        let wndw_match = ''
        let keystroke = ''
        if (outputVals.wndw_match != undefined) {
            wndw_match = outputVals.wndw_match
        }
        if (outputVals.keystroke != undefined) {
            keystroke = outputVals.keystroke
        }

        html += `<div class='row'>
            <p>Window title (supports regex<i class="fa-regular fa-circle-question"></i>):</p>
            <input type='text' id='${name + i}_wndw_match' value='${wndw_match}'/>
        </div>
        <div class='row'>
            <p>Key (using JS keycode):</p>
            <div>
                <input type='text' id='${name + i}_keystroke' value='${keystroke}'/>
                <button onclick='getKeystroke("${name}", ${i})'><i class="fa-solid fa-location-crosshairs"></i></button>
            </div>
        </div>`
    } else if (out_dev == 'str_to_wndw') {
        let wndw_match = ''
        let string = ''
        if (outputVals.wndw_match != undefined) {
            wndw_match = outputVals.wndw_match
        }
        if (outputVals.string != undefined) {
            string = outputVals.string
        }
        
        html += `<div class='row'>
            <p>Window title (supports regex<i class="fa-regular fa-circle-question"></i>):</p>
            <input type='text' id='${name + i}_wndw_match' value='${wndw_match}'/>
        </div>
        <div class='row'>
            <p>Text to output:</p>
            <input type='text' class='long' id='${name + i}_str' value='${string}'/>
        </div>`
    } else if (out_dev == 'osc_str') {
        let port = 10024
        if (typeof outputVals.port !== 'undefined') {
            port = outputVals.port
        }

        html += `<div class='row'>
            <p>Device IP:</p>
            <input type='text' id='${name + i}_osc_ip' value='${outputVals.ip}'/>
        </div>
        <div class='row'>
            <p>Port</p>
            <input type='number' id='${name + i}_osc_port' value='${port}'/>
        </div>
        <div class='row'>
            <p>OSC Message (separate arg with space)</p>
            <input type='text' id='${name + i}_osc_msg' value='${outputVals.msg}'/>
        </div>`
    }

    document.getElementById(name + '_output' + i + '_settings').innerHTML = html;
}

function getKeystroke(name, i) {
    const listenNotice = document.getElementById('listen_notice');
    listenNotice.style.display = 'flex';

    function onKey(event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        document.getElementById(name + i.toString() + '_keystroke').value = event.code;

        document.removeEventListener('keydown', onKey);
        listenNotice.style.display = 'none';
    }

    document.addEventListener('keydown', onKey);
}

async function pollForMidi(type = 'in', name = null, i = null) {
    const listenNotice = document.getElementById('listen_notice');
    listenNotice.style.display = 'flex';
    await wsCall('flush_all_inputs', {});
    const midi_in = await wsCall("poll_midi_in", {});
    console.log(midi_in);
    if (type == 'in') {
        document.getElementById('note_type').innerHTML = `Type: ${midi_in.type}`;
        document.getElementById('in_device_name').innerHTML = midi_in.device;
        document.getElementById('in_note_id').value = midi_in.note;
        document.getElementById('in_velocity').value = midi_in.velo;
    } else if (type == 'out') {
        document.getElementById(name + i + '_device_name').innerHTML = midi_in.device;
        document.getElementById(name + i + '_note_id').value = midi_in.note;
    }
    listenNotice.style.display = 'none';
}

function applyOutput(name) {
    const html_outputs = document.getElementById(name + '_outputs').children;
    for (var i = 0; i < html_outputs.length; i++) {
        const out_dev = document.getElementById(name + '_output' + i.toString() + '_device').value;

        settings.macros[name].outputs[i] = {}

        settings.macros[name].outputs[i].type = out_dev
        settings.macros[name].outputs[i].cond = document.getElementById(name + '_condition' + i.toString()).value

        if (out_dev == 'midiLt') {
            settings.macros[name].outputs[i].device = document.getElementById(name + i.toString() + '_device_name').innerHTML
            settings.macros[name].outputs[i].note = document.getElementById(name + i.toString() + '_note_id').value
            settings.macros[name].outputs[i].color = document.getElementById(name + i.toString() + '_color').value
        } else if (out_dev == 'key_to_wndw') {
            settings.macros[name].outputs[i].wndw_match = document.getElementById(name + i.toString() + '_wndw_match').value;
            settings.macros[name].outputs[i].keystroke = document.getElementById(name + i.toString() + '_keystroke').value;
        } else if (out_dev == 'str_to_wndw') {
            settings.macros[name].outputs[i].wndw_match = document.getElementById(name + i.toString() + '_wndw_match').value;
            settings.macros[name].outputs[i].string = document.getElementById(name + i.toString() + '_str').value;
        } else if (out_dev == 'osc_str') {
            settings.macros[name].outputs[i].ip = document.getElementById(name + i.toString() + '_osc_ip').value;
            settings.macros[name].outputs[i].port = document.getElementById(name + i.toString() + '_osc_port').value;
            settings.macros[name].outputs[i].msg = document.getElementById(name + i.toString() + '_osc_msg').value;
        }
    }
}

function finishModify(name, save = 'ask') {
    const askDialog = document.getElementById('ask_save_dialog');

    document.removeEventListener('mousedown', outsideModifyHandle);

    if (save == 'ask') {
        console.log('asking if want to save');
        askDialog.innerHTML = `<div>
            <h2>Did you want to save changes to ${name}?</h2>
            <div class='btns'>
                <button onclick='finishModify("${name}", true)'>Yes</button>
                <button onclick='finishModify("${name}", false)'>No</button>
            </div>
        </div>`
        askDialog.style.display = 'flex';
    } else if (save == true) {
        // input settings
        settings.macros[name].input.device = document.getElementById('in_device_name').innerHTML
        settings.macros[name].input.note = document.getElementById('in_note_id').value
        settings.macros[name].input.velo = document.getElementById('in_velocity').value
        // output settings
        settings.macros[name].out_type = document.getElementById('out_type').value
        applyOutput(name);
        saveSettings();
        askDialog.style.display = 'none';
        renderSettings();
    } else if (save == false) {
        settings.macros[name] = oldMacro
        saveSettings();
        askDialog.style.display = 'none';
        renderSettings();
    }
}

function deleteMacro(name) {
    delete settings.macros[name];
    saveSettings();
    renderSettings();
}
