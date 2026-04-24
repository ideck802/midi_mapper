/* eslint-disable max-len */

const sttngsDsply = document.getElementById('sttngsDsply');

async function openSettings() {
  sttngsDsply.style.display = 'flex';
  //test = await restCall('cancel_poll', {main:false});
  test = await wsCall('cancel_poll', {main:false});
  console.log(test);
  renderSettings();
}

function closeSettings() {
  sttngsDsply.style.display = 'none';
  wsCall('flush_all_inputs', {});
  wsCall('main_listen_input', {});
}

let settings = {}

function saveSettings() {
  wsCall('save_settings', {data:settings});
}

restCall('load_settings', {}).then(data => {
  settings = data
});

restCall('main_listen_input', {});
