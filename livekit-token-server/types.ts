export enum LogLevel {
  ERROR = "ERROR",
  WARN = "WARN",
  INFO = "INFO",
  DEBUG = "DEBUG",
}

export interface Config {
  port: number;
  liveKitApiKey: string;
  liveKitApiSecret: string;
  clientUrl: string;
  tokenTtl: string;
  logLevel: LogLevel;
  logDir: string;
}

export interface TokenRequest {
  matchId: string;
  usernames: string;
}

export interface TokenResponse {
  [username: string]: string;
}
