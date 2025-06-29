import Google from "next-auth/providers/google";
import Twitter from "next-auth/providers/twitter";

const googleProvider = Google({
  clientId: process.env.AUTH_GOOGLE_ID,
  clientSecret: process.env.AUTH_GOOGLE_SECRET,
  authorization: {
    params: {
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
      response_type: "code",
    },
  },
});

const twitterProvider = Twitter({
  clientId: process.env.AUTH_TWITTER_ID,
  clientSecret: process.env.AUTH_TWITTER_SECRET,
  id: "twitter",
  name: "Twitter",
  checks: ["pkce", "state"],
  authorization:
    "https://x.com/i/oauth2/authorize?scope=users.read tweet.read offline.access",
  token: "https://api.x.com/2/oauth2/token",
  userinfo: "https://api.x.com/2/users/me?user.fields=profile_image_url",
  style: { bg: "#1da1f2", text: "#fff" },
});

export const providers = [googleProvider, twitterProvider];

// profile({ data }) {
//   return {
//     id: data.id,
//     username: data.username,
//     name: data.name,
//     email: data.email ?? null,
//     image: data.profile_image_url,
//   };
// },
