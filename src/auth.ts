import NextAuth from "next-auth";
import { providers } from "./lib/auth/providers";
import { getUser, isTokenExpired, refreshAccessToken } from "./lib/auth/utils";
import { ProviderName } from "./types/auth";
import { JWT } from "next-auth/jwt";
import { GoogleProfile } from "next-auth/providers/google";
import { TwitterProfile } from "next-auth/providers/twitter";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: providers,
  callbacks: {
    async signIn({ account, profile }) {
      try {
        console.log("Processing sign-in callback");

        if (!profile || !account) {
          console.error("OAuth profile or account missing");
          return false;
        }

        // Validate Google sign-in
        if (account.provider === "google") {
          const googleProfile = profile as GoogleProfile;
          if (!googleProfile.email) {
            console.error("Google profile missing email");
            return false;
          }
          return true;
        }

        // Validate Twitter sign-in
        if (account.provider === "twitter") {
          const twitterProfile = profile as TwitterProfile;
          if (!twitterProfile.data?.username) {
            console.error("Twitter profile missing username");
            return false;
          }
          return true;
        }

        console.error(`Unsupported provider: ${account.provider}`);
        return false;
      } catch (error) {
        console.error("Sign-in callback error:", error);
        return false;
      }
    },
    async jwt({ token, account, profile }) {
      try {
        console.log("Processing JWT callback");

        // Handle initial sign-in
        if (account && profile) {
          console.log("Initial sign-in - fetching user data");

          const user = await getUser(profile, account.provider as ProviderName);

          if (!user) {
            console.error("Failed to get user data");
            return {
              ...token,
              error: ["GetUserError"],
            } as JWT;
          }

          return {
            ...token,
            username: user.username,
            provider: account.provider as ProviderName,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            accessTokenExpiresAt: account.expires_at!,
            error: [],
          } as JWT;
        }

        // Check if we have the required token data
        if (!token.provider || !token.accessTokenExpiresAt) {
          console.error("Missing required token data");
          return {
            ...token,
            error: [...(token.error || []), "JWTError"],
          } as JWT;
        }

        // Return existing token if still valid
        if (!isTokenExpired(token)) {
          console.log("Using existing valid token");
          return token as JWT;
        }

        // Token expired - attempt refresh
        console.log("Token expired - attempting refresh");
        return await refreshAccessToken(token);
      } catch (error) {
        console.error("JWT callback error:", error);
        return {
          ...token,
          error: [...(token.error || []), "JWTError"],
        } as JWT;
      }
    },
    async session({ session, token }) {
      console.log("Processing session callback");

      if (token) {
        session.accessToken = token.accessToken;
        session.username = token.username;
        session.error = token.error || [];
      }

      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
});
