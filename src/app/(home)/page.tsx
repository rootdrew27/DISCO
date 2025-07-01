import { auth } from "@/auth";
import Navbar from "./_components/navbar";

export default async function Home() {
  const session = await auth();

  return (
    <div>
      <Navbar session={session} />
      <div className="flex flex-col p-8">
        <p>{session ? session.username : "No user signed in"}</p>
        {!!(session?.error?.length && session.error.length > 0) && (
          <p>Error: {session.error}</p>
        )}
      </div>
    </div>
  );
}
