import { cookies, headers } from "next/headers";
import { getServerSession } from "next-auth/next";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import ContactDetailPanel, { type ContactDetail } from "./contact-detail-panel";

type RouteParams = {
  params: { id: string };
};

async function fetchContactDetail(contactId: string): Promise<ContactDetail> {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const headersList = headers();
  const host = headersList.get("host");
  if (!host) throw new Error("Host header is missing");
  const protocol = host.includes("localhost") || host.startsWith("127.") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  const cookieValue = cookies().getAll().map(({ name, value }) => `${name}=${value}`).join("; ");
  const commonHeaders = cookieValue ? { Cookie: cookieValue } : undefined;

  const res = await fetch(`${baseUrl}/api/contacts/${contactId}`, {
    headers: commonHeaders,
    cache: "no-store",
  });

  if (res.status === 401) {
    redirect("/login");
  }
  if (res.status === 404) {
    notFound();
  }
  if (!res.ok) {
    throw new Error("コンタクトの取得に失敗しました");
  }

  const payload = await res.json();
  return payload.contact as ContactDetail;
}

export const metadata = {
  title: "コンタクト詳細",
};

export default async function ContactDetailPage({ params }: RouteParams) {
  const contact = await fetchContactDetail(params.id);
  return <ContactDetailPanel contact={contact} />;
}
