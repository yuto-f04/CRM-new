"use client";

import { useState } from "react";

type Props = {
  canManage: boolean;
};

export default function UsersClient({ canManage }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const disabled = !canManage || busy;

  async function handleCreate() {
    if (disabled) return;

    setBusy(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message = payload?.error ? `: ${payload.error}` : "";
        alert(`ユーザーの作成に失敗しました${message}`);
        return;
      }

      alert("ユーザーを作成しました");
      setName("");
      setEmail("");
      setPassword("");
      window.location.reload();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      alert(`通信エラーが発生しました: ${message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="form-stack text-foreground">
      <h2 className="text-xl font-semibold text-foreground">新しいユーザーを作成</h2>
      <fieldset disabled={disabled} className="form-grid" style={{ border: "none", padding: 0, margin: 0 }}>
        <label className="form-group">
          <span className="text-sm text-foreground">氏名</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="山田 太郎"
            className="input bg-card text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <label className="form-group">
          <span className="text-sm text-foreground">メールアドレス</span>
          <input
            type="email"
            inputMode="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="user@example.com"
            className="input bg-card text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <label className="form-group">
          <span className="text-sm text-foreground">仮パスワード（8文字以上）</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            className="input bg-card text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <button
          type="button"
          onClick={handleCreate}
          className="button disabled:opacity-50"
          disabled={disabled}
          style={{ marginTop: "0.5rem" }}
        >
          {busy ? "作成中…" : "ユーザーを作成"}
        </button>
      </fieldset>
      {!canManage && (
        <p className="form-error" style={{ marginTop: "0.5rem" }}>
          この操作を行う権限がありません（管理者またはマネージャーとしてログインしてください）。
        </p>
      )}
    </section>
  );
}
