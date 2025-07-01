import { SignIn } from "@/components/auth/sign-in";
import { SignOut } from "@/components/auth/sign-out";
import { Session } from "next-auth";

export default function Navbar({ session }: { session: Session | null }) {
  return <div className="flex">{session ? <SignOut /> : <SignIn />}</div>;
}
