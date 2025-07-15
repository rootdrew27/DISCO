import { JWT } from "next-auth/jwt";

export enum Role {
  VIEWER = "viewer",
  DISCUSSOR = "discussor",
}

export enum LogLevel {
  ERROR = "ERROR",
  WARN = "WARN",
  INFO = "INFO",
  DEBUG = "DEBUG",
}

export enum DiscussionFormat {
  CASUAL = "casual",
  FORMAL = "formal",
  PANEL = "panel",
}

export enum MatchResult {
  SUCCESS = "success",
  EXPIRED = "expired",
  REJECTED = "rejected",
  ERROR = "error",
}

export interface Config {
  port: number;
  clientUrl: string;
  authSecret: string;
  liveKitTokenServerUrl: string;
  matchExpireTime: number;
  logLevel: LogLevel;
  logDir: string;
}

export interface LiveKitTokenResponse {
  [username: string]: string;
}

export interface MatchAcceptanceResult {
  matchId: string;
  opponents: string[];
  lkToken: string;
}

export interface MatchPreferences {
  format: DiscussionFormat;
  topic: string;
  maxWaitTime?: number;
  expertiseLevel?: number;
}

export interface QueuedUser {
  userId: string;
  username: string;
  socketId: string;
  preferences: MatchPreferences;
  joinedAt: Date;
}

export interface MatchData {
  id: string;
  participants: string[];
  participantUsernames: string[];
  topic: string;
  format: DiscussionFormat;
  createdAt: Date;
  expiresAt: Date;
}

export interface PendingMatch {
  match: MatchData;
  acceptedBy: string[];
  rejectedBy: string[];
}

export interface AuthJWT extends JWT {
  username: string;
}

export interface UserData {
  id: string;
  token: AuthJWT;
  isInPendingMatch: boolean;
}
