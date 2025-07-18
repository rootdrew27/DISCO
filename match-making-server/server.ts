import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { WebhookReceiver } from "livekit-server-sdk";
import { Config, LogLevel } from "./types/types.js";
import { MatchmakingService } from "./service.js";
import { createClient } from "redis";

dotenv.config({ path: ".env.local" });

function loadConfig(): Config {
  return {
    port: parseInt(process.env.PORT!, 10),
    clientUrl: process.env.NEXT_PUBLIC_CLIENT_URL!,
    authSecret: process.env.AUTH_SECRET!,
    liveKitUrl: process.env.LIVEKIT_URL!,
    liveKitApiKey: process.env.LIVEKIT_API_KEY!,
    liveKitApiSecret: process.env.LIVEKIT_API_SECRET!,
    matchExpireTime: parseInt(process.env.MATCH_EXPIRE_TIME!, 10),
    logLevel: (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO,
    logDir: process.env.LOG_DIR || "./logs",
  };
}

const config = loadConfig();
const app = express();

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: config.clientUrl,
    credentials: true,
  },
});

const corsConfig = {
  origin: "http://localhost.com:3000",
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

const mm = new MatchmakingService(io, config);

app.get("/health", (_, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// LiveKit Webhooks

const receiver = new WebhookReceiver(
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
);

const redisClient = createClient({ url: "redis://localhost:6379" });

redisClient.connect();

app.post(
  "/livekit-webhook",
  express.raw({ type: "application/webhook+json" }),
  async (req, res) => {
    const event = await receiver.receive(req.body, req.get("Authorization"));

    switch (event.event) {
      case "room_finished":
        redisClient.hDel("activeMatches", event.room!.name);
        break;
      case "participant_left":
        // Check if room is empty
        if (event.room!.numParticipants === 0) {
          redisClient.hDel("activeMatches", event.room!.name);
        }
        break;
    }

    res.status(200).send();
  }
);

server.listen(config.port, () => {
  console.log(`Matchmaking server running on port ${config.port}`);
});
