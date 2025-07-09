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
