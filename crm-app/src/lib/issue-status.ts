export const ISSUE_STATUS_COLUMNS = [
  { key: "TO_DO", label: "未着手" },
  { key: "IN_PROGRESS", label: "進行中" },
  { key: "IN_REVIEW", label: "レビュー中" },
  { key: "BLOCKED", label: "ブロック中" },
  { key: "DONE", label: "完了" },
] as const;

export type IssueStatusKey = typeof ISSUE_STATUS_COLUMNS[number]["key"];

export const ISSUE_STATUS_SEQUENCE: IssueStatusKey[] = ISSUE_STATUS_COLUMNS.map((item) => item.key);

export function nextIssueStatus(current: IssueStatusKey): IssueStatusKey | null {
  const index = ISSUE_STATUS_SEQUENCE.indexOf(current);
  if (index === -1) return null;
  return ISSUE_STATUS_SEQUENCE[index + 1] ?? null;
}
