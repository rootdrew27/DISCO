import { GoogleProfile } from "next-auth/providers/google";
import { TwitterProfile } from "next-auth/providers/twitter";

export type ProviderName = "google" | "twitter";

export type ProviderProfile = GoogleProfile | TwitterProfile;

export type AuthError =
  | "RefreshTokenError"
  | "SignInError"
  | "JWTError"
  | "GetUserError";

export interface SignInRequest {
  profile: TwitterProfile | GoogleProfile; // You might want to type this more specifically
  provider: ProviderName;
}

export interface SignInResponse {
  user: User;
}

export interface RefreshTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}

export interface User {
  _id?: string;
  username?: string;
  accounts: ProviderProfile[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  profile?: {
    bio?: string;
    interests?: string[];
    expertiseAreas?: string[];
  };
  stats?: {
    discussionsParticipated: number;
    debatesWon: number;
    debatesLost: number;
    reputationScore: number;
  };
}
