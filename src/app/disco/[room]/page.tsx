import { auth } from "@/auth";
import { DiscoAsDebater } from "./_components/disco-as-debater";
import { Role } from "@/types/matches";
import { getMatchData, getRole } from "@/lib/matches/active-matches";
import { notFound } from "next/navigation";
import { DiscoAsViewer } from "./_components/disco-as-viewer";

export default async function DiscoPage({
  params,
}: {
  params: Promise<{ room: string }>;
}) {
  const { room: roomName } = await params;

  const matchData = await getMatchData(roomName);

  if (!matchData) {
    notFound();
  }

  const session = await auth();

  let role: Role | null;
  // Get the users role (NOTE that this logic enables the session! prop below)
  if (session) {
    role = await getRole(matchData, session.username);
    if (!role) {
      notFound();
    }
  } else {
    role = Role.VIEWER;
  }

  const isStaging =
    15 - Math.floor((Date.now() - matchData.startedAt) / 1000) > 0;

  return (
    <div className="h-full">
      {role === Role.DEBATER ? (
        <DiscoAsDebater
          session={session!}
          matchData={matchData}
          role={role}
          isStaging={isStaging}
        />
      ) : (
        <DiscoAsViewer session={session} matchData={matchData} role={role} />
      )}
    </div>
  );
}
