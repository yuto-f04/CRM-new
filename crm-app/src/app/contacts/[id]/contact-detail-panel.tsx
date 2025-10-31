"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type ContactDetail = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  account: { id: string; name: string } | null;
  owner: { id: string; name: string | null; email: string } | null;
  counts: { cases: number };
  cases: Array<{ id: string; title: string; stage: string; updated_at: string }>;
};

type Props = {
  contact: ContactDetail;
};

type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  account_id: string;
};

type AccountOption = { id: string; name: string };

function formatDate(value: string, withTime = false) {
  const d = new Date(value);
  return withTime ? d.toLocaleString("ja-JP") : d.toLocaleDateString("ja-JP");
}

export default function ContactDetailPanel({ contact }: Props) {
  const router = useRouter();
  const [data, setData] = useState(contact);
  const [form, setForm] = useState<FormState>({
    first_name: contact.first_name,
    last_name: contact.last_name,
    email: contact.email ?? "",
    phone: contact.phone ?? "",
    account_id: contact.account?.id ?? "",
  });
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAccounts() {
      try {
        const res = await fetch("/api/accounts", { cache: "no-store" });
        if (!res.ok) return;
        const payload = await res.json();
        const items = (payload.accounts ?? []) as Array<{ id: string; name: string }>;
        setAccounts(items.map((item) => ({ id: item.id, name: item.name })));
      } catch {
        /* noop */
      }
    }
    void loadAccounts();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const firstName = form.first_name.trim();
    const lastName = form.last_name.trim();
    if (!firstName || !lastName) {
      setSaveError("氏名（姓・名）を入力してください。");
      return;
    }

    setSaveError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email: form.email.trim(),
          phone: form.phone.trim(),
          account_id: form.account_id,
        }),
      });
      let payload: any = null;
      try {
        payload = await res.json();
      } catch {
        /* noop */
      }
      if (!res.ok) {
        setSaveError(payload?.error ?? "更新に失敗しました。");
        return;
      }
      if (payload?.contact) {
        setData(payload.contact as ContactDetail);
      }
    } catch {
      setSaveError("更新処理中にエラーが発生しました。");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("このコンタクトを削除しますか？紐付く案件がある場合は削除できません。")) {
      return;
    }

    setDeleteError(null);
    setDeleting(true);
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, { method: "DELETE" });
      let payload: any = null;
      try {
        payload = await res.json();
      } catch {
        /* noop */
      }
      if (!res.ok) {
        setDeleteError(payload?.error ?? "削除に失敗しました。案件の紐付きをご確認ください。");
        return;
      }
      router.push("/contacts");
      router.refresh();
    } catch {
      setDeleteError("削除処理中にエラーが発生しました。");
    } finally {
      setDeleting(false);
    }
  }

  const displayName = `${data.last_name} ${data.first_name}`.trim() || data.email || "名称未設定";

  return (
    <div className="stack">
      <section className="card space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{displayName}</h1>
            <p className="text-sm text-muted-foreground">
              最終更新: {formatDate(data.updated_at, true)} / 作成日: {formatDate(data.created_at)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 text-right">
            <span className="text-xs text-muted-foreground">
              担当者: {data.owner?.name ?? data.owner?.email ?? "未設定"}
            </span>
            <button className="button danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? "削除中..." : "コンタクトを削除"}
            </button>
            {deleteError ? <p className="form-error text-right">{deleteError}</p> : null}
          </div>
        </div>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-foreground">姓</span>
            <input
              className="input"
              value={form.last_name}
              onChange={(event) => setForm((prev) => ({ ...prev, last_name: event.target.value }))}
              disabled={saving}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-foreground">名</span>
            <input
              className="input"
              value={form.first_name}
              onChange={(event) => setForm((prev) => ({ ...prev, first_name: event.target.value }))}
              disabled={saving}
            />
          </label>
          <label className="grid gap-1 text-sm md:col-span-2">
            <span className="font-medium text-foreground">メールアドレス</span>
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              disabled={saving}
            />
          </label>
          <label className="grid gap-1 text-sm md:col-span-2">
            <span className="font-medium text-foreground">電話番号</span>
            <input
              className="input"
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              disabled={saving}
            />
          </label>
          <label className="grid gap-1 text-sm md:col-span-2">
            <span className="font-medium text-foreground">関連取引先</span>
            <select
              className="input"
              value={form.account_id}
              onChange={(event) => setForm((prev) => ({ ...prev, account_id: event.target.value }))}
              disabled={saving}
            >
              <option value="">未選択</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>
          {saveError ? <p className="form-error md:col-span-2">{saveError}</p> : null}
          <div className="md:col-span-2 flex justify-end">
            <button className="button" type="submit" disabled={saving}>
              {saving ? "保存中..." : "変更を保存"}
            </button>
          </div>
        </form>
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold text-foreground">関連案件</h2>
        {data.cases.length === 0 ? (
          <p className="text-sm text-muted-foreground">紐付く案件はありません。</p>
        ) : (
          <ul className="space-y-2">
            {data.cases.map((deal) => (
              <li key={deal.id} className="flex items-center justify-between rounded border border-border p-3 text-sm">
                <div>
                  <p className="font-medium text-foreground">{deal.title}</p>
                  <p className="text-xs text-muted-foreground">
                    ステージ: {deal.stage} / 更新: {formatDate(deal.updated_at, true)}
                  </p>
                </div>
                <Link href={`/cases/${deal.id}`} className="text-xs text-primary underline underline-offset-2">
                  開く
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

