import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hasAtLeast } from "@/lib/rbac";
import { requireSessionUser, UnauthorizedError } from "@/lib/session-user";

function mapAccount(account: {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  phone: string | null;
  created_at: Date;
  updated_at: Date;
  owner: { id: string; name: string | null; email: string } | null;
  _count: { contacts: number; cases: number; projects: number };
}) {
  return {
    ...account,
    owner: account.owner
      ? {
          id: account.owner.id,
          name: account.owner.name,
          email: account.owner.email,
        }
      : null,
    counts: {
      contacts: account._count.contacts,
      cases: account._count.cases,
      projects: account._count.projects,
    },
  };
}

export async function GET() {
  try {
    await requireSessionUser();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  const accounts = await prisma.accounts.findMany({
    select: {
      id: true,
      name: true,
      industry: true,
      website: true,
      phone: true,
      created_at: true,
      updated_at: true,
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { contacts: true, cases: true, projects: true } },
    },
    orderBy: [{ updated_at: "desc" }],
  });

  return NextResponse.json({
    accounts: accounts.map(mapAccount),
  });
}

export async function POST(req: Request) {
  let session: Awaited<ReturnType<typeof requireSessionUser>>["session"];
  let currentUser: Awaited<ReturnType<typeof requireSessionUser>>["user"];
  try {
    const result = await requireSessionUser();
    session = result.session;
    currentUser = result.user;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  if (!hasAtLeast(session, "member")) {
    return NextResponse.json({ error: "Insufficient role" }, { status: 403 });
  }

  const payload = await req.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const industryRaw = typeof payload.industry === "string" ? payload.industry.trim() : undefined;
  const websiteRaw = typeof payload.website === "string" ? payload.website.trim() : undefined;
  const phoneRaw = typeof payload.phone === "string" ? payload.phone.trim() : undefined;
  const ownerIdRaw = typeof payload.owner_id === "string" ? payload.owner_id.trim() : undefined;

  const ownerId = ownerIdRaw && ownerIdRaw.length ? ownerIdRaw : currentUser.id;

  const owner = await prisma.users.findUnique({
    where: { id: ownerId },
    select: { id: true },
  });
  if (!owner) {
    return NextResponse.json({ error: "owner_id is invalid" }, { status: 400 });
  }

  try {
    const account = await prisma.accounts.create({
      data: {
        name,
        owner_id: owner.id,
        ...(industryRaw !== undefined ? { industry: industryRaw.length ? industryRaw : null } : {}),
        ...(websiteRaw !== undefined ? { website: websiteRaw.length ? websiteRaw : null } : {}),
        ...(phoneRaw !== undefined ? { phone: phoneRaw.length ? phoneRaw : null } : {}),
      },
      select: {
        id: true,
        name: true,
        industry: true,
        website: true,
        phone: true,
        created_at: true,
        updated_at: true,
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { contacts: true, cases: true, projects: true } },
      },
    });

    return NextResponse.json({ account: mapAccount(account) }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Account name must be unique" }, { status: 409 });
    }
    throw error;
  }
}

