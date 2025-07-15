export enum Role {
  VIEWER = "viewer",
  DISCUSSOR = "discussor",
}

export enum QueueStatus {
  IDLE = "idle",
  QUEUED = "queued",
  MATCH_FOUND = "match_found",
  MATCH_READY = "match_ready",
  ACCEPTING = "accepting",
  CANCELLED = "cancelled",
}

export enum DiscussionFormat {
  CASUAL = "casual",
  FORMAL = "formal",
  PANEL = "panel",
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
