import { AuthError, ProviderName } from "@/auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number; // seconds
    error?: AuthError[];
    username?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpiresAt?: number; // seconds
    provider: ProviderName;
    error?: AuthError[];
    username?: string;
  }
}

declare module "next-auth/providers/google" {
  interface GoogleProfile {
    refreshToken?: string;
    connectedAt?: Date;
  }
}

declare module "next-auth/providers/twitter" {
  interface TwitterProfile {
    refreshToken?: string;
    connectedAt?: Date;
  }
}
