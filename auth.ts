import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { client } from "./sanity/lib/client";
import { AUTHTOR_BY_GITHUB_ID_QUERY } from "./sanity/lib/queries";
import { writeClient } from "./sanity/lib/write-client";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [GitHub],
  callbacks: {
    async signIn({ user, profile }: { user: any; profile?: any }) {
      if (!profile) return false;

      const { id, login, bio } = profile;
      const { name, email, image } = user;

      const existingUser = await client
        .withConfig({ useCdn: false })
        .fetch(AUTHTOR_BY_GITHUB_ID_QUERY, {
          id,
        });
      if (!existingUser) {
        await writeClient.create({
          _type: "author",
          id,
          name,
          email,
          username: login,
          image,
          bio: bio || "",
        });
      }
      return true;
    },
    async jwt({
      token,
      account,
      profile,
    }: {
      token: any;
      account?: any;
      profile?: any;
    }) {
      if (account && profile) {
        const user = await client
          .withConfig({ useCdn: false })
          .fetch(AUTHTOR_BY_GITHUB_ID_QUERY, {
            id: profile?.id,
          });
        token.id = user?._id;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token.id) {
        Object.assign(session, { id: token.id });
      }
      return session;
    },
  },
});
