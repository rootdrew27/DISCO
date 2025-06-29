import { auth } from "@/auth";
import Navbar from "./_components/navbar";

export default async function Home() {
  const session = await auth();

  if (session) {
    if (session.error) {
      console.log("Errors propogated from NextAuth", session.error);
    }
  }

  return (
    <div>
      <Navbar />
      <div className="flex p-8">
        <p>{session ? session.username : "No user signed in"}</p>
      </div>
    </div>
  );
}
