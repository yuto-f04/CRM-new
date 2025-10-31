"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  projectId: string;
};

const TAB_DEFS = [
  { slug: "issues", label: "課題ボード" },
  { slug: "epics", label: "エピック" },
  { slug: "sprints", label: "スプリント" },
];

function tabClass(active: boolean) {
  return [
    "inline-flex items-center rounded border px-3 py-1.5 text-sm transition-colors",
    active ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground",
  ].join(" ");
}

export default function ProjectTabs({ projectId }: Props) {
  const pathname = usePathname();
  const basePath = `/projects/${projectId}`;

  return (
    <nav className="flex flex-wrap gap-2" aria-label="プロジェクト内ナビゲーション">
      {TAB_DEFS.map((tab) => {
        const href = `${basePath}/${tab.slug}`;
        const active = pathname.startsWith(href);
        return (
          <Link key={tab.slug} href={href} className={tabClass(active)} aria-current={active ? "page" : undefined}>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

