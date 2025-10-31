import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hasAtLeast } from "@/lib/rbac";
import { requireSessionUser, UnauthorizedError } from "@/lib/session-user";

function mapContact(contact: {
  id: string;
  account_id: string | null;
  owner_id: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  created_at: Date;
  updated_at: Date;
  account: { id: string; name: string } | null;
  owner: { id: string; name: string | null; email: string } | null;
  _count: { cases: number };
}) {
  return {
    ...contact,
    account: contact.account
      ? {
          id: contact.account.id,
          name: contact.account.name,
        }
      : null,
    owner: contact.owner
      ? {
          id: contact.owner.id,
          name: contact.owner.name,
          email: contact.owner.email,
        }
      : null,
    counts: {
      cases: contact._count.cases,
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

  const contacts = await prisma.contacts.findMany({
    select: {
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
      _count: { select: { cases: true } },
    },
    orderBy: [{ updated_at: "desc" }],
  });

  return NextResponse.json({
    contacts: contacts.map(mapContact),
  });
}

export async function POST(req: Request) {
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

  const payload = await req.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const firstName = typeof payload.first_name === "string" ? payload.first_name.trim() : "";
  const lastName = typeof payload.last_name === "string" ? payload.last_name.trim() : "";
  if (!firstName || !lastName) {
    return NextResponse.json({ error: "first_name and last_name are required" }, { status: 400 });
  }

  const emailRaw = typeof payload.email === "string" ? payload.email.trim() : undefined;
  const phoneRaw = typeof payload.phone === "string" ? payload.phone.trim() : undefined;
  const ownerIdRaw = typeof payload.owner_id === "string" ? payload.owner_id.trim() : undefined;
  const accountIdRaw = typeof payload.account_id === "string" ? payload.account_id.trim() : undefined;

  let ownerId = ownerIdRaw && ownerIdRaw.length ? ownerIdRaw : currentUser.id;
  if (ownerId) {
    const owner = await prisma.users.findUnique({
      where: { id: ownerId },
      select: { id: true },
    });
    if (!owner) {
      return NextResponse.json({ error: "owner_id is invalid" }, { status: 400 });
    }
  } else {
    ownerId = null;
  }

  if (accountIdRaw) {
    const account = await prisma.accounts.findUnique({
      where: { id: accountIdRaw },
      select: { id: true },
    });
    if (!account) {
      return NextResponse.json({ error: "account_id is invalid" }, { status: 400 });
    }
  }

  try {
    const contact = await prisma.contacts.create({
      data: {
        first_name: firstName,
        last_name: lastName,
        owner_id: ownerId,
        ...(accountIdRaw ? { account_id: accountIdRaw } : {}),
        ...(emailRaw !== undefined ? { email: emailRaw.length ? emailRaw : null } : {}),
        ...(phoneRaw !== undefined ? { phone: phoneRaw.length ? phoneRaw : null } : {}),
      },
      select: {
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
        _count: { select: { cases: true } },
      },
    });

    return NextResponse.json({ contact: mapContact(contact) }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "email must be unique" }, { status: 409 });
    }
    throw error;
  }
}

