import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CASE_STAGE_COLUMNS } from "@/lib/case-stage";
import { visibleProjectIds } from "@/lib/project-access";
import ConvertButton from "./convert-button";

type RouteParams = {
  params: { id: string };
};

export const metadata = { title: "Deal Detail" };

export default async function CaseDetailPage({ params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

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
      account_id: true,
    },
  });

  if (!deal) {
    redirect("/cases");
  }

  const visible = await visibleProjectIds(session.user.id);
  let allowed = deal.project?.id ? visible.has(deal.project.id) : false;

  if (!allowed && deal.account_id) {
    const linked = await prisma.project_members.findFirst({
      where: {
        user_id: session.user.id,
        project: { account_id: deal.account_id },
      },
      select: { id: true },
    });
    allowed = Boolean(linked);
  }

  if (!allowed) {
    redirect("/cases");
  }

  const stageLabel = CASE_STAGE_COLUMNS.find((s) => s.key === deal.stage)?.label ?? deal.stage;
  const contactName =
    [deal.contact?.last_name, deal.contact?.first_name].filter(Boolean).join(" ") || deal.contact?.email || "Unassigned";

  return (
    <div className="stack">
      <section className="card space-y-4">
        <div className="page-header">
          <div>
            <h1>{deal.title}</h1>
            <p className="text-sm text-muted-foreground">Stage: {stageLabel}</p>
          </div>
        </div>
        {deal.description ? (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{deal.description}</p>
        ) : null}
        <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
          <div>
            <p className="font-semibold text-foreground">Account</p>
            {deal.account ? (
              <Link href={`/accounts/${deal.account.id}`} className="underline decoration-dotted underline-offset-2">
                {deal.account.name}
              </Link>
            ) : (
              <p>Unassigned</p>
            )}
          </div>
          <div>
            <p className="font-semibold text-foreground">Contact</p>
            {deal.contact ? (
              <Link href={`/contacts/${deal.contact.id}`} className="underline decoration-dotted underline-offset-2">
                {contactName}
              </Link>
            ) : (
              <p>Unassigned</p>
            )}
          </div>
          <div>
            <p className="font-semibold text-foreground">Deal owner</p>
            <p>{deal.owner?.name ?? deal.owner?.email ?? "Unassigned"}</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">Last updated</p>
            <p>{new Date(deal.updated_at).toLocaleString("ja-JP")}</p>
          </div>
        </div>
        {deal.project ? (
          <div className="rounded border border-border p-3 text-sm space-y-1">
            <p className="font-semibold text-foreground">Linked project</p>
            <Link
              href={`/projects/${deal.project.id}/issues`}
              className="text-primary underline decoration-dotted underline-offset-2"
            >
              {deal.project.name} ({deal.project.key})
            </Link>
          </div>
        ) : (
          <ConvertButton caseId={deal.id} disabled={deal.stage === "LOST"} />
        )}
      </section>
    </div>
  );
}
