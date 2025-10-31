"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  caseId: string;
  disabled?: boolean;
};

export default function ConvertButton({ caseId, disabled }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onConvert() {
    if (!window.confirm("この案件を受注としてプロジェクト化しますか？")) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/convert`, { method: "POST" });
      let payload: any = null;
      try {
        payload = await res.json();
      } catch {
        /* noop */
      }
      if (!res.ok) {
        setError(payload?.error ?? "受注処理に失敗しました。");
        return;
      }
      const projectId = payload?.project?.id as string | undefined;
      if (projectId) {
        router.replace(`/projects/${projectId}/issues`);
      } else {
        router.refresh();
      }
    } catch {
      setError("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button className="button" onClick={onConvert} disabled={disabled || loading}>
        {loading ? "処理中..." : "受注してプロジェクト化"}
      </button>
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}
