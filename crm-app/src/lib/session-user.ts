import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export class UnauthorizedError extends Error {
  status = 401;
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export async function requireSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new UnauthorizedError();
  }

  const user = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  if (!user) {
    throw new UnauthorizedError();
  }

  return { session: session as Session & { user: Session["user"] & { role: string } }, user };
}
