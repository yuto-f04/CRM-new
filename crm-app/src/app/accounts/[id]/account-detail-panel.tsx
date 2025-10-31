"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type AccountDetail = {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  owner: { id: string; name: string | null; email: string } | null;
  counts: { contacts: number; cases: number; projects: number };
  contacts: Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    created_at: string;
    updated_at: string;
  }>;
  cases: Array<{ id: string; title: string; stage: string; created_at: string; updated_at: string }>;
  projects: Array<{ id: string; name: string; key: string; created_at: string; updated_at: string }>;
};

type Props = {
  account: AccountDetail;
};

type FormState = {
  name: string;
  industry: string;
  website: string;
  phone: string;
};

function formatDate(value: string, withTime = false) {
  const d = new Date(value);
  return withTime ? d.toLocaleString("ja-JP") : d.toLocaleDateString("ja-JP");
}

export default function AccountDetailPanel({ account }: Props) {
  const router = useRouter();
  const [data, setData] = useState(account);
  const [form, setForm] = useState<FormState>({
    name: account.name,
    industry: account.industry ?? "",
    website: account.website ?? "",
    phone: account.phone ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setSaveError("取引先名を入力してください。");
      return;
    }

    setSaveError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          industry: form.industry.trim(),
          website: form.website.trim(),
          phone: form.phone.trim(),
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
      if (payload?.account) {
        setData(payload.account as AccountDetail);
      }
    } catch {
      setSaveError("更新処理中にエラーが発生しました。");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("この取引先を削除しますか？関連するプロジェクトや案件がある場合は削除できません。")) {
      return;
    }

    setDeleteError(null);
    setDeleting(true);
    try {
      const res = await fetch(`/api/accounts/${account.id}`, { method: "DELETE" });
      let payload: any = null;
      try {
        payload = await res.json();
      } catch {
        /* noop */
      }
      if (!res.ok) {
        setDeleteError(
          payload?.error ??
            "削除に失敗しました。関連データがある場合は先に紐付きを解除してください。",
        );
        return;
      }
      router.push("/accounts");
      router.refresh();
    } catch {
      setDeleteError("削除処理中にエラーが発生しました。");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="stack">
      <section className="card space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{data.name}</h1>
            <p className="text-sm text-muted-foreground">
              最終更新: {formatDate(data.updated_at, true)} / 作成日: {formatDate(data.created_at)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 text-right">
            <span className="text-xs text-muted-foreground">
              担当者: {data.owner?.name ?? data.owner?.email ?? "未設定"}
            </span>
            <button className="button danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? "削除中..." : "取引先を削除"}
            </button>
            {deleteError ? <p className="form-error text-right">{deleteError}</p> : null}
          </div>
        </div>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="grid gap-1 text-sm md:col-span-2">
            <span className="font-medium text-foreground">取引先名</span>
            <input
              className="input"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              disabled={saving}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-foreground">業種</span>
            <input
              className="input"
              value={form.industry}
              onChange={(event) => setForm((prev) => ({ ...prev, industry: event.target.value }))}
              disabled={saving}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-foreground">電話番号</span>
            <input
              className="input"
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              disabled={saving}
            />
          </label>
          <label className="grid gap-1 text-sm md:col-span-2">
            <span className="font-medium text-foreground">Webサイト</span>
            <input
              className="input"
              value={form.website}
              onChange={(event) => setForm((prev) => ({ ...prev, website: event.target.value }))}
              disabled={saving}
            />
          </label>
          {saveError ? <p className="form-error md:col-span-2">{saveError}</p> : null}
          <div className="md:col-span-2 flex justify-end gap-2">
            <button className="button" type="submit" disabled={saving}>
              {saving ? "保存中..." : "変更を保存"}
            </button>
          </div>
        </form>
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold text-foreground">関連プロジェクト</h2>
        {data.projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">紐付くプロジェクトはありません。</p>
        ) : (
          <ul className="space-y-2">
            {data.projects.map((project) => (
              <li key={project.id} className="flex items-center justify-between rounded border border-border p-3 text-sm">
                <div>
                  <p className="font-medium text-foreground">{project.name}</p>
                  <p className="text-xs text-muted-foreground">キー: {project.key}</p>
                </div>
                <Link href={`/projects/${project.id}/issues`} className="text-xs text-primary underline underline-offset-2">
                  開く
                </Link>
              </li>
            ))}
          </ul>
        )}
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

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold text-foreground">関連コンタクト</h2>
        {data.contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground">紐付くコンタクトはありません。</p>
        ) : (
          <ul className="space-y-2">
            {data.contacts.map((person) => {
              const fullName = [person.first_name, person.last_name].filter(Boolean).join(" ");
              return (
                <li key={person.id} className="flex items-center justify-between rounded border border-border p-3 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{fullName || person.email || "名称未設定"}</p>
                    <p className="text-xs text-muted-foreground">
                      連絡先: {person.email ?? "未登録"} / {person.phone ?? "未登録"}
                    </p>
                  </div>
                  <Link href={`/contacts/${person.id}`} className="text-xs text-primary underline underline-offset-2">
                    開く
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

