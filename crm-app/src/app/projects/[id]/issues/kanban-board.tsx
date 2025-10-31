"use client";

import { useMemo, useState } from "react";
import { ISSUE_STATUS_COLUMNS, ISSUE_STATUS_SEQUENCE, type IssueStatusKey, nextIssueStatus } from "@/lib/issue-status";

type IssueAssignee = {
  id: string;
  name: string | null;
  email: string | null;
};

export type IssueSummary = {
  id: string;
  title: string;
  description: string | null;
  status: IssueStatusKey;
  priority: string | null;
  type: string | null;
  due_date: string | null;
  updated_at: string;
  assignees: IssueAssignee[];
};

type Props = {
  projectId: string;
  initialIssues: IssueSummary[];
};

export default function KanbanBoard({ projectId, initialIssues }: Props) {
  const [issues, setIssues] = useState<IssueSummary[]>(initialIssues);
  const [error, setError] = useState<string | null>(null);
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  const issuesByStatus = useMemo(() => {
    const grouped: Record<IssueStatusKey, IssueSummary[]> = ISSUE_STATUS_SEQUENCE.reduce(
      (acc, key) => {
        acc[key] = [];
        return acc;
      },
      {} as Record<IssueStatusKey, IssueSummary[]>,
    );

    for (const issue of issues) {
      if (!grouped[issue.status]) {
        grouped[issue.status as IssueStatusKey] = [];
      }
      grouped[issue.status as IssueStatusKey].push(issue);
    }

    return grouped;
  }, [issues]);

  async function advanceIssue(issue: IssueSummary) {
    const nextStatus = nextIssueStatus(issue.status);
    if (!nextStatus) return;

    setError(null);
    setLoadingMap((prev) => ({ ...prev, [issue.id]: true }));
    try {
      const res = await fetch(`/api/issues/${issue.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      let payload: any = null;
      try {
        payload = await res.json();
      } catch {
        // ignore json parse failure
      }

      if (!res.ok) {
        setError(payload?.error ?? "ステータス更新に失敗しました。");
        return;
      }

      const updated = payload?.issue;
      setIssues((prev) =>
        prev.map((item) => (item.id === issue.id ? { ...item, status: updated?.status ?? nextStatus } : item)),
      );
    } catch {
      setError("通信に失敗しました。");
    } finally {
      setLoadingMap((prev) => ({ ...prev, [issue.id]: false }));
    }
  }

  return (
    <section className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">イシューカンバン</h2>
        <p className="text-sm text-muted-foreground">プロジェクトID: {projectId}</p>
      </div>
      {error ? <p className="form-error mb-4">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {ISSUE_STATUS_COLUMNS.map((column) => {
          const columnIssues = issuesByStatus[column.key] ?? [];
          return (
            <div key={column.key} className="border border-border rounded p-3 bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">{column.label}</h3>
                <span className="text-xs text-muted-foreground">{columnIssues.length}件</span>
              </div>
              <div className="space-y-3">
                {columnIssues.length ? (
                  columnIssues.map((issue) => {
                    const nextStatus = nextIssueStatus(issue.status);
                    return (
                      <article key={issue.id} className="border border-border rounded bg-background p-3 space-y-2">
                        <h4 className="text-sm font-semibold">{issue.title}</h4>
                        {issue.description ? (
                          <p className="text-xs text-muted-foreground whitespace-pre-wrap break-words">
                            {issue.description}
                          </p>
                        ) : null}
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {issue.type ? <span>種別: {issue.type}</span> : null}
                          {issue.priority ? <span>優先度: {issue.priority}</span> : null}
                          {issue.due_date ? (
                            <span>
                              期限: {new Date(issue.due_date).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}
                            </span>
                          ) : null}
                        </div>
                        {issue.assignees.length ? (
                          <div className="text-xs text-muted-foreground">
                            担当:{" "}
                            {issue.assignees
                              .map((assignee) => assignee.name ?? assignee.email ?? "未設定")
                              .join(", ")}
                          </div>
                        ) : null}
                        <button
                          className="button ghost w-full"
                          onClick={() => advanceIssue(issue)}
                          disabled={!nextStatus || loadingMap[issue.id]}
                        >
                          {nextStatus ? `→ ${ISSUE_STATUS_COLUMNS.find((col) => col.key === nextStatus)?.label}` : "最終列"}
                        </button>
                      </article>
                    );
                  })
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">カードがありません</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
