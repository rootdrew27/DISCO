import { auth } from "@/auth";
import { Disco } from "./_components/disco";
import { Role } from "@/types/matches";
import { getMatchData, getRole } from "@/lib/matches/active-matches";
import { notFound } from "next/navigation";

export default async function DiscoPage({
  params,
  searchParams,
}: {
  params: Promise<{ room: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { room: roomName } = await params;

  let { lkToken, opponents } = await searchParams;
  if (!lkToken || typeof lkToken !== "string") {
    // TODO: get Token
    lkToken = "";
  }

  if (!opponents) {
    notFound();
  }

  if (typeof opponents === "string") {
    opponents = [opponents];
  }

  const matchData = await getMatchData(roomName);

  if (!matchData) {
    notFound();
  }

  const session = await auth();

  let role: Role | null;
  if (session) {
    role = await getRole(roomName, session.username);
    if (!role) {
      notFound();
    }
  } else {
    role = Role.VIEWER;
  }

  return (
    <Disco
      session={session}
      role={role}
      lkToken={lkToken}
      matchData={matchData}
      opponents={opponents}
    />
  );
}
