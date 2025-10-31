"use client";

import { useState } from "react";

export type SprintSummary = {
  id: string;
  project_id: string;
  name: string;
  goal: string | null;
  status: "PLANNED" | "ACTIVE" | "CLOSED";
  start_date: string | null;
  end_date: string | null;
  issue_count: number;
  created_at: string;
  updated_at: string;
};

type Props = {
  projectId: string;
  initialSprints: SprintSummary[];
  canManage: boolean;
};

type SprintForm = {
  name: string;
  goal: string;
  status: SprintSummary["status"];
  start_date: string;
  end_date: string;
};

const STATUS_LABELS: Record<SprintSummary["status"], string> = {
  PLANNED: "計画中",
  ACTIVE: "進行中",
  CLOSED: "クローズ",
};

const statusOptions: SprintSummary["status"][] = ["PLANNED", "ACTIVE", "CLOSED"];

const initialForm: SprintForm = {
  name: "",
  goal: "",
  status: "PLANNED",
  start_date: "",
  end_date: "",
};

function formatDate(date: string | null, withTime = false) {
  if (!date) return "未設定";
  const obj = new Date(date);
  return withTime ? obj.toLocaleString("ja-JP") : obj.toLocaleDateString("ja-JP");
}

export default function SprintsBoard({ projectId, initialSprints, canManage }: Props) {
  const [sprints, setSprints] = useState(initialSprints);
  const [form, setForm] = useState(initialForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState<Record<string, boolean>>({});

  async function submitCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage) return;

    const name = form.name.trim();
    if (!name) {
      setCreateError("スプリント名を入力してください。");
      return;
    }
    if (form.start_date && form.end_date && new Date(form.start_date) > new Date(form.end_date)) {
      setCreateError("開始日は終了日より前の日付にしてください。");
      return;
    }

    setCreateError(null);
    setCreateLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/sprints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          goal: form.goal.trim() || undefined,
          status: form.status,
          start_date: form.start_date || undefined,
          end_date: form.end_date || undefined,
        }),
      });
      let payload: any = null;
      try {
        payload = await res.json();
      } catch {
        /* noop */
      }
      if (!res.ok) {
        setCreateError(payload?.error ?? "スプリントの作成に失敗しました。");
        return;
      }
      if (payload?.sprint) {
        setSprints((prev) => [payload.sprint as SprintSummary, ...prev]);
        setForm(initialForm);
      }
    } catch {
      setCreateError("スプリントの作成中にエラーが発生しました。");
    } finally {
      setCreateLoading(false);
    }
  }

  async function updateStatus(id: string, status: SprintSummary["status"]) {
    setStatusError(null);
    setStatusLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/sprints/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      let payload: any = null;
      try {
        payload = await res.json();
      } catch {
        /* noop */
      }
      if (!res.ok) {
        setStatusError(payload?.error ?? "ステータスの更新に失敗しました。");
        return;
      }
      if (payload?.sprint) {
        setSprints((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: payload.sprint.status, updated_at: payload.sprint.updated_at } : item)),
        );
      }
    } catch {
      setStatusError("ステータスの更新中にエラーが発生しました。");
    } finally {
      setStatusLoading((prev) => ({ ...prev, [id]: false }));
    }
  }

  return (
    <div className="stack">
      {canManage ? (
        <section className="card">
          <h2 className="text-lg font-semibold text-foreground">スプリントの作成</h2>
          <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={submitCreate}>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-foreground">スプリント名</span>
              <input
                className="input"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="例）2025年1月 前半"
                disabled={createLoading}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-foreground">ステータス</span>
              <select
                className="input"
                value={form.status}
                onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as SprintSummary["status"] }))}
                disabled={createLoading}
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {STATUS_LABELS[option]}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm md:col-span-2">
              <span className="font-medium text-foreground">目標</span>
              <textarea
                className="input min-h-[80px]"
                value={form.goal}
                onChange={(event) => setForm((prev) => ({ ...prev, goal: event.target.value }))}
                placeholder="達成したい成果や指標を記載してください。"
                disabled={createLoading}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-foreground">開始日</span>
              <input
                type="date"
                className="input"
                value={form.start_date}
                onChange={(event) => setForm((prev) => ({ ...prev, start_date: event.target.value }))}
                disabled={createLoading}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-foreground">終了日</span>
              <input
                type="date"
                className="input"
                value={form.end_date}
                onChange={(event) => setForm((prev) => ({ ...prev, end_date: event.target.value }))}
                disabled={createLoading}
              />
            </label>
            {createError ? <p className="form-error md:col-span-2">{createError}</p> : null}
            <div className="md:col-span-2 flex justify-end">
              <button className="button" type="submit" disabled={createLoading}>
                {createLoading ? "登録中..." : "スプリントを追加"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="card space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-foreground">スプリント一覧</h2>
          {statusError ? <p className="form-error m-0">{statusError}</p> : null}
        </div>
        {sprints.length === 0 ? (
          <p className="text-sm text-muted-foreground">まだスプリントが登録されていません。</p>
        ) : (
          <ul className="stack">
            {sprints.map((sprint) => {
              const loading = statusLoading[sprint.id];
              return (
                <li key={sprint.id} className="space-y-3 rounded border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <h3 className="text-base font-semibold text-foreground">{sprint.name}</h3>
                      {sprint.goal ? (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{sprint.goal}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-2 text-sm">
                      <span className="text-muted-foreground">
                        課題数: <span className="font-semibold text-foreground">{sprint.issue_count}</span>
                      </span>
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>ステータス</span>
                        <select
                          className="input h-8 w-[140px]"
                          value={sprint.status}
                          onChange={(event) => updateStatus(sprint.id, event.target.value as SprintSummary["status"])}
                          disabled={!canManage || loading}
                        >
                          {statusOptions.map((option) => (
                            <option key={option} value={option}>
                              {STATUS_LABELS[option]}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span>開始日: {formatDate(sprint.start_date)}</span>
                    <span>終了日: {formatDate(sprint.end_date)}</span>
                    <span>最終更新: {formatDate(sprint.updated_at, true)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

