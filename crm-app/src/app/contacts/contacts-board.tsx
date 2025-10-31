"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export type ContactListItem = {
  id: string;
  account_id: string | null;
  owner_id: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  account: { id: string; name: string } | null;
  owner: { id: string; name: string | null; email: string } | null;
  counts: { cases: number };
};

type Props = {
  initialContacts: ContactListItem[];
};

type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  account_id: string;
};

type AccountOption = { id: string; name: string };

const initialForm: FormState = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  account_id: "",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ja-JP");
}

export default function ContactsBoard({ initialContacts }: Props) {
  const [contacts, setContacts] = useState(initialContacts);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);

  useEffect(() => {
    async function loadAccounts() {
      try {
        const res = await fetch("/api/accounts", { cache: "no-store" });
        if (!res.ok) return;
        const payload = await res.json();
        const items = (payload.accounts ?? []) as Array<{ id: string; name: string }>;
        setAccounts(items.map((item) => ({ id: item.id, name: item.name })));
      } catch {
        /* ignore */
      }
    }
    void loadAccounts();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const firstName = form.first_name.trim();
    const lastName = form.last_name.trim();

    if (!firstName || !lastName) {
      setError("氏名（姓・名）を入力してください。");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          account_id: form.account_id || undefined,
        }),
      });
      let payload: any = null;
      try {
        payload = await res.json();
      } catch {
        /* noop */
      }
      if (!res.ok) {
        setError(payload?.error ?? "コンタクトの作成に失敗しました。");
        return;
      }
      if (payload?.contact) {
        setContacts((prev) => [payload.contact as ContactListItem, ...prev]);
        setForm(initialForm);
      }
    } catch {
      setError("コンタクトの作成中にエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack">
      <section className="card">
        <h2 className="text-lg font-semibold text-foreground">コンタクトの新規登録</h2>
        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-foreground">姓</span>
            <input
              className="input"
              value={form.last_name}
              onChange={(event) => setForm((prev) => ({ ...prev, last_name: event.target.value }))}
              disabled={loading}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-foreground">名</span>
            <input
              className="input"
              value={form.first_name}
              onChange={(event) => setForm((prev) => ({ ...prev, first_name: event.target.value }))}
              disabled={loading}
            />
          </label>
          <label className="grid gap-1 text-sm md:col-span-2">
            <span className="font-medium text-foreground">メールアドレス</span>
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="sample@example.com"
              disabled={loading}
            />
          </label>
          <label className="grid gap-1 text-sm md:col-span-2">
            <span className="font-medium text-foreground">電話番号</span>
            <input
              className="input"
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              placeholder="090-xxxx-xxxx"
              disabled={loading}
            />
          </label>
          <label className="grid gap-1 text-sm md:col-span-2">
            <span className="font-medium text-foreground">関連取引先</span>
            <select
              className="input"
              value={form.account_id}
              onChange={(event) => setForm((prev) => ({ ...prev, account_id: event.target.value }))}
              disabled={loading}
            >
              <option value="">未選択</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>
          {error ? <p className="form-error md:col-span-2">{error}</p> : null}
          <div className="md:col-span-2 flex justify-end">
            <button className="button" type="submit" disabled={loading}>
              {loading ? "登録中..." : "コンタクトを追加"}
            </button>
          </div>
        </form>
      </section>

      <section className="card space-y-4">
        <h2 className="text-lg font-semibold text-foreground">コンタクト一覧</h2>
        {contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground">登録済みのコンタクトがありません。</p>
        ) : (
          <ul className="stack">
            {contacts.map((contact) => {
              const fullName = [contact.last_name, contact.first_name].filter(Boolean).join(" ");
              return (
                <li key={contact.id} className="space-y-2 rounded border border-border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-foreground">{fullName || contact.email || "名称未設定"}</h3>
                      <p className="text-xs text-muted-foreground">
                        メール: {contact.email ?? "未登録"} / 電話: {contact.phone ?? "未登録"}
                      </p>
                    </div>
                    <Link href={`/contacts/${contact.id}`} className="button ghost">
                      詳細
                    </Link>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>取引先: {contact.account?.name ?? "未設定"}</span>
                    <span>担当者: {contact.owner?.name ?? contact.owner?.email ?? "未設定"}</span>
                    <span>最終更新: {formatDate(contact.updated_at)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">案件数: {contact.counts.cases} 件</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

