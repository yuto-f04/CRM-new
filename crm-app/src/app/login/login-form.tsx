"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginForm() {
  const [email, setEmail] = useState("admin@local.test");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const res = await signIn("credentials", {
      email, password, redirect: false, callbackUrl: "/dashboard",
    });
    setLoading(false);
    if (res?.error) { setErr("メールまたはパスワードが正しくありません。"); return; }
    // 成功 → 画面遷移
    window.location.href = "/dashboard";
  }

  return (
    <div className="stack">
      <section className="card">
        <h1>ログイン</h1>
        <p className="text-sm">管理者の認証情報を入力してください。</p>

        <form className="form-stack" onSubmit={onSubmit}>
          <label>メールアドレス</label>
          <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} />

          <label>パスワード</label>
          <div className="input-with-addon">
            <input
              className="input"
              type={showPw ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="button ghost"
              onClick={() => setShowPw(s => !s)}
              aria-label="Toggle password visibility"
            >
              {showPw ? "Hide" : "Show"}
            </button>
          </div>

          <button className="button" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "ログイン"}
          </button>

          {err && <p className="form-error">{err}</p>}
        </form>

        <p className="text-sm"><a href="/dashboard">ダッシュボードへ戻る</a></p>
      </section>
    </div>
  );
}
