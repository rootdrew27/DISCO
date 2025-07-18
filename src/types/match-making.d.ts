// interface IMatchmaker {
//   joinQueue(
//     userId: string,
//     preferences: MatchPreferences
//   ): Promise<QueueResult>;
//   leaveQueue(userId: string): Promise<void>;
//   acceptMatch(matchId: string, userId: string): Promise<MatchAcceptResult>;
//   rejectMatch(matchId: string, userId: string): Promise<void>;
// }

interface MatchPreferences {
  format: "casual" | "formal" | "panel";
  topic: string;
  maxWaitTime?: number;
  expertiseLevel?: number;
}

interface MatchData {
  id: string;
  participants: string[];
  participantUsernames: string[];
  topic: string;
  format: string;
  createdAt: number; // ms
  expiresAt: number; // ms
  startedAt: number; // ms
}
