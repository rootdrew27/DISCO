import { ConnectionDetails } from "@/types/livekit";
import { Role } from "@/types/matches";
import {
  AccessToken,
  AccessTokenOptions,
  VideoGrant,
} from "livekit-server-sdk";
import { v4 as uuid } from "uuid";
import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

// const COOKIE_KEY = ""

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const roomName = request.nextUrl.searchParams.get("roomName");
    const username = request.nextUrl.searchParams.get("username");
    const role = request.nextUrl.searchParams.get("role");
    const metadata = request.nextUrl.searchParams.get("metadata") ?? "";
    // const region = request.nextUrl.searchParams.get("region");
    if (!LIVEKIT_URL) {
      throw new Error("LIVEKIT_URL is not defined");
    }
    // let curCookieValue = request.cookies.get(COOKIE_KEY)?.value;

    if (typeof roomName !== "string") {
      return new NextResponse("Missing required query parameter: roomName", {
        status: 400,
      });
    }
    if (typeof role !== "string") {
      return new NextResponse("Missing required query parameter: role", {
        status: 400,
      });
    }
    if (typeof username !== "string") {
      return new NextResponse("Missing required query parameter: username", {
        status: 400,
      });
    }
    if (role === Role.DEBATER) {
      if (!username.trim()) {
        return new NextResponse(
          "The username can not be an empty string for debaters",
          { status: 400 }
        );
      }
    }

    const participantToken = await createParticipantToken(
      {
        identity: !!username ? username : uuid(),
        name: username,
        metadata,
      },
      roomName,
      role
    );

    // Return connection details
    const data: ConnectionDetails = {
      serverUrl: LIVEKIT_URL,
      roomName: roomName,
      participantToken: participantToken,
    };
    return new NextResponse(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        // "Set-Cookie": `${COOKIE_KEY}=${randomParticipantPostfix}; Path=/; HttpOnly; SameSite=Strict; Secure; Expires=${getCookieExpirationTime()}`,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      console.log(error);
      return new NextResponse(error.message, { status: 500 });
    }
  }
}

async function createParticipantToken(
  userInfo: AccessTokenOptions,
  roomName: string,
  role: string
) {
  const at = new AccessToken(API_KEY, API_SECRET, userInfo);
  at.ttl = "5m";

  let grant: VideoGrant;

  if (role === Role.DEBATER) {
    grant = {
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
    };
  } else if (role === Role.VIEWER) {
    grant = {
      room: roomName,
      roomJoin: true,
      canSubscribe: true,
      canPublishData: true, // for chatting
    };
  } else {
    throw new Error(`Invalid Role (${role})`);
  }

  at.addGrant(grant);
  return await at.toJwt();
}
