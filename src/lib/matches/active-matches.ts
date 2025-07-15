"use server";

import { Role } from "@/types/matches";
import { createClient } from "redis";

const redisClient = createClient({
  url: "redis://localhost:6379",
});

redisClient.on("error", (err) => console.log("Redis Client Error", err));

await redisClient.connect();

export async function getActiveMatches() {
  const matchesMap = await redisClient.hGetAll("activeMatches");

  const matches: MatchData[] = [];
  for (const matchData of Object.values(matchesMap)) {
    matches.push(JSON.parse(matchData));
  }

  return matches;
}

export async function getMatchData(matchId: string) {
  console.log(matchId);
  const matchDataJSON = await redisClient.hGet("activeMatches", matchId);
  if (!matchDataJSON) return null;
  return JSON.parse(matchDataJSON) as MatchData;
}

export async function getRole(matchId: string, username: string) {
  if (matchId && username) {
    const matchDataJSON = await redisClient.hGet("activeMatches", matchId);
    if (!matchDataJSON) return null;
    if (
      (JSON.parse(matchDataJSON) as MatchData).participantUsernames.includes(
        username
      )
    ) {
      return Role.DISCUSSOR;
    } else {
      return Role.VIEWER;
    }
  }
  throw new Error("MatchId and username must be specified when getting role.");
}
