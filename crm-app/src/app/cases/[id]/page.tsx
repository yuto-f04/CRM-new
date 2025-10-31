import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CASE_STAGE_COLUMNS } from "@/lib/case-stage";
import ConvertButton from "./convert-button";

type RouteParams = {
  params: { id: string };
};

export const metadata = { title: "案件詳細" };

export default async function CaseDetailPage({ params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const deal = await prisma.cases.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      description: true,
      stage: true,
      created_at: true,
      updated_at: true,
      account: { select: { id: true, name: true } },
      contact: { select: { id: true, first_name: true, last_name: true, email: true } },
      owner: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true, key: true } },
    },
  });

  if (!deal) {
    notFound();
  }

  const stageLabel = CASE_STAGE_COLUMNS.find((s) => s.key === deal.stage)?.label ?? deal.stage;

  return (
    <div className="stack">
      <section className="card space-y-3">
        <div className="page-header">
          <div>
            <h1>{deal.title}</h1>
            <p className="text-sm text-muted-foreground">現在ステージ: {stageLabel}</p>
          </div>
        </div>
        {deal.description ? <p className="text-sm text-muted-foreground whitespace-pre-wrap">{deal.description}</p> : null}
        <div className="grid gap-3 md:grid-cols-2 text-sm text-muted-foreground">
          <div>
            <p className="font-semibold text-foreground">アカウント</p>
            <p>{deal.account?.name ?? "未設定"}</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">担当者</p>
            <p>
              {[deal.contact?.first_name, deal.contact?.last_name].filter(Boolean).join(" ") ||
                deal.contact?.email ||
                "未設定"}
            </p>
          </div>
          <div>
            <p className="font-semibold text-foreground">案件担当メンバー</p>
            <p>{deal.owner?.name ?? deal.owner?.email ?? "未設定"}</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">最終更新</p>
            <p>{new Date(deal.updated_at).toLocaleString("ja-JP")}</p>
          </div>
        </div>
        {deal.project ? (
          <div className="border border-border rounded p-3 text-sm space-y-1">
            <p className="font-semibold text-foreground">紐付プロジェクト</p>
            <p>{deal.project.name}</p>
            <p className="text-muted-foreground">キー: {deal.project.key}</p>
          </div>
        ) : (
          <ConvertButton caseId={deal.id} disabled={deal.stage === "LOST"} />
        )}
      </section>
    </div>
  );
}
