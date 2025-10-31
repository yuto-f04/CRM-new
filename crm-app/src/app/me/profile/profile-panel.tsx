"use client";

import { useState } from "react";

type Props = {
  name: string;
  email: string;
  role: string;
};

export default function ProfilePanel({ name, email, role }: Props) {
  const [displayName, setDisplayName] = useState(name);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  async function updateProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = displayName.trim();
    if (!trimmed) {
      setProfileError("表示名を入力してください。");
      return;
    }

    setProfileError(null);
    setProfileMessage(null);
    setProfileLoading(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      let payload: any = null;
      try {
        payload = await res.json();
      } catch {
        /* noop */
      }
      if (!res.ok) {
        setProfileError(payload?.error ?? "表示名の更新に失敗しました。");
        return;
      }
      setProfileMessage("表示名を更新しました。");
    } catch {
      setProfileError("表示名の更新中にエラーが発生しました。");
    } finally {
      setProfileLoading(false);
    }
  }

  async function updatePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentPassword || !newPassword) {
      setPasswordError("現在のパスワードと新しいパスワードを入力してください。");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("確認用パスワードが一致しません。");
      return;
    }

    setPasswordError(null);
    setPasswordMessage(null);
    setPasswordLoading(true);
    try {
      const res = await fetch("/api/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      let payload: any = null;
      try {
        payload = await res.json();
      } catch {
        /* noop */
      }
      if (!res.ok) {
        setPasswordError(payload?.error ?? "パスワードの更新に失敗しました。");
        return;
      }
      setPasswordMessage(payload?.message ?? "パスワードを更新しました。再ログインしてください。");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPasswordError("パスワードの更新中にエラーが発生しました。");
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <div className="stack">
      <section className="card space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">プロフィール設定</h1>
          <p className="text-sm text-muted-foreground">
            ログイン中: {email} / ロール: {role}
          </p>
        </div>

        <form className="grid gap-3 md:grid-cols-2" onSubmit={updateProfile}>
          <label className="grid gap-1 text-sm md:col-span-2">
            <span className="font-medium text-foreground">表示名</span>
            <input
              className="input"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              disabled={profileLoading}
            />
          </label>
          {profileError ? <p className="form-error md:col-span-2">{profileError}</p> : null}
          {profileMessage ? <p className="text-sm text-emerald-600 md:col-span-2">{profileMessage}</p> : null}
          <div className="md:col-span-2 flex justify-end">
            <button className="button" type="submit" disabled={profileLoading}>
              {profileLoading ? "更新中..." : "表示名を更新"}
            </button>
          </div>
        </form>
      </section>

      <section className="card space-y-4">
        <h2 className="text-lg font-semibold text-foreground">パスワードの変更</h2>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={updatePassword}>
          <label className="grid gap-1 text-sm md:col-span-2">
            <span className="font-medium text-foreground">現在のパスワード</span>
            <input
              type="password"
              className="input"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              disabled={passwordLoading}
            />
          </label>
          <label className="grid gap-1 text-sm md:col-span-2">
            <span className="font-medium text-foreground">新しいパスワード</span>
            <input
              type="password"
              className="input"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              disabled={passwordLoading}
              placeholder="8文字以上で入力してください"
            />
          </label>
          <label className="grid gap-1 text-sm md:col-span-2">
            <span className="font-medium text-foreground">新しいパスワード（確認）</span>
            <input
              type="password"
              className="input"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              disabled={passwordLoading}
            />
          </label>
          {passwordError ? <p className="form-error md:col-span-2">{passwordError}</p> : null}
          {passwordMessage ? <p className="text-sm text-emerald-600 md:col-span-2">{passwordMessage}</p> : null}
          <div className="md:col-span-2 flex justify-end">
            <button className="button" type="submit" disabled={passwordLoading}>
              {passwordLoading ? "更新中..." : "パスワードを更新"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
