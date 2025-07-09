import { io } from "socket.io-client";
import { mockJWTGenerator } from "./mock-jwt.js";
import { DiscussionFormat } from "../types/types.js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" })

const URL = process.env.HOST! + ":" + process.env.PORT!;
const MAX_CLIENTS = 1000;
const POLLING_PERCENTAGE = 0.05;
const CLIENT_CREATION_INTERVAL_IN_MS = 10;
const EMIT_INTERVAL_IN_MS = 1000;

let clientCount = 0;
let lastReport = new Date().getTime();
let packetsSinceLastReport = 0;

const createClient = () => {
  // for demonstration purposes, some clients stay stuck in HTTP long-polling
  const transports =
    Math.random() < POLLING_PERCENTAGE ? ["polling"] : ["polling", "websocket"];

  // Generate a mock JWT for this client
  const mockToken = mockJWTGenerator.generateRandomToken();
  const mockUser = mockJWTGenerator.verifyToken(mockToken);

  // Create cookie string with the JWT (simulating next-auth session token)
  const cookieString = `authjs.session-token=${mockToken};`;
  
  const socket = io(URL, {
    transports,
    extraHeaders: {
      cookie: cookieString
    }, withCredentials: true
  });

  // Generate random preferences for this user
  const formats = Object.values(DiscussionFormat);
  const topics = ["Technology", "Politics", "Science", "Philosophy", "Economics", "Environment"];
  
  const preferences = {
    format: formats[Math.floor(Math.random() * formats.length)],
    topic: topics[Math.floor(Math.random() * topics.length)],
    maxWaitTime: Math.floor(Math.random() * 300) + 60, // 60-360 seconds
    expertiseLevel: mockUser?.expertiseLevel || Math.floor(Math.random() * 5) + 1
  };

  setInterval(() => {
    socket.emit("join_queue", preferences);
  }, EMIT_INTERVAL_IN_MS);

  setInterval(() => {

  }, EMIT_INTERVAL_IN_MS + 500);


  socket.onAny(() => {
    packetsSinceLastReport++;
  });

  socket.on("disconnect", (reason) => {
    console.log(`disconnect due to ${reason}`);
  });

  if (++clientCount < MAX_CLIENTS) {
    setTimeout(createClient, CLIENT_CREATION_INTERVAL_IN_MS);
  }
};

createClient();

const printReport = () => {
  const now = new Date().getTime();
  const durationSinceLastReport = (now - lastReport) / 1000;
  const packetsPerSeconds = (
    packetsSinceLastReport / durationSinceLastReport
  ).toFixed(2);

  console.log(
    `client count: ${clientCount} ; average packets received per second: ${packetsPerSeconds}`
  );

  packetsSinceLastReport = 0;
  lastReport = now;
};

setInterval(printReport, 5000);

// NOTES: Remove Auth middleware from Match Making Server. 
// Add the following:
// (socket as any).userToken = { username: "duh" };
// // @ts-ignore
// (socket as any).userId = this.i++;

// TODO: Try complex sequences 
// TODO: Get auth (tokens) working
