import { auth } from "@/auth";
import SignIn from "./sign-in";
import { SignOut } from "./sign-out";

export default async function Navbar() {
  const session = await auth();

  return <div className="flex">{session ? <SignOut /> : <SignIn />}</div>;
}
