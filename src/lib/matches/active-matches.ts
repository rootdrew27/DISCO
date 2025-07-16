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
  const matchDataJSON = await redisClient.hGet("activeMatches", matchId);
  if (!matchDataJSON) return null;
  return JSON.parse(matchDataJSON) as MatchData;
}

export async function getRole(matchId: string, username: string) {
  try {
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
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function isDuplicate(matchId: string, username: string) {
  try {
    const result = await redisClient.hGet("activeMatches", matchId);
    if (!result) return null;
    const matchData = JSON.parse(result) as MatchData;
    return matchData.participantUsernames.includes(username);
  } catch (error) {
    console.log(error);
    throw error;
  }
}
