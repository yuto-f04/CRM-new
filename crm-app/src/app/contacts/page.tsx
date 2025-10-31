import { cookies, headers } from "next/headers";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import ContactsBoard, { type ContactListItem } from "./contacts-board";

async function fetchContacts(): Promise<ContactListItem[]> {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const headersList = headers();
  const host = headersList.get("host");
  if (!host) throw new Error("Host header is missing");
  const protocol = host.includes("localhost") || host.startsWith("127.") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  const cookieValue = cookies().getAll().map(({ name, value }) => `${name}=${value}`).join("; ");
  const commonHeaders = cookieValue ? { Cookie: cookieValue } : undefined;

  const res = await fetch(`${baseUrl}/api/contacts`, {
    headers: commonHeaders,
    cache: "no-store",
  });

  if (res.status === 401) {
    redirect("/login");
  }
  if (!res.ok) {
    throw new Error("コンタクト一覧の取得に失敗しました");
  }

  const payload = await res.json();
  return (payload.contacts ?? []) as ContactListItem[];
}

export const metadata = {
  title: "コンタクト",
};

export default async function ContactsPage() {
  const contacts = await fetchContacts();

  return (
    <div className="stack">
      <section className="card">
        <div className="page-header">
          <h1>コンタクト管理</h1>
          <p className="text-sm text-muted-foreground">
            取引先に紐づく担当者情報を管理し、案件やケースのフォローを漏れなく行いましょう。
          </p>
        </div>
      </section>

      <ContactsBoard initialContacts={contacts} />
    </div>
  );
}
