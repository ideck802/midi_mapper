const ws = new WebSocket("ws://localhost:9000/ws");
ws.onopen = () => console.log("Websocket connected");

// rest api helper
async function restCall(func, args) {

  const res = await fetch("/api/" + func, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(args)
  });

  return (await res.json()).result
}
//await restCall("func", {args});

// websocket helper
function wsCall(func, args) {

  return new Promise(resolve => {

      ws.onmessage = msg => {
        resolve(JSON.parse(msg.data).result)
      }

      ws.send(JSON.stringify({
        func: func,
        kwargs: args
      }));
  })
}
//await wsCall("func", {args});

const events = {}

//function to register an event
function on(eventName, handler) {
  events[eventName] = handler
}
//on("event", data => func(data))

ws.addEventListener("message", event => {
  const msg = JSON.parse(event.data)

  if(msg.event && events[msg.event]) {
    events[msg.event](msg.data)
  }
});