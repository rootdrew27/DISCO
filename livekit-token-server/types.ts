export enum LogLevel {
  ERROR = "ERROR",
  WARN = "WARN",
  INFO = "INFO",
  DEBUG = "DEBUG",
}

export interface Config {
  port: number;
  liveKitUrl: string;
  liveKitApiKey: string;
  liveKitApiSecret: string;
  clientUrl: string;
  tokenTtl: string;
  logLevel: LogLevel;
  logDir: string;
}

export interface TokensRequest {
  matchId: string;
  usernames: string;
}

export interface TokensResponse {
  [username: string]: string;
}

export enum Role {
  VIEWER = "viewer",
  DISCUSSOR = "discussor",
}
