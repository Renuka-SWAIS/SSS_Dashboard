import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Google({
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  pages: {
    signIn: "/",
    error: "/",
  },
  callbacks: {
    signIn({ account, profile }) {
      if (account?.provider !== "google") {
        return false;
      }

      const email =
        typeof profile?.email === "string" ? profile.email.toLowerCase() : "";
      const isVerified = profile?.email_verified !== false;

      return isVerified && email.endsWith("@gmail.com");
    },
    authorized({ auth: session, request }) {
      const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");
      return isDashboard ? !!session : true;
    },
  },
});
