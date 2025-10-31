export const CASE_STAGE_COLUMNS = [
  { key: "LEAD", label: "リード" },
  { key: "QUALIFIED", label: "検討中" },
  { key: "PROPOSAL", label: "提案中" },
  { key: "NEGOTIATION", label: "交渉中" },
  { key: "WON", label: "受注" },
  { key: "LOST", label: "失注" },
] as const;

export type CaseStageKey = typeof CASE_STAGE_COLUMNS[number]["key"];

export const CASE_STAGE_SEQUENCE: CaseStageKey[] = CASE_STAGE_COLUMNS.map((item) => item.key);

export function nextCaseStage(current: CaseStageKey): CaseStageKey | null {
  if (current === "WON" || current === "LOST") return null;
  const index = CASE_STAGE_SEQUENCE.indexOf(current);
  if (index === -1) return null;
  return CASE_STAGE_SEQUENCE[index + 1] ?? null;
}
