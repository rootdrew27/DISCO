import { auth } from "@/auth";
import { Disco } from "./_components/disco";
import { Role } from "@/types/matches";
import { getMatchData, getRole } from "@/lib/matches/active-matches";
import { notFound } from "next/navigation";
import { getToken } from "@/lib/disco/token";

export default async function DiscoPage({
  params,
  searchParams,
}: {
  params: Promise<{ room: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { room: roomName } = await params;

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

  let { lkToken } = await searchParams;
  if (!lkToken || typeof lkToken !== "string") {
    lkToken = await getToken(matchData.id, role, session?.username); // NOTE: the invalidation caused by the fetch in this function only triggers a fast-refresh in development
  }

  return (
    <div className="h-full">
      <Disco
        session={session}
        role={role}
        lkToken={lkToken}
        matchData={matchData}
      />
    </div>
  );
}
