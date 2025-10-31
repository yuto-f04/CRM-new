import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hasAtLeast } from "@/lib/rbac";
import { requireSessionUser, UnauthorizedError } from "@/lib/session-user";

type RouteParams = {
  params: { id: string };
};

const baseSelect = {
  id: true,
  name: true,
  industry: true,
  website: true,
  phone: true,
  created_at: true,
  updated_at: true,
  owner: { select: { id: true, name: true, email: true } },
  _count: { select: { contacts: true, cases: true, projects: true } },
  contacts: {
    select: {
      id: true,
      first_name: true,
      last_name: true,
      email: true,
      phone: true,
      created_at: true,
      updated_at: true,
    },
    orderBy: { created_at: "desc" },
  },
  projects: {
    select: {
      id: true,
      name: true,
      key: true,
      created_at: true,
      updated_at: true,
    },
    orderBy: { created_at: "desc" },
  },
  cases: {
    select: {
      id: true,
      title: true,
      stage: true,
      created_at: true,
      updated_at: true,
    },
    orderBy: { created_at: "desc" },
  },
} satisfies Prisma.accountsSelect;

type AccountDetailPayload = Prisma.accountsGetPayload<{ select: typeof baseSelect }>;

function serializeAccount(account: AccountDetailPayload | null) {
  if (!account) return null;
  const { _count, owner, ...rest } = account;
  return {
    ...rest,
    owner: owner
      ? {
          id: owner.id,
          name: owner.name,
          email: owner.email,
        }
      : null,
    counts: {
      contacts: _count.contacts,
      cases: _count.cases,
      projects: _count.projects,
    },
  };
}

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    await requireSessionUser();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  const account = await prisma.accounts.findUnique({
    where: { id: params.id },
    select: baseSelect,
  });

  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  return NextResponse.json({ account: serializeAccount(account) });
}

export async function PATCH(req: Request, { params }: RouteParams) {
  let session;
  let currentUser;
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

  const accountId = params.id;
  const existing = await prisma.accounts.findUnique({
    where: { id: accountId },
    select: {
      id: true,
    },
  });
  if (!existing) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const payload = await req.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (payload.name !== undefined) {
    const name = typeof payload.name === "string" ? payload.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "name must not be empty" }, { status: 400 });
    }
    data.name = name;
  }

  if (payload.industry !== undefined) {
    const industry = typeof payload.industry === "string" ? payload.industry.trim() : "";
    data.industry = industry.length ? industry : null;
  }

  if (payload.website !== undefined) {
    const website = typeof payload.website === "string" ? payload.website.trim() : "";
    data.website = website.length ? website : null;
  }

  if (payload.phone !== undefined) {
    const phone = typeof payload.phone === "string" ? payload.phone.trim() : "";
    data.phone = phone.length ? phone : null;
  }

  if (payload.owner_id !== undefined) {
    const ownerId = typeof payload.owner_id === "string" ? payload.owner_id.trim() : "";
    const resolvedOwnerId = ownerId.length ? ownerId : currentUser.id;
    const owner = await prisma.users.findUnique({
      where: { id: resolvedOwnerId },
      select: { id: true },
    });
    if (!owner) {
      return NextResponse.json({ error: "owner_id is invalid" }, { status: 400 });
    }
    data.owner_id = owner.id;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  try {
    const account = await prisma.accounts.update({
      where: { id: accountId },
      data,
      select: baseSelect,
    });
    return NextResponse.json({ account: serializeAccount(account) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Account name must be unique" }, { status: 409 });
    }
    throw error;
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  let session;
  try {
    ({ session } = await requireSessionUser());
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  if (!hasAtLeast(session, "member")) {
    return NextResponse.json({ error: "Insufficient role" }, { status: 403 });
  }

  const account = await prisma.accounts.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      _count: { select: { contacts: true, projects: true, cases: true } },
    },
  });

  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const blockers = Object.entries(account._count).filter(([, value]) => value > 0);
  if (blockers.length > 0) {
    return NextResponse.json(
      {
        error: "Account has related records",
        blockers: blockers.map(([key, value]) => ({ type: key, count: value })),
      },
      { status: 409 },
    );
  }

  await prisma.accounts.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
