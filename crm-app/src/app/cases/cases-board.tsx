"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CASE_STAGE_COLUMNS, CASE_STAGE_SEQUENCE, type CaseStageKey, nextCaseStage } from "@/lib/case-stage";

export type CaseSummary = {
  id: string;
  title: string;
  description: string | null;
  stage: CaseStageKey;
  updated_at: string;
  account: { id: string; name: string | null } | null;
  contact: { id: string; first_name: string | null; last_name: string | null; email: string | null } | null;
  owner: { id: string; name: string | null; email: string | null } | null;
  project_id: string | null;
};

type Props = {
  initialCases: CaseSummary[];
};

export default function CasesBoard({ initialCases }: Props) {
  const [items, setItems] = useState(initialCases);
  const [error, setError] = useState<string | null>(null);
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  const grouped = useMemo(() => {
    const result: Record<CaseStageKey, CaseSummary[]> = CASE_STAGE_SEQUENCE.reduce(
      (acc, key) => {
        acc[key] = [];
        return acc;
      },
      {} as Record<CaseStageKey, CaseSummary[]>,
    );
    for (const deal of items) {
      const key = deal.stage;
      if (!result[key]) result[key as CaseStageKey] = [];
      result[key].push(deal);
    }
    return result;
  }, [items]);

  async function updateStage(deal: CaseSummary, stage: CaseStageKey) {
    setError(null);
    setLoadingMap((prev) => ({ ...prev, [deal.id]: true }));

    try {
      const res = await fetch(`/api/cases/${deal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      let payload: any = null;
      try {
        payload = await res.json();
      } catch {
        /* noop */
      }
      if (!res.ok) {
        setError(payload?.error ?? "ステージ更新に失敗しました。");
        return;
      }
      setItems((prev) => prev.map((item) => (item.id === deal.id ? { ...item, stage } : item)));
    } catch {
      setError("通信に失敗しました。");
    } finally {
      setLoadingMap((prev) => ({ ...prev, [deal.id]: false }));
    }
  }

  async function advance(deal: CaseSummary) {
    const next = nextCaseStage(deal.stage);
    if (!next) return;
    await updateStage(deal, next);
  }

  async function markLost(deal: CaseSummary) {
    await updateStage(deal, "LOST");
  }

  return (
    <section className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">案件カンバン</h2>
        {error ? <p className="form-error m-0">{error}</p> : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {CASE_STAGE_COLUMNS.map((column) => {
          const deals = grouped[column.key] ?? [];
          return (
            <div key={column.key} className="border border-border rounded p-3 bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">{column.label}</h3>
                <span className="text-xs text-muted-foreground">{deals.length}件</span>
              </div>
              <div className="space-y-3">
                {deals.length ? (
                  deals.map((deal) => {
                    const next = nextCaseStage(deal.stage);
                    const loading = loadingMap[deal.id];
                    return (
                      <article key={deal.id} className="border border-border rounded bg-background p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-semibold">{deal.title}</h4>
                          <Link href={`/cases/${deal.id}`} className="text-xs text-primary hover:underline">
                            詳細
                          </Link>
                        </div>
                        {deal.description ? (
                          <p className="text-xs text-muted-foreground whitespace-pre-wrap break-words">
                            {deal.description}
                          </p>
                        ) : null}
                        <div className="text-xs text-muted-foreground space-y-1">
                          {deal.account?.name ? <p>アカウント: {deal.account.name}</p> : null}
                          {deal.contact ? (
                            <p>
                              担当者:{" "}
                              {[deal.contact.first_name, deal.contact.last_name].filter(Boolean).join(" ") ||
                                deal.contact.email ||
                                "未設定"}
                            </p>
                          ) : null}
                          {deal.owner ? (
                            <p>担当メンバー: {deal.owner.name ?? deal.owner.email ?? "未設定"}</p>
                          ) : null}
                          {deal.project_id ? <p className="text-xs text-primary">紐付プロジェクトあり</p> : null}
                        </div>
                        <div className="flex gap-2">
                          <button
                            className="button ghost flex-1"
                            onClick={() => advance(deal)}
                            disabled={!next || loading}
                          >
                            {next ? `→ ${CASE_STAGE_COLUMNS.find((col) => col.key === next)?.label}` : "最終ステージ"}
                          </button>
                          <button className="button danger" onClick={() => markLost(deal)} disabled={loading}>
                            失注
                          </button>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">案件はありません</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
