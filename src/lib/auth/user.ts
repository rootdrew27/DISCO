import { ProviderProfile, User } from "@/types/auth";
import { generateUsername } from "./utils";
import { getUsersCollection } from "@/lib/mongodb/connect";
import { TwitterProfile } from "next-auth/providers/twitter";
import { GoogleProfile } from "next-auth/providers/google";
import { WriteError } from "mongodb";

export async function getUser(
  profile: ProviderProfile,
  provider: "twitter" | "google"
) {
  const users = await getUsersCollection();
  try {
    if (provider === "google") {
      const { sub } = profile as GoogleProfile;

      // Try to find existing user by Google account
      return await users.findOne({
        accounts: {
          $elemMatch: {
            provider: provider,
            sub: sub,
          },
        },
      });
    } else if (provider === "twitter") {
      const { id } = (profile as TwitterProfile).data;

      // Try to find existing user by Twitter account
      return await users.findOne({
        accounts: {
          $elemMatch: {
            provider: provider,
            "data.id": id,
          },
        },
      });
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }
  } catch (error) {
    const msg = "Error getting user.";
    console.error(msg, error);
    throw new Error(msg);
  }
}

export async function createNewUser(
  profile: ProviderProfile,
  provider: "google" | "twitter"
) {
  try {
    const users = await getUsersCollection();
    const genUsername = generateUsername();

    const newUserData = {
      username: genUsername,
      accounts: [{ ...profile, provider: provider, connectedAt: new Date() }],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      profile: {
        bio: "",
        interests: [],
        expertiseAreas: [],
      },
      stats: {
        discussionsParticipated: 0,
        debatesWon: 0,
        debatesLost: 0,
        reputationScore: 0,
      },
    } as User;

    const result = await users.insertOne(newUserData);
    return { _id: result.insertedId, ...newUserData };
  } catch (error) {
    if (error instanceof WriteError && error.code === 11000) {
      console.log(
        "Unique constraint violation. This is ONLY ok if the username caused it. The createNewUser function will be called again."
      );
      console.log(error);
      createNewUser(profile, provider);
    }
    const msg = "Error creating new user.";
    console.error(msg, error);
    throw new Error(msg);
  }
}
