"use server";

import { Role } from "@/types/matches";

export async function getToken(matchId: string, role: Role, username?: string) {
  let url;

  try {
    const params = new URLSearchParams({
      matchId: matchId,
      role: role,
      username: username ?? "",
    });
    url = new URL(`/token?${params}`, process.env.LK_TOKEN_SERVER_URL);

    const res = await fetch(url);

    const { token: lkToken } = await res.json();
    return lkToken as string;
  } catch (error) {
    console.log(error);
    throw error;
  }
}
