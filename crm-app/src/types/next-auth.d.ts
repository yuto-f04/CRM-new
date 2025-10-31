import type { DefaultSession, DefaultUser } from "next-auth";

type AppRole = "admin" | "manager" | "member" | "viewer";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id: string;
      role?: AppRole;
    };
  }

  interface User extends DefaultUser {
    role?: AppRole;
  }
}

declare module "next-auth/core/types" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id: string;
      role?: AppRole;
    };
  }

  interface User extends DefaultUser {
    role?: AppRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: AppRole;
  }
}
