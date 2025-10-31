import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.users.findUnique({ where: { email: credentials.email } });
        if (!user || !user.password_hash) return null;
        const ok = await bcrypt.compare(credentials.password, user.password_hash);
        if (!ok) return null;
        return {
          id: String(user.id),
          name: user.name ?? "",
          email: user.email,
          role: (user as any).role ?? "member"
        } as any;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as any).role ?? "member";
      return token;
    },
    async session({ session, token }) {
      (session as any).user.role = (token as any).role ?? "member";
      return session;
    }
  },
  pages: { signIn: "/login" }
};
