import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN || "shopee.com";
const nextAuthSecret =
  process.env.NEXTAUTH_SECRET ||
  process.env.AUTH_SECRET ||
  (process.env.NODE_ENV === "development" ? "local-dev-secret-only-for-front-tests" : undefined);

export const authOptions: NextAuthOptions = {
  secret: nextAuthSecret,
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? ""
    })
  ],
  callbacks: {
    async signIn({ profile }) {
      const email = profile?.email?.toLowerCase() ?? "";
      return email.endsWith(`@${allowedDomain}`);
    },
    async session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = token.email;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
    error: "/login"
  }
};
