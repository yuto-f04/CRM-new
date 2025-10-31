"use client";

import { useState } from "react";

export type EpicSummary = {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  issue_count: number;
  created_at: string;
  updated_at: string;
};

type Props = {
  projectId: string;
  initialEpics: EpicSummary[];
};

type EpicFormState = {
  name: string;
  description: string;
};

const initialForm: EpicFormState = {
  name: "",
  description: "",
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("ja-JP");
}

export default function EpicsBoard({ projectId, initialEpics }: Props) {
  const [epics, setEpics] = useState(initialEpics);
  const [form, setForm] = useState(initialForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(initialForm);
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError(null);

    const name = form.name.trim();
    if (!name) {
      setCreateError("エピック名を入力してください。");
      return;
    }

    setCreateLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/epics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: form.description.trim() || undefined,
        }),
      });
      let payload: any = null;
      try {
        payload = await res.json();
      } catch {
        /* noop */
      }
      if (!res.ok) {
        setCreateError(payload?.error ?? "エピックの作成に失敗しました。");
        return;
      }
      if (payload?.epic) {
        setEpics((prev) => [payload.epic as EpicSummary, ...prev]);
        setForm(initialForm);
      }
    } catch {
      setCreateError("エピックの作成中にエラーが発生しました。");
    } finally {
      setCreateLoading(false);
    }
  }

  function startEdit(epic: EpicSummary) {
    setEditingId(epic.id);
    setEditError(null);
    setEditForm({
      name: epic.name,
      description: epic.description ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError(null);
    setEditForm(initialForm);
  }

  async function handleEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId) return;

    const name = editForm.name.trim();
    if (!name) {
      setEditError("エピック名を入力してください。");
      return;
    }

    setEditLoading(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/epics/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: editForm.description.trim(),
        }),
      });
      let payload: any = null;
      try {
        payload = await res.json();
      } catch {
        /* noop */
      }
      if (!res.ok) {
        setEditError(payload?.error ?? "エピックの更新に失敗しました。");
        return;
      }
      if (payload?.epic) {
        setEpics((prev) => prev.map((epic) => (epic.id === editingId ? (payload.epic as EpicSummary) : epic)));
        cancelEdit();
      }
    } catch {
      setEditError("エピックの更新中にエラーが発生しました。");
    } finally {
      setEditLoading(false);
    }
  }

  return (
    <div className="stack">
      <section className="card">
        <h2 className="text-lg font-semibold text-foreground">エピックの追加</h2>
        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={handleCreate}>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-foreground">エピック名</span>
            <input
              type="text"
              className="input"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="例）基盤強化"
              disabled={createLoading}
            />
          </label>
          <label className="grid gap-1 text-sm md:col-span-2">
            <span className="font-medium text-foreground">概要</span>
            <textarea
              className="input min-h-[80px]"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="進めたい背景やゴールを記載してください。"
              disabled={createLoading}
            />
          </label>
          {createError ? <p className="form-error md:col-span-2">{createError}</p> : null}
          <div className="md:col-span-2 flex justify-end">
            <button className="button" type="submit" disabled={createLoading}>
              {createLoading ? "登録中..." : "エピックを追加"}
            </button>
          </div>
        </form>
      </section>

      <section className="card space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-foreground">登録済みエピック</h2>
          {editError ? <p className="form-error m-0">{editError}</p> : null}
        </div>
        {epics.length === 0 ? (
          <p className="text-sm text-muted-foreground">まだエピックが登録されていません。</p>
        ) : (
          <ul className="stack">
            {epics.map((epic) => {
              const isEditing = editingId === epic.id;
              return (
                <li key={epic.id} className="space-y-3 rounded border border-border p-4">
                  {isEditing ? (
                    <form className="grid gap-3" onSubmit={handleEdit}>
                      <label className="grid gap-1 text-sm">
                        <span className="font-medium text-foreground">エピック名</span>
                        <input
                          className="input"
                          value={editForm.name}
                          onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))}
                          disabled={editLoading}
                        />
                      </label>
                      <label className="grid gap-1 text-sm">
                        <span className="font-medium text-foreground">概要</span>
                        <textarea
                          className="input min-h-[80px]"
                          value={editForm.description}
                          onChange={(event) => setEditForm((prev) => ({ ...prev, description: event.target.value }))}
                          disabled={editLoading}
                        />
                      </label>
                      <div className="flex items-center justify-end gap-2">
                        <button type="button" className="button ghost" onClick={cancelEdit} disabled={editLoading}>
                          キャンセル
                        </button>
                        <button type="submit" className="button" disabled={editLoading}>
                          {editLoading ? "更新中..." : "更新する"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <h3 className="text-base font-semibold text-foreground">{epic.name}</h3>
                          {epic.description ? (
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{epic.description}</p>
                          ) : null}
                        </div>
                        <button className="button ghost" onClick={() => startEdit(epic)}>
                          編集
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span>課題数: {epic.issue_count}</span>
                        <span>最終更新: {formatDate(epic.updated_at)}</span>
                        <span>作成日時: {formatDate(epic.created_at)}</span>
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

