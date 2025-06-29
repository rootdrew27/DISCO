import { signIn } from "@/auth";

export default function SignIn() {
  return (
    <div className="flex gap-2">
      <form
        action={async () => {
          "use server";
          await signIn("google");
        }}
      >
        <button type="submit">Sign in with Google</button>
      </form>
      <form
        action={async () => {
          "use server";
          await signIn("twitter");
        }}
      >
        <button type="submit">Sign in with X</button>
      </form>
    </div>
  );
}
