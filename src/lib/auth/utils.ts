import { Profile } from "next-auth";
import { JWT } from "next-auth/jwt";
import type {
  ProviderName,
  SignInResponse,
  RefreshTokenResponse,
  User,
} from "@/types/auth";

/**
 * Fetches or creates a user via the internal API
 */
export async function getUser(
  profile: Profile,
  provider: ProviderName
): Promise<User | null> {
  try {
    const response = await fetch(
      `${process.env.AUTH_URL}/api/internal/sign-in`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.INTERNAL_API_KEY!,
        },
        body: JSON.stringify({ profile, provider }),
      }
    );

    if (!response.ok) {
      console.error("Sign-in API error:", await response.text());
      return null;
    }

    const data: SignInResponse = await response.json();
    return data.user;
  } catch (error) {
    console.error("Error calling sign-in API:", error);
    return null;
  }
}

/**
 * Configuration for OAuth token refresh endpoints
 */
const TOKEN_ENDPOINTS = {
  google: {
    url: "https://oauth2.googleapis.com/token",
    clientId: () => process.env.AUTH_GOOGLE_ID!,
    clientSecret: () => process.env.AUTH_GOOGLE_SECRET!,
  },
  twitter: {
    url: "https://api.x.com/2/oauth2/token",
    clientId: () => process.env.AUTH_TWITTER_ID!,
    clientSecret: () => process.env.AUTH_TWITTER_SECRET!,
  },
};

/**
 * Refreshes an expired access token
 */
export async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    if (!token.refreshToken) {
      throw new Error("No refresh token available");
    }

    const config = TOKEN_ENDPOINTS[token.provider as ProviderName];

    if (!config) {
      throw new Error(`Unsupported provider: ${token.provider}`);
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
    };

    // Twitter requires Basic Auth, Google does not
    if (token.provider === "twitter") {
      const credentials = Buffer.from(
        `${config.clientId()}:${config.clientSecret()}`
      ).toString("base64");
      headers["Authorization"] = `Basic ${credentials}`;
    }

    const body = new URLSearchParams({
      client_id: config.clientId(),
      client_secret: config.clientSecret(),
      refresh_token: token.refreshToken,
      grant_type: "refresh_token",
    });

    const response = await fetch(config.url, {
      method: "POST",
      headers,
      body,
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Token refresh failed for ${token.provider}:`, errorData);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const refreshedTokens: RefreshTokenResponse = await response.json();

    if (!refreshedTokens.access_token) {
      throw new Error("No access token in refresh response");
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpiresAt:
        Math.floor(Date.now() / 1000) + (refreshedTokens.expires_in || 3600),
      refreshToken: refreshedTokens.refresh_token || token.refreshToken,
      error: [],
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Token refresh failed:", errorMessage);

    return {
      ...token,
      error: [...(token.error || []), "RefreshTokenError"],
    };
  }
}

/**
 * Checks if an access token is expired
 */
export function isTokenExpired(token: JWT): boolean {
  if (!token.accessTokenExpiresAt) {
    return false;
  }
  // Add 5 minute buffer to prevent edge cases
  const bufferTime = 5 * 60;
  return Date.now() / 1000 >= token.accessTokenExpiresAt - bufferTime;
}

/**
 * Revokes a Google token
 */
export async function revokeToken(token: string): Promise<boolean> {
  try {
    const response = await fetch("https://oauth2.googleapis.com/revoke", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        token: token,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Token revocation failed:", errorText);
      return false;
    }

    console.log("Token revoked successfully");
    return true;
  } catch (error) {
    console.error("Error revoking token:", error);
    return false;
  }
}
