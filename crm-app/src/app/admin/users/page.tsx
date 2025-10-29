import Link from "next/link";
import { redirect } from "next/navigation";

import { type Role } from "@prisma/client";

import { SignOutButton } from "@/components/sign-out-button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLE_OPTIONS } from "@/lib/roles";

import UsersClient from "./users-client";
import { toggleUserActiveAction, updateUserRoleAction } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ROLE_LABELS: Record<Role, string> = {
  admin: "管理者",
  manager: "マネージャー",
  member: "メンバー",
  viewer: "閲覧者",
};

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const role = (session.user.role ?? "member") as Role;
  const canManage = role === "admin" || role === "manager";

  if (!canManage) {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    orderBy: [{ createdAt: "asc" }],
  });

  return (
    <div className="stack bg-background text-foreground">
      <section className="card bg-white text-foreground">
        <div className="page-header">
          <div>
            <h1 className="text-2xl font-bold text-foreground">ユーザー管理</h1>
            <p className="text-sm text-muted-foreground">
              管理者とマネージャーはユーザーの作成と権限変更ができます。その他のユーザーはこのページへアクセスできません。
            </p>
          </div>
          <SignOutButton />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          権限のある場合のみ、新規作成やステータス変更を行ってください。
        </p>
      </section>

      <section className="card bg-white text-foreground">
        <UsersClient canManage={canManage} />
      </section>

      <section className="card bg-white text-foreground">
        <h2 className="text-xl font-semibold text-foreground">既存ユーザー</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="table">
            <caption className="text-sm text-muted-foreground">{users.length}名のユーザー</caption>
            <thead className="text-sm text-muted-foreground">
              <tr>
                <th scope="col" className="text-left font-medium text-foreground">氏名</th>
                <th scope="col" className="text-left font-medium text-foreground">メールアドレス</th>
                <th scope="col" className="text-left font-medium text-foreground">権限</th>
                <th scope="col" className="text-left font-medium text-foreground">ステータス</th>
                <th scope="col" className="text-left font-medium text-foreground">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isSelf = session.user.id === user.id;
                const disabled = !canManage || isSelf;

                return (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <form action={updateUserRoleAction} className="inline-form">
                        <input type="hidden" name="userId" value={user.id} />
                        <select
                          name="role"
                          className="select bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          defaultValue={user.role}
                          disabled={disabled}
                        >
                          {ROLE_OPTIONS.map((roleOption) => (
                            <option key={roleOption} value={roleOption}>
                              {ROLE_LABELS[roleOption]}
                            </option>
                          ))}
                        </select>
                        <button type="submit" className="button secondary disabled:opacity-50" disabled={disabled}>
                          更新
                        </button>
                      </form>
                    </td>
                    <td>{user.isActive ? "有効" : "無効"}</td>
                    <td>
                      <form action={toggleUserActiveAction} className="inline-form">
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="isActive" value={(!user.isActive).toString()} />
                        <button
                          type="submit"
                          className={`button ${user.isActive ? "secondary" : ""} disabled:opacity-50`}
                          disabled={disabled}
                        >
                          {user.isActive ? "無効化" : "有効化"}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          無効化されたアカウントは再度有効化するまでサインインできません。少なくとも1名の管理者を有効に保ってください。
        </p>
      </section>

      <p className="text-sm text-muted-foreground">
        <Link href="/dashboard" className="text-foreground underline">
          ダッシュボードへ戻る
        </Link>
      </p>
    </div>
  );
}
