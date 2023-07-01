/* eslint-disable no-unused-vars */
import { Server as WebSocketServer } from "ws";
import { applyPatches, produceWithPatches } from "immer";
import * as dotenv from "dotenv";
import gifts from "./src/data/gifts.json";

// Load environment variables
dotenv.config();
const webSocketPort = process.env.WEBSOCKET_PORT || "5001"


// ! WEBSOCKETS ! //
// Define WebSocket Server
const wss = new WebSocketServer({ "port": webSocketPort })

// Define connections
let connections = [];

// Define history seen by the server
let history = [];

wss.on("connection", (ws) => {
    /**
     * Assign player, save WS connection
    */
    connections.push(ws);
    console.log("New client connected");

    /**
     * Handle new messages
    */
    ws.on("message", (message) => {
      console.log(message);
      history.push(...JSON.parse(message));
      connections
        .filter(client => client !== ws)
        .forEach(client => {
          client.send(message);
        });
    });

    /**
     * Remove connection upon close
    */
    ws.on("close", () => {
      const idx = connections.indexOf(ws);
      if (idx !== -1) {
        connections.splice(idx, 1)
      };
    });

    /**
     * Send initial state
     */
    ws.send(JSON.stringify(history));
});


// ! INITIALISE STATE ! //
// Define the initial state
const initialState = { gifts };


// ! COMPRESS HISTORY ! //
// Compress history
export function compressHistory(currentPatches) {
  const [finalState, patches] = produceWithPatches(initialState, draft => {
    return applyPatches(draft, currentPatches);
  });

  // History
  console.log("COMPRESSING HISTORY");
  console.log(`compressed patches from ${history.length} to ${patches.length} patches`);
  console.log(JSON.stringify(patches, null, 2));

  // Final state
  //console.log("FINAL STATE")
  //console.log(finalState);

  return patches;
}

// Compress history every 5 seconds
setInterval(() => {
  let newHistory = compressHistory(history);
  history = newHistory;
}, 5000);
