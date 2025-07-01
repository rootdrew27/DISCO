"use client";

import { SessionProvider } from "next-auth/react";
import { Session } from "next-auth";
import { SessionManager } from "./session-manager";

export function AuthProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <SessionProvider session={session}>
      <SessionManager session={session} />
      {children}
    </SessionProvider>
  );
}
