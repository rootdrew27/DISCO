import { auth } from "@/auth";
import Navbar from "./_components/navbar";

export default async function Home() {
  const session = await auth();

  return (
    <div>
      <Navbar session={session} />
      <div className="flex p-8">
        <p>{session ? session.username : "No user signed in"}</p>
        {session?.error && <p>Error: {session.error}</p>}
      </div>
    </div>
  );
}
