import type { NextAuthOptions, Session } from "next-auth";
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
        password: { label: "Password", type: "password" },
      },
      async authorize(c) {
        const email = c?.email as string | undefined;
        const password = c?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.users.findUnique({ where: { email } });
        if (!user?.password_hash || user.is_active === false) return null;

        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) return null;

        return {
          id: user.id,
          name: user.name ?? null,
          email: user.email ?? null,
          // next-auth User type allows arbitrary props
          role: user.role,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // @ts-ignore
        token.role = (user as any).role ?? "member";
      }
      return token;
    },
    async session({ session, token }) {
      (session as Session & { user: any }).user = {
        id: (token.sub as string) || "",
        name: session.user?.name ?? null,
        email: session.user?.email ?? null,
        // @ts-ignore
        role: token.role ?? "member",
      };
      return session;
    },
  },
  // NEXTAUTH_SECRET must be set in .env
};