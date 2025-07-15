import { auth } from "@/auth";
import Navbar from "./_components/navbar";
import { JoinDisco } from "./_components/join-disco";
import { ActiveMatches } from "@/components/active-matches";
import { getActiveMatches } from "@/lib/matches/active-matches";
import { Toaster } from "sonner";

export default async function Home() {
  const session = await auth();
  const activeMatches = await getActiveMatches();

  return (
    <div className="flex flex-col">
      <Navbar session={session} />
      <div className="flex flex-col p-8">
        <p>{session ? session.username : "No user signed in"}</p>
        {!!(session?.error?.length && session.error.length > 0) && (
          <p>Error: {session.error}</p>
        )}
      </div>
      <div>
        <ActiveMatches matches={activeMatches} />
      </div>
      {session && (
        <div>
          <JoinDisco username={session.username} />
        </div>
      )}
      <Toaster />
    </div>
  );
}
