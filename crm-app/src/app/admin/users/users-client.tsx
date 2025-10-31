"use client";

import { useEffect, useState, useTransition } from "react";

type Role = "admin" | "manager" | "member";
type UserRow = { id: string; name: string | null; email: string; role: Role };

export default function UsersClient() {
  const [name, setName] = useState("Jane Doe");
  const [email, setEmail] = useState("user@example.com");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false); // ← 追加: 表示切替
  const [role, setRole] = useState<Role>("member");
  const [rows, setRows] = useState<UserRow[]>([]);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      if (!res.ok) throw new Error(`GET /api/admin/users ${res.status}`);
      const data = await res.json();
      setRows(Array.isArray(data?.users) ? data.users : data);
    } catch (e: any) {
      setErr(e.message ?? "Failed to load users");
    }
  }
  useEffect(() => { load(); }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    if (!email || !password) {
      setErr("Email と Temporary password は必須です");
      return;
    }
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const j = await safeJson(res);
      if (!res.ok) throw new Error(j?.error ?? `POST failed: ${res.status}`);
      setMsg("ユーザーを作成しました");
      setPassword("");
      startTransition(load);
    } catch (e: any) {
      setErr(e.message ?? "Failed to create user");
    }
  }

  async function onDelete(targetEmail: string) {
    setErr(null);
    if (!confirm(`Delete user: ${targetEmail} ?`)) return;
    const prev = rows;
    setRows(r => r.filter(x => x.email !== targetEmail)); // 楽観的更新
    try {
      const res = await fetch(`/api/admin/users?email=${encodeURIComponent(targetEmail)}`, { method: "DELETE" });
      const j = await safeJson(res);
      if (!res.ok) throw new Error(j?.error ?? `DELETE failed: ${res.status}`);
    } catch (e: any) {
      setRows(prev); // ロールバック
      setErr(e.message ?? "Failed to delete user");
    }
  }

  return (
    <>
      <section className="card">
        <h2>Create a new user</h2>
        <form className="form-grid" onSubmit={onSubmit}>
          <div className="form-group">
            <label>Full name</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Temporary password</label>
            <div className="input-with-addon">
              <input
                className="input"
                type={showPw ? "text" : "password"}
                placeholder="At least 8 characters"
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
          </div>
          <div className="form-group">
            <label>Role</label>
            <select className="input" value={role} onChange={e => setRole(e.target.value as Role)}>
              <option value="member">member</option>
              <option value="manager">manager</option>
              <option value="admin">admin</option>
            </select>
          </div>
          <div className="form-actions">
            <button className="button" disabled={pending} type="submit">
              {pending ? "Creating..." : "Create user"}
            </button>
          </div>
          {msg && <p className="form-success">{msg}</p>}
          {err && <p className="form-error">{err}</p>}
        </form>
      </section>

      <section className="card">
        <h2>Existing users</h2>
        {err && <p className="form-error">{err}</p>}
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {rows?.length ? rows.map(u => (
                <tr key={u.id}>
                  <td>{u.name ?? "-"}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>
                    <button className="button danger" onClick={() => onDelete(u.email)}>
                      Delete
                    </button>
                  </td>
                </tr>
              )) : <tr><td colSpan={4}>No users</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

async function safeJson(res: Response) {
  try { return await res.json(); } catch { return null; }
}
