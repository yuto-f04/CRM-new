"use client";

import { useState } from "react";
import Link from "next/link";

export type AccountListItem = {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  owner: { id: string; name: string | null; email: string } | null;
  counts: { contacts: number; cases: number; projects: number };
};

type Props = {
  initialAccounts: AccountListItem[];
};

type FormState = {
  name: string;
  industry: string;
  website: string;
  phone: string;
};

const initialForm: FormState = {
  name: "",
  industry: "",
  website: "",
  phone: "",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ja-JP");
}

export default function AccountsBoard({ initialAccounts }: Props) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setError("取引先名を入力してください。");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          industry: form.industry.trim() || undefined,
          website: form.website.trim() || undefined,
          phone: form.phone.trim() || undefined,
        }),
      });
      let payload: any = null;
      try {
        payload = await res.json();
      } catch {
        /* noop */
      }
      if (!res.ok) {
        setError(payload?.error ?? "取引先の作成に失敗しました。");
        return;
      }
      if (payload?.account) {
        setAccounts((prev) => [payload.account as AccountListItem, ...prev]);
        setForm(initialForm);
      }
    } catch {
      setError("取引先の作成中にエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack">
      <section className="card">
        <h2 className="text-lg font-semibold text-foreground">取引先の新規登録</h2>
        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-foreground">取引先名</span>
            <input
              className="input"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="例）株式会社サンプル"
              disabled={loading}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-foreground">業種</span>
            <input
              className="input"
              value={form.industry}
              onChange={(event) => setForm((prev) => ({ ...prev, industry: event.target.value }))}
              placeholder="例）ITサービス"
              disabled={loading}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-foreground">Webサイト</span>
            <input
              className="input"
              value={form.website}
              onChange={(event) => setForm((prev) => ({ ...prev, website: event.target.value }))}
              placeholder="https://example.com"
              disabled={loading}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-foreground">電話番号</span>
            <input
              className="input"
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              placeholder="03-1234-5678"
              disabled={loading}
            />
          </label>
          {error ? <p className="form-error md:col-span-2">{error}</p> : null}
          <div className="md:col-span-2 flex justify-end">
            <button className="button" type="submit" disabled={loading}>
              {loading ? "登録中..." : "取引先を追加"}
            </button>
          </div>
        </form>
      </section>

      <section className="card space-y-4">
        <h2 className="text-lg font-semibold text-foreground">取引先一覧</h2>
        {accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">登録済みの取引先がありません。</p>
        ) : (
          <ul className="stack">
            {accounts.map((account) => (
              <li key={account.id} className="space-y-2 rounded border border-border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">{account.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      最終更新: {formatDate(account.updated_at)} / 担当者:{" "}
                      {account.owner?.name ?? account.owner?.email ?? "未設定"}
                    </p>
                  </div>
                  <Link href={`/accounts/${account.id}`} className="button ghost">
                    詳細
                  </Link>
                </div>
                <div className="grid gap-1 text-sm text-muted-foreground md:grid-cols-2">
                  <span>業種: {account.industry ?? "未設定"}</span>
                  <span>電話番号: {account.phone ?? "未設定"}</span>
                  <span className="md:col-span-2">Webサイト: {account.website ?? "未設定"}</span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>プロジェクト: {account.counts.projects} 件</span>
                  <span>案件: {account.counts.cases} 件</span>
                  <span>コンタクト: {account.counts.contacts} 件</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

