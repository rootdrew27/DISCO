import { v4 as uuidv4 } from "uuid";
import { getToken } from "next-auth/jwt";
import { Logger } from "./logger.js";
import { ErrorHandler } from "./error.js";
import { Server, Socket } from "socket.io";
import { createClient, RedisClientType } from "redis";
import {
  QueuedUser,
  PendingMatch,
  MatchData,
  Config,
  MatchPreferences,
  UserData,
  AuthJWT,
} from "./types/types.js";

interface UserSocket extends Socket {
  user?: UserData;
}

export class MatchmakingService {
  private userSockets: Map<string, UserSocket> = new Map();
  private logger: Logger;
  private errorHandler: ErrorHandler;
  private config: Config;
  private redisClient: RedisClientType;

  constructor(
    private io: Server,
    config: Config
  ) {
    this.logger = new Logger(config.logDir, config.logLevel);
    this.errorHandler = new ErrorHandler(this.logger);
    this.config = config;
    this.redisClient = createClient({
      url: "redis://localhost:6379",
    });
    this.redisClient.connect();
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

    this.io.on("connection", (socket: UserSocket) => {
      const userId = this.extractUserId(socket);
      this.logger.info(`User connected: ${socket.id}`, { userId });

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, socket);
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

  private async authenticateSocket(socket: UserSocket) {
    const cookies = socket.handshake.headers.cookie;
    if (!cookies) {
      throw new Error("No cookies provided");
    }

    const token = await getToken({
      req: { headers: { cookie: cookies } },
      secret: this.config.authSecret,
    });

    if (!token || typeof token.id !== "string") {
      throw new Error("Missing token or token.id");
    }

    socket.user = {
      id: token.id,
      token: token as AuthJWT,
      isInPendingMatch: false,
    };
  }

  private async handleJoinQueue(
    socket: UserSocket,
    preferences: MatchPreferences
  ) {
    const userId = this.extractUserId(socket);
    this.logger.info(`User ${userId} attempting to join queue`);

    const queuedUser: QueuedUser = {
      userId,
      username: socket.user!.token.username,
      socketId: socket.id,
      preferences,
      joinedAt: new Date(),
    };

    const existingUser = await this.redisClient.hGet("queue", userId);
    if (existingUser) {
      this.logger.warn(`User ${userId} already in queue`);
      socket.emit("already_queued");
      return;
    }

    await this.redisClient.hSet("queue", userId, JSON.stringify(queuedUser));

    const position = await this.redisClient.hLen("queue");
    // const estimatedWait = this.calculateEstimatedWait(preferences);

    socket.emit("queued", {
      position,
    });
    this.logger.info(`User ${userId} joined queue`, {
      preferences: preferences,
    });

    await this.broadcastQueueUpdate();
    await this.attemptMatching();
  }

  private async handleLeaveQueue(socket: UserSocket) {
    const userId = this.extractUserId(socket);
    this.logger.info(`User ${userId} leaving queue`);

    const existingUser = await this.redisClient.hGet("queue", userId);
    if (existingUser) {
      await this.redisClient.hDel("queue", userId);
      await this.broadcastQueueUpdate();
    }
  }

  private async handleAcceptMatch(socket: UserSocket, matchId: string) {
    const userId = this.extractUserId(socket);
    const pendingMatchJson = await this.redisClient.hGet(
      "pendingMatches",
      matchId
    );

    this.logger.info(`User ${userId} accepting match ${matchId}`);

    if (!pendingMatchJson) {
      this.logger.warn(`Match ${matchId} not found for user ${userId}`);
      socket.emit("error", "Match not found");
      return;
    }

    const pendingMatch = JSON.parse(pendingMatchJson);

    if (!pendingMatch.match.participants.includes(userId)) {
      this.logger.warn(`User ${userId} not a participant in match ${matchId}`);
      socket.emit("error", "Not a participant in this match");
      return;
    }

    pendingMatch.acceptedBy.push(userId);
    await this.redisClient.hSet(
      "pendingMatches",
      matchId,
      JSON.stringify(pendingMatch)
    );

    if (
      pendingMatch.acceptedBy.length === pendingMatch.match.participants.length
    ) {
      await this.finalizeMatch(pendingMatch);
    }
  }

  private async handleRejectMatch(socket: UserSocket, matchId: string) {
    const userId = this.extractUserId(socket);
    const pendingMatchJson = await this.redisClient.hGet(
      "pendingMatches",
      matchId
    );

    this.logger.info(`User ${userId} rejecting match ${matchId}`);

    if (!pendingMatchJson) {
      this.logger.warn(
        `Match ${matchId} not found for rejection by user ${userId}`
      );
      return;
    }

    const pendingMatch = JSON.parse(pendingMatchJson);
    pendingMatch.rejectedBy.push(userId);
    await this.redisClient.hSet(
      "pendingMatches",
      matchId,
      JSON.stringify(pendingMatch)
    );
    await this.cancelMatch(matchId, "User rejected match");
  }

  private async handleDisconnect(socket: UserSocket) {
    const userId = this.extractUserId(socket);
    this.logger.info(`User ${userId} disconnected`);
    this.userSockets.delete(userId);

    const existingUser = await this.redisClient.hGet("queue", userId);
    if (existingUser) {
      await this.redisClient.hDel("queue", userId);
      await this.broadcastQueueUpdate();
    }

    const matchesToCancel = [];
    const pendingMatchesData = await this.redisClient.hGetAll("pendingMatches");
    for (const [matchId, pendingMatchJson] of Object.entries(
      pendingMatchesData
    )) {
      const pendingMatch = JSON.parse(pendingMatchJson);
      if (pendingMatch.match.participants.includes(userId)) {
        matchesToCancel.push(matchId);
      }
    }

    for (const matchId of matchesToCancel) {
      await this.cancelMatch(matchId, "User disconnected");
    }
  }

  private async attemptMatching() {
    const queueData = await this.redisClient.hGetAll("queue");
    const allUsers = Object.values(queueData).map((userJson) =>
      JSON.parse(userJson)
    );
    const availableUsers = [];
    for (const user of allUsers) {
      if (!(await this.isUserInPendingMatch(user.userId))) {
        availableUsers.push(user);
      }
    }

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
            expiresAt: new Date(Date.now() + this.config.matchExpireTime),
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

    const pendingMatch: PendingMatch = {
      match,
      acceptedBy: [],
      rejectedBy: [],
    };

    await this.redisClient.hSet(
      "pendingMatches",
      match.id,
      JSON.stringify(pendingMatch)
    );

    for (const userId of match.participants) {
      const userData = this.userSockets.get(userId)?.user;

      if (userData) {
        userData.isInPendingMatch = true;
      } else {
        // TODO: Create a class that extends Map to encapsulate the error handling related to missing keys
        this.logger.error(
          `User data was not found for user with id: (${userId}).`
        );
      }
      const socketId = this.userSockets.get(userId)?.id;
      if (socketId) {
        this.io.to(socketId).emit("match_found", match);
      }
    }

    setTimeout(() => {
      this.cancelMatch(match.id, "Match expired");
    }, this.config.matchExpireTime);
  }

  private async finalizeMatch(pendingMatch: PendingMatch) {
    const matchId = pendingMatch.match.id;
    this.logger.info(`Finalizing match ${matchId}`);
    await this.redisClient.hDel("pendingMatches", pendingMatch.match.id);
    try {
      const params = new URLSearchParams({
        matchId: pendingMatch.match.id,
        usernames: pendingMatch.match.participantUsernames.join(","),
      });

      const response = await fetch(
        `${this.config.liveKitTokenServerUrl}/tokens?${params}`
      );
      if (!response.ok) {
        throw new Error(`Failed to get LiveKit tokens: ${response.status}`);
      }
      const livekitTokens = await response.json();

      for (const userId of pendingMatch.match.participants) {
        this.redisClient.hDel("queue", userId);
        const socketId = this.userSockets.get(userId)?.id;
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
      await this.redisClient.hSet(
        "activeMatches",
        pendingMatch.match.id,
        JSON.stringify(pendingMatch.match)
      );
      this.logger.info(`Match ${pendingMatch.match.id} finalized successfully`);
    } catch (error) {
      this.errorHandler.handleMatchError(error as Error, pendingMatch.match.id);
    }
    this.broadcastQueueUpdate();
  }

  private async cancelMatch(matchId: string, reason: string) {
    const pendingMatchJSON = await this.redisClient.hGet(
      "pendingMatches",
      matchId
    );
    if (!pendingMatchJSON) return;

    this.logger.info(`Cancelling match ${matchId}`, { reason });
    await this.redisClient.hDel("pendingMatches", matchId);

    const pendingMatch: PendingMatch = JSON.parse(pendingMatchJSON);

    for (const userId of pendingMatch.match.participants) {
      const socketId = this.userSockets.get(userId)?.id;
      if (socketId) {
        this.io.to(socketId).emit("match_cancelled", reason);
      }
    }

    await this.attemptMatching();
  }

  private async isUserInPendingMatch(userId: string): Promise<boolean> {
    return this.userSockets.get(userId)!.user!.isInPendingMatch;
  }

  private async broadcastQueueUpdate() {
    const queueSize = await this.redisClient.hLen("queue");
    this.io.emit("queue_update", {
      queueSize: queueSize,
    });
  }

  private extractUserId(socket: UserSocket): string {
    return socket.user!.id;
  }
}
