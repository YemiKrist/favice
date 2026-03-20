import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // Google configured as plain OAuth2 with explicit issuer to avoid the
    // openid-client v6 "iss mismatch" bug in next-auth@5 beta.
    {
      id: "google",
      name: "Google",
      type: "oauth",
      issuer: "https://accounts.google.com",
      clientId:     process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        url: "https://accounts.google.com/o/oauth2/v2/auth",
        params: {
          scope: "openid email profile",
          response_type: "code",
          access_type: "offline",
          prompt: "consent",
        },
      },
      token:    "https://oauth2.googleapis.com/token",
      userinfo: "https://openidconnect.googleapis.com/v1/userinfo",
      profile(profile) {
        return {
          id:    profile.sub,
          name:  profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    },

    Credentials({
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const client = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        );
        const { data, error } = await client.auth.signInWithPassword({
          email:    credentials.email    as string,
          password: credentials.password as string,
        });
        if (error || !data.user) return null;
        return {
          id:    data.user.id,
          email: data.user.email ?? "",
          name:  data.user.user_metadata?.full_name ?? data.user.email,
        };
      },
    }),
  ],

  pages: { signIn: "/login" },

  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token?.id) session.user.id = token.id as string;
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtected =
        nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/profile") ||
        nextUrl.pathname.startsWith("/invoices");
      if (isProtected) return isLoggedIn;
      return true;
    },
  },
});
