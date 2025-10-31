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
  account_id: true,
  owner_id: true,
  first_name: true,
  last_name: true,
  email: true,
  phone: true,
  created_at: true,
  updated_at: true,
  account: { select: { id: true, name: true } },
  owner: { select: { id: true, name: true, email: true } },
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
  _count: { select: { cases: true } },
} satisfies Prisma.contactsSelect;

type ContactDetailPayload = Prisma.contactsGetPayload<{ select: typeof baseSelect }>;

function serialize(contact: ContactDetailPayload | null) {
  if (!contact) return null;
  const { account, owner, _count, ...rest } = contact;
  return {
    ...rest,
    account: account
      ? {
          id: account.id,
          name: account.name,
        }
      : null,
    owner: owner
      ? {
          id: owner.id,
          name: owner.name,
          email: owner.email,
        }
      : null,
    counts: {
      cases: _count.cases,
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

  const contact = await prisma.contacts.findUnique({
    where: { id: params.id },
    select: baseSelect,
  });
  if (!contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  return NextResponse.json({ contact: serialize(contact) });
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

  const existing = await prisma.contacts.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  const payload = await req.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (payload.first_name !== undefined) {
    const firstName = typeof payload.first_name === "string" ? payload.first_name.trim() : "";
    if (!firstName) {
      return NextResponse.json({ error: "first_name must not be empty" }, { status: 400 });
    }
    data.first_name = firstName;
  }

  if (payload.last_name !== undefined) {
    const lastName = typeof payload.last_name === "string" ? payload.last_name.trim() : "";
    if (!lastName) {
      return NextResponse.json({ error: "last_name must not be empty" }, { status: 400 });
    }
    data.last_name = lastName;
  }

  if (payload.email !== undefined) {
    const email = typeof payload.email === "string" ? payload.email.trim() : "";
    data.email = email.length ? email : null;
  }

  if (payload.phone !== undefined) {
    const phone = typeof payload.phone === "string" ? payload.phone.trim() : "";
    data.phone = phone.length ? phone : null;
  }

  if (payload.account_id !== undefined) {
    const accountId = typeof payload.account_id === "string" ? payload.account_id.trim() : "";
    if (!accountId) {
      data.account_id = null;
    } else {
      const account = await prisma.accounts.findUnique({
        where: { id: accountId },
        select: { id: true },
      });
      if (!account) {
        return NextResponse.json({ error: "account_id is invalid" }, { status: 400 });
      }
      data.account_id = account.id;
    }
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
    const contact = await prisma.contacts.update({
      where: { id: params.id },
      data,
      select: baseSelect,
    });
    return NextResponse.json({ contact: serialize(contact) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "email must be unique" }, { status: 409 });
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

  const contact = await prisma.contacts.findUnique({
    where: { id: params.id },
    select: { id: true, _count: { select: { cases: true } } },
  });
  if (!contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  if (contact._count.cases > 0) {
    return NextResponse.json(
      {
        error: "Contact has related records",
        blockers: [{ type: "cases", count: contact._count.cases }],
      },
      { status: 409 },
    );
  }

  await prisma.contacts.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
