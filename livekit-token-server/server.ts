import express, { Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { AccessToken, TrackSource, VideoGrant } from "livekit-server-sdk";
import dotenv from "dotenv";
import { Config, LogLevel, TokenRequest, TokenResponse } from "./types.js";
import { Logger } from "./logger.js";
import { ErrorHandler, TokenCreationError, ValidationError } from "./error.js";

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
    liveKitApiKey: process.env.LIVEKIT_API_KEY!,
    liveKitApiSecret: process.env.LIVEKIT_API_SECRET!,
    clientUrl: process.env.NEXT_PUBLIC_CLIENT_URL!,
    tokenTtl: process.env.TOKEN_TTL || "60m",
    logLevel: (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO,
    logDir: process.env.LOG_DIR || "./logs",
  };
}

function validateTokenRequest(
  matchId: unknown,
  usernames: unknown
): TokenRequest {
  if (!matchId || typeof matchId !== "string") {
    throw new ValidationError("matchId must be a non-empty string");
  }

  if (!usernames || typeof usernames !== "string") {
    throw new ValidationError("usernames must be a non-empty string");
  }

  return { matchId, usernames };
}

async function createDiscussionTokens(
  matchId: string,
  usernames: string[]
): Promise<TokenResponse> {
  if (!matchId.trim()) {
    throw new ValidationError("matchId cannot be empty");
  }

  if (usernames.length === 0) {
    throw new ValidationError("usernames array cannot be empty");
  }

  logger.info(`Creating tokens for match ${matchId}`, { usernames });

  const tokens: TokenResponse = {};
  const errors: string[] = [];

  await Promise.all(
    usernames.map(async (username) => {
      try {
        const trimmedUsername = username.trim();
        if (!trimmedUsername) {
          errors.push(`Empty username provided`);
          return;
        }

        console.log(config.liveKitApiSecret);

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

  logger.info(
    `Successfully created ${Object.keys(tokens).length} tokens for match ${matchId}`
  );
  return tokens;
}

dotenv.config({ path: ".env.local" });

const config = loadConfig();
const logger = new Logger(config.logDir, config.logLevel);
const errorHandler = new ErrorHandler(logger);

const app = express();
const server = createServer(app);

app.use(express.json());

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

app.get("/tokens", async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info("Token request received", { query: req.query });

    const { matchId, usernames } = validateTokenRequest(
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

app.use(expressErrorHandler);

server.listen(config.port, () => {
  logger.info(`LiveKit token server started on port ${config.port}`);
});
