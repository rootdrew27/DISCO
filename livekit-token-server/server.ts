import express, { Request, Response, NextFunction } from "express";
import { createServer } from "http";
import {
  AccessToken,
  TrackSource,
  VideoGrant,
  Room,
  RoomServiceClient,
  CreateOptions,
} from "livekit-server-sdk";
import dotenv from "dotenv";
import {
  Config,
  LogLevel,
  Role,
  TokensRequest,
  TokensResponse,
} from "./types.js";
import { Logger } from "./logger.js";
import { ErrorHandler, TokenCreationError, ValidationError } from "./error.js";
import { v4 as uuid } from "uuid";

function loadConfig(): Config {
  const requiredEnvVars = ["LIVEKIT_API_KEY", "LIVEKIT_API_SECRET", "PORT"];
  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }

  return {
    port: parseInt(process.env.PORT!, 10),
    liveKitUrl: process.env.LIVEKIT_API_URL!,
    liveKitApiKey: process.env.LIVEKIT_API_KEY!,
    liveKitApiSecret: process.env.LIVEKIT_API_SECRET!,
    clientUrl: process.env.NEXT_PUBLIC_CLIENT_URL!,
    tokenTtl: process.env.TOKEN_TTL || "60m",
    logLevel: (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO,
    logDir: process.env.LOG_DIR || "./logs",
  };
}

function expressErrorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (error instanceof ValidationError) {
    errorHandler.handleValidationError(error);
    res.status(400).json({ error: error.message });
    return;
  }

  if (error instanceof TokenCreationError) {
    errorHandler.handleTokenCreationError(error);
    res.status(500).json({ error: error.message });
    return;
  }

  errorHandler.handleGenericError(error, "express");
  res.status(500).json({ error: "Internal server error" });
}

dotenv.config({ path: ".env.local" });

const config = loadConfig();
const logger = new Logger(config.logDir, config.logLevel);
const errorHandler = new ErrorHandler(logger);
const ROOM_SERVICE_CLIENT = new RoomServiceClient(
  config.liveKitUrl,
  config.liveKitApiKey,
  config.liveKitApiSecret
);

function validateTokensRequest(
  matchId: unknown,
  usernames: unknown
): TokensRequest {
  if (!matchId || typeof matchId !== "string") {
    throw new ValidationError("matchId must be a non-empty string");
  }

  if (!usernames || typeof usernames !== "string") {
    throw new ValidationError("usernames must be a non-empty string");
  }

  return { matchId, usernames };
}

function validateTokenRequest(
  matchId: unknown,
  role: unknown,
  username: unknown
) {
  if (!(matchId && typeof matchId === "string") || !matchId.trim()) {
    throw new ValidationError("matchId must be a non-empty string");
  }
  if (!(role === Role.DISCUSSOR || role === Role.VIEWER)) {
    throw new ValidationError("role must be 'discussor' or 'viewer'");
  }

  if (!(username === undefined || typeof username === "string")) {
    throw new ValidationError(
      "if defined, username must be a non-empty string"
    );
  }
  return { matchId, role, username };
}

async function createDiscussionToken(
  matchId: string,
  role: Role,
  username?: string
) {
  const accessToken = new AccessToken(
    config.liveKitApiKey,
    config.liveKitApiSecret,
    {
      identity: !!username ? username : uuid(),
      ttl: config.tokenTtl,
    }
  );

  let videoGrant: VideoGrant;
  if (role === Role.DISCUSSOR) {
    videoGrant = {
      room: matchId,
      roomJoin: true,
      canPublish: true,
      canPublishSources: [TrackSource.CAMERA, TrackSource.MICROPHONE],
      canSubscribe: true,
      canPublishData: true,
    };
  } else {
    videoGrant = {
      room: matchId,
      roomJoin: true,
      canSubscribe: true,
      canPublishData: true,
    };
  }

  accessToken.addGrant(videoGrant);
  return await accessToken.toJwt();
}

async function createDiscussionTokens(
  matchId: string,
  usernames: string[]
): Promise<TokensResponse> {
  logger.info(`Creating tokens for match ${matchId}`, { usernames });

  const tokens: TokensResponse = {};
  const errors: string[] = [];

  await Promise.all(
    usernames.map(async (username) => {
      try {
        const trimmedUsername = username.trim();
        if (!trimmedUsername) {
          errors.push(`Empty username provided`);
          return;
        }

        const accessToken = new AccessToken(
          config.liveKitApiKey,
          config.liveKitApiSecret,
          {
            identity: trimmedUsername,
            ttl: config.tokenTtl,
          }
        );

        const videoGrant: VideoGrant = {
          room: matchId,
          roomJoin: true,
          canPublish: true,
          canPublishSources: [TrackSource.CAMERA, TrackSource.MICROPHONE],
          canSubscribe: true,
          canPublishData: true,
        };

        accessToken.addGrant(videoGrant);
        tokens[trimmedUsername] = await accessToken.toJwt();
        logger.debug(`Token created for user ${trimmedUsername}`);
      } catch (error) {
        const errorMessage = `Failed to create token for ${username}: ${error instanceof Error ? error.message : "Unknown error"}`;
        errors.push(errorMessage);
        logger.error(errorMessage);
      }
    })
  );

  if (errors.length > 0) {
    throw new TokenCreationError(`Token creation errors: ${errors.join(", ")}`);
  }

  // create room
  await ROOM_SERVICE_CLIENT.createRoom({
    name: matchId,
    emptyTimeout: 60,
    departureTimeout: 60,
  });

  logger.info(
    `Successfully created ${Object.keys(tokens).length} tokens for match ${matchId}`
  );
  return tokens;
}

const app = express();
const server = createServer(app);

app.use(express.json());
app.use(expressErrorHandler);

app.get("/tokens", async (req: Request, res: Response, next: NextFunction) => {
  logger.info("Tokens request received", { query: req.query });
  try {
    const { matchId, usernames } = validateTokensRequest(
      req.query.matchId,
      req.query.usernames
    );
    const usernameArray = usernames
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    if (usernameArray.length === 0) {
      throw new ValidationError("No valid usernames provided");
    }

    const tokens = await createDiscussionTokens(matchId, usernameArray);
    res.status(200).json(tokens);
    logger.info("Token request completed successfully", {
      matchId,
      userCount: usernameArray.length,
    });
  } catch (error) {
    next(error);
  }
});

app.get("/token", async (req: Request, res: Response, next: NextFunction) => {
  logger.info("Token request received", { query: req.query });
  try {
    const { matchId, role, username } = validateTokenRequest(
      req.query.matchId,
      req.query.role,
      req.query.username
    );
    const token = await createDiscussionToken(matchId, role, username);
    res.status(200).json({ token });
  } catch (error) {
    next(error);
  }
});

server.listen(config.port, () => {
  logger.info(`LiveKit token server started on port ${config.port}`);
});
