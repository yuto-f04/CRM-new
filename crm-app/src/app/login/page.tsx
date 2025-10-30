"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.ok) {
      const nextPath = searchParams?.get("next") || "/dashboard";
      router.replace(nextPath);
    } else {
      setErr("メールまたはパスワードが正しくありません。");
    }
  }

  return (
    <div className="app-shell">
      <div className="card" style={{ maxWidth: 520 }}>
        <h1>ログイン</h1>
        <p>管理者の認証情報を入力してください。</p>
        <form onSubmit={onSubmit} className="form-stack">
          <label className="form-group">
            <span>メールアドレス</span>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="form-group">
            <span>パスワード</span>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {err ? <p className="form-error">{err}</p> : null}
          <div className="form-actions">
            <button className="button" disabled={loading}>
              {loading ? "ログイン中..." : "ログイン"}
            </button>
          </div>
        </form>
        <div style={{ marginTop: 12 }}>
          <Link href="/dashboard">ダッシュボードへ戻る</Link>
        </div>
      </div>
    </div>
  );
}
