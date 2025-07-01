import { signIn } from "@/auth";
import { redirect } from "next/navigation";

export function SignIn() {
  return (
    <form
      action={async () => {
        "use server";
        const signInUrl = await signIn(undefined, { redirect: false });
        const signInUrlParams = new URL(signInUrl).searchParams;
        const callbackUrl = signInUrlParams.get("callbackUrl") ?? "/";

        redirect(`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      }}
    >
      <button type="submit">Sign in</button>
    </form>
  );
}
