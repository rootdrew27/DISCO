"use client";

import { signOut } from "next-auth/react";
import { useEffect } from "react";
import { Session } from "next-auth";

export function SessionManager({ session }: { session: Session | null }) {
  useEffect(() => {
    if (session?.error?.includes("RefreshTokenError")) {
      signOut();
    }
  }, [session?.error]);

  return null;
}
