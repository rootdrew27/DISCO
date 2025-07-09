import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import { getToken } from "next-auth/jwt";
import {
  Role,
  QueuedUser,
  PendingMatch,
  MatchData,
  Config,
  MatchPreferences,
  LogLevel,
} from "./types/types.js";
import { Logger } from "./logger.js";
import { ErrorHandler } from "./error.js";

class MatchmakingService {
  private queue: Map<string, QueuedUser> = new Map(); // TODO: Replace with Redis DB
  private pendingMatches: Map<string, PendingMatch> = new Map(); // TODO: Replace with Redis DB
  private userSockets: Map<string, string> = new Map();
  public liveMatches: Map<string, MatchData> = new Map(); // TODO: Replace with Redis DB
  private logger: Logger;
  private errorHandler: ErrorHandler;

  constructor(
    private io: Server,
    config: Config
  ) {
    this.logger = new Logger(config.logDir, config.logLevel);
    this.errorHandler = new ErrorHandler(this.logger);
    this.setupSocketHandlers();
  }
  private setupSocketHandlers() {
    this.io.use(async (socket, next) => {
      try {
        await this.authenticateSocket(socket);
        next();
      } catch (error) {
        this.errorHandler.handleAuthError(error as Error);
        next(new Error("Authentication failed"));
      }
    });

    this.io.on("connection", (socket) => {
      const userId = this.extractUserId(socket);
      this.logger.info(`User connected: ${socket.id}`, { userId });

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, socket.id);
      }

      socket.on("join_queue", async (preferences: MatchPreferences) => {
        try {
          await this.handleJoinQueue(socket, preferences);
        } catch (error) {
          this.errorHandler.handleSocketError(error as Error, "join_queue");
          socket.emit("error", "Failed to join queue");
        }
      });

      socket.on("leave_queue", async () => {
        try {
          await this.handleLeaveQueue(socket);
        } catch (error) {
          this.errorHandler.handleSocketError(error as Error, "leave_queue");
          socket.emit("error", "Failed to leave queue");
        }
      });

      socket.on("accept_match", async (matchId: string) => {
        try {
          await this.handleAcceptMatch(socket, matchId);
        } catch (error) {
          this.errorHandler.handleSocketError(error as Error, "accept_match");
          socket.emit("error", "Failed to accept match");
        }
      });

      socket.on("reject_match", async (matchId: string) => {
        try {
          await this.handleRejectMatch(socket, matchId);
        } catch (error) {
          this.errorHandler.handleSocketError(error as Error, "reject_match");
          socket.emit("error", "Failed to reject match");
        }
      });

      socket.on("disconnect", async () => {
        try {
          await this.handleDisconnect(socket);
        } catch (error) {
          this.errorHandler.handleSocketError(error as Error, "disconnect");
        }
      });
    });
  }

  private async authenticateSocket(socket: any) {
    console.log(socket.handshake.headers)
    const cookies = socket.handshake.headers.cookie;
    if (!cookies) {
      throw new Error("No cookies provided");
    }

    console.log(cookies)

    const token = await getToken({
      req: { headers: { cookie: cookies } },
      secret: config.authSecret,
    });

    if (!token || !token.id) {
      throw new Error("Missing token or token.id");
    }

    socket.userToken = token;
    socket.userId = token.id;
  }

  private async handleJoinQueue(socket: any, preferences: MatchPreferences) {
    const userId = this.extractUserId(socket);
    this.logger.info(`User ${userId} attempting to join queue`);

    const queuedUser: QueuedUser = {
      userId,
      username: socket.userToken.username,
      socketId: socket.id,
      preferences,
      joinedAt: new Date(),
    };

    if (this.queue.has(userId)) {
      this.logger.warn(`User ${userId} already in queue`);
      socket.emit("already_queued");
      return;
    }

    this.queue.set(userId, queuedUser);

    const position = this.queue.size;
    // const estimatedWait = this.calculateEstimatedWait(preferences);

    socket.emit("queued", {
      position,
    });
    this.logger.info(`User ${userId} joined queue`, {
      preferences: preferences,
    });

    this.broadcastQueueUpdate();
    await this.attemptMatching();
  }

  private async handleLeaveQueue(socket: any) {
    const userId = this.extractUserId(socket);
    this.logger.info(`User ${userId} leaving queue`);

    if (this.queue.has(userId)) {
      this.queue.delete(userId);
      this.broadcastQueueUpdate();
    }
  }

  private async handleAcceptMatch(socket: any, matchId: string) {
    const userId = this.extractUserId(socket);
    const pendingMatch = this.pendingMatches.get(matchId);

    this.logger.info(`User ${userId} accepting match ${matchId}`);

    if (!pendingMatch) {
      this.logger.warn(`Match ${matchId} not found for user ${userId}`);
      socket.emit("error", "Match not found");
      return;
    }

    if (!pendingMatch.match.participants.includes(userId)) {
      this.logger.warn(`User ${userId} not a participant in match ${matchId}`);
      socket.emit("error", "Not a participant in this match");
      return;
    }

    pendingMatch.acceptedBy.add(userId);

    if (
      pendingMatch.acceptedBy.size === pendingMatch.match.participants.length
    ) {
      await this.finalizeMatch(pendingMatch);
    }
  }

  private async handleRejectMatch(socket: any, matchId: string) {
    const userId = this.extractUserId(socket);
    const pendingMatch = this.pendingMatches.get(matchId);

    this.logger.info(`User ${userId} rejecting match ${matchId}`);

    if (!pendingMatch) {
      this.logger.warn(
        `Match ${matchId} not found for rejection by user ${userId}`
      );
      return;
    }

    pendingMatch.rejectedBy.add(userId);
    await this.cancelMatch(matchId, "User rejected match");
  }

  private async handleDisconnect(socket: any) {
    const userId = this.extractUserId(socket);
    this.logger.info(`User ${userId} disconnected`);
    this.userSockets.delete(userId);

    if (this.queue.has(userId)) {
      this.queue.delete(userId);
      this.broadcastQueueUpdate();
    }

    const matchesToCancel = [];
    for (const [matchId, pendingMatch] of this.pendingMatches.entries()) {
      if (pendingMatch.match.participants.includes(userId)) {
        matchesToCancel.push(matchId);
      }
    }

    for (const matchId of matchesToCancel) {
      await this.cancelMatch(matchId, "User disconnected");
    }
  }

  private async attemptMatching() {
    const availableUsers = Array.from(this.queue.values()).filter(
      (user) => !this.isUserInPendingMatch(user.userId)
    );

    this.logger.debug(`Available users for matching: ${availableUsers.length}`);

    if (availableUsers.length < 2) {
      return;
    }

    const matches = this.findMatches(availableUsers);
    this.logger.info(`Found ${matches.length} potential matches`);

    const matchPromises = matches.map((match) =>
      this.createPendingMatch(match)
    );
    await Promise.all(matchPromises);
  }

  private findMatches(users: QueuedUser[]): MatchData[] {
    const matches: MatchData[] = [];
    const used = new Set<string>();

    for (let i = 0; i < users.length - 1; i++) {
      if (used.has(users[i].userId)) continue;

      for (let j = i + 1; j < users.length; j++) {
        if (used.has(users[j].userId)) continue;

        if (this.areUsersCompatible(users[i], users[j])) {
          const match: MatchData = {
            id: uuidv4(),
            participants: [users[i].userId, users[j].userId],
            participantUsernames: [users[i].username, users[j].username],
            topic: users[i].preferences.topic,
            format: users[i].preferences.format,
            createdAt: new Date(),
            expiresAt: new Date(
              Date.now() + config.matchExpireTime
            ),
          };

          matches.push(match);
          used.add(users[i].userId);
          used.add(users[j].userId);
          break;
        }
      }
    }

    return matches;
  }

  private areUsersCompatible(user1: QueuedUser, user2: QueuedUser): boolean {
    return (
      user1.preferences.format === user2.preferences.format &&
      user1.preferences.topic === user2.preferences.topic
    );
  }

  private async createPendingMatch(match: MatchData) {
    this.logger.info(`Creating pending match: ${match.id}`, {
      participants: match.participants,
    });

    const timeout = setTimeout(
      () => {
        this.cancelMatch(match.id, "Match expired");
      },
      config.matchExpireTime
    );

    const pendingMatch: PendingMatch = {
      match,
      acceptedBy: new Set(),
      rejectedBy: new Set(),
      timeout,
    };

    this.pendingMatches.set(match.id, pendingMatch);

    for (const userId of match.participants) {
      const socketId = this.userSockets.get(userId);
      if (socketId) {
        this.io.to(socketId).emit("match_found", match);
      }
    }
  }

  private async finalizeMatch(pendingMatch: PendingMatch) {
    this.logger.info(`Finalizing match ${pendingMatch.match.id}`);

    clearTimeout(pendingMatch.timeout);
    this.pendingMatches.delete(pendingMatch.match.id);

    try {
      const params = new URLSearchParams({
        matchId: pendingMatch.match.id,
        usernames: pendingMatch.match.participantUsernames.join(","),
      });

      const liveKitUrl = config.liveKitTokenServerUrl;
      const response = await fetch(`${liveKitUrl}/tokens?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to get LiveKit tokens: ${response.status}`);
      }
      const livekitTokens = await response.json();

      for (const userId of pendingMatch.match.participants) {
        this.queue.delete(userId);
        const socketId = this.userSockets.get(userId);
        const userIndex = pendingMatch.match.participants.indexOf(userId);
        const username = pendingMatch.match.participantUsernames[userIndex];
        const opponents = pendingMatch.match.participantUsernames.filter(
          (name) => username !== name
        );

        if (socketId) {
          this.io.to(socketId).emit("match_ready", {
            matchId: pendingMatch.match.id,
            opponents: opponents,
            lkToken: livekitTokens[username],
          });
        }
      }
      this.liveMatches.set(pendingMatch.match.id, pendingMatch.match);
      this.logger.info(`Match ${pendingMatch.match.id} finalized successfully`);
    } catch (error) {
      this.errorHandler.handleMatchError(error as Error, pendingMatch.match.id);
    }
    this.broadcastQueueUpdate();
  }

  private async cancelMatch(matchId: string, reason: string) {
    const pendingMatch = this.pendingMatches.get(matchId);
    if (!pendingMatch) return;

    this.logger.info(`Cancelling match ${matchId}`, { reason });

    clearTimeout(pendingMatch.timeout);
    this.pendingMatches.delete(matchId);

    for (const userId of pendingMatch.match.participants) {
      const socketId = this.userSockets.get(userId);
      if (socketId) {
        this.io.to(socketId).emit("match_cancelled", reason);
      }
    }

    await this.attemptMatching();
  }

  private isUserInPendingMatch(userId: string): boolean {
    for (const pendingMatch of this.pendingMatches.values()) {
      if (pendingMatch.match.participants.includes(userId)) {
        return true;
      }
    }
    return false;
  }

  private broadcastQueueUpdate() {
    this.io.emit("queue_update", {
      queueSize: this.queue.size,
    });
  }

  private extractUserId(socket: any): string {
    return socket.userId;
  }
}

dotenv.config({ path: ".env.local" });

function loadConfig(): Config {
  return {
    port: parseInt(process.env.PORT!, 10),
    clientUrl: process.env.NEXT_PUBLIC_CLIENT_URL!,
    authSecret: process.env.AUTH_SECRET!,
    liveKitTokenServerUrl: process.env.LIVEKIT_TOKEN_SERVER_URL!,
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

const mm = new MatchmakingService(io, config);

app.get("/health", (_, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/role", (req, res) => {
  const { matchId, username } = req.query;
  if (matchId && username) {
    if (
      mm.liveMatches
        .get(matchId?.toString())
        ?.participantUsernames.some((name) => name === username)
    ) {
      res.status(200).json({ role: Role.DISCUSSOR });
    } else {
      res.status(200).json({ role: Role.VIEWER });
    }
  }
  res.status(400).json({ role: Role.VIEWER });
});

server.listen(config.port, () => {
  console.log(`Matchmaking server running on port ${config.port}`);
});