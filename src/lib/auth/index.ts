import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import Credentials from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: schema.users,
    accountsTable: schema.accounts,
    sessionsTable: schema.sessions,
    verificationTokensTable: schema.verificationTokens,
  }),
  session: { strategy: "jwt" },
  providers: [
    // For MVP: simple credentials provider
    // Replace with OAuth providers (Google, GitHub, etc.) for production
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        name: { label: "Name", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        const email = credentials.email as string;
        const name = (credentials.name as string) || email.split("@")[0];

        // Find or create user
        const existing = await db.query.users.findFirst({
          where: (u, { eq }) => eq(u.email, email),
        });

        if (existing) return { id: existing.id, email: existing.email, name: existing.name };

        const [newUser] = await db
          .insert(schema.users)
          .values({ email, name })
          .returning();

        return { id: newUser.id, email: newUser.email, name: newUser.name };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/onboarding",
  },
});
