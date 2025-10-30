import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

import { SignOutButton } from "@/components/sign-out-button";
import { prisma } from "@/lib/prisma";
import { ROLE_OPTIONS } from "@/lib/roles";

import UsersClient from "./users-client";
import { toggleUserActiveAction, updateUserRoleAction } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Role = (typeof ROLE_OPTIONS)[number];

const ROLE_LABELS: Record<Role, string> = {
  admin: "管理者",
  manager: "マネージャー",
  member: "メンバー",
  viewer: "閲覧者",
};

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user?.role !== "admin") redirect("/dashboard");

  const role = (session.user.role ?? "member") as Role;
  const canManage = role === "admin" || role === "manager";

  const users = await prisma.users.findMany({
    orderBy: [{ created_at: "asc" }],
  });

  return (
    <div className="stack bg-background text-foreground">
      <section className="card bg-white text-foreground">
        <div className="page-header">
          <div>
            <h1 className="text-2xl font-bold text-foreground">繝ｦ繝ｼ繧ｶ繝ｼ邂｡逅・/h1>
            <p className="text-sm text-muted-foreground">
              邂｡逅・・→繝槭ロ繝ｼ繧ｸ繝｣繝ｼ縺ｯ繝ｦ繝ｼ繧ｶ繝ｼ縺ｮ菴懈・縺ｨ讓ｩ髯仙､画峩縺後〒縺阪∪縺吶ゅ◎縺ｮ莉悶・繝ｦ繝ｼ繧ｶ繝ｼ縺ｯ縺薙・繝壹・繧ｸ縺ｸ繧｢繧ｯ繧ｻ繧ｹ縺ｧ縺阪∪縺帙ｓ縲・            </p>
          </div>
          <SignOutButton />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          讓ｩ髯舌・縺ゅｋ蝣ｴ蜷医・縺ｿ縲∵眠隕丈ｽ懈・繧・せ繝・・繧ｿ繧ｹ螟画峩繧定｡後▲縺ｦ縺上□縺輔＞縲・        </p>
      </section>

      <section className="card bg-white text-foreground">
        <UsersClient canManage={canManage} />
      </section>

      <section className="card bg-white text-foreground">
        <h2 className="text-xl font-semibold text-foreground">譌｢蟄倥Θ繝ｼ繧ｶ繝ｼ</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="table">
            <caption className="text-sm text-muted-foreground">{users.length}蜷阪・繝ｦ繝ｼ繧ｶ繝ｼ</caption>
            <thead className="text-sm text-muted-foreground">
              <tr>
                <th scope="col" className="text-left font-medium text-foreground">豌丞錐</th>
                <th scope="col" className="text-left font-medium text-foreground">繝｡繝ｼ繝ｫ繧｢繝峨Ξ繧ｹ</th>
                <th scope="col" className="text-left font-medium text-foreground">讓ｩ髯・/th>
                <th scope="col" className="text-left font-medium text-foreground">繧ｹ繝・・繧ｿ繧ｹ</th>
                <th scope="col" className="text-left font-medium text-foreground">謫堺ｽ・/th>
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
                          譖ｴ譁ｰ
                        </button>
                      </form>
                    </td>
                    <td>{user.is_active ? "譛牙柑" : "辟｡蜉ｹ"}</td>
                    <td>
                      <form action={toggleUserActiveAction} className="inline-form">
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="isActive" value={(!user.is_active).toString()} />
                        <button
                          type="submit"
                          className={`button ${user.is_active ? "secondary" : ""} disabled:opacity-50`}
                          disabled={disabled}
                        >
                          {user.is_active ? "辟｡蜉ｹ蛹・ : "譛牙柑蛹・}
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
          辟｡蜉ｹ蛹悶＆繧後◆繧｢繧ｫ繧ｦ繝ｳ繝医・蜀榊ｺｦ譛牙柑蛹悶☆繧九∪縺ｧ繧ｵ繧､繝ｳ繧､繝ｳ縺ｧ縺阪∪縺帙ｓ縲ょｰ代↑縺上→繧・蜷阪・邂｡逅・・ｒ譛牙柑縺ｫ菫昴▲縺ｦ縺上□縺輔＞縲・        </p>
      </section>

      <p className="text-sm text-muted-foreground">
        <Link href="/dashboard" className="text-foreground underline">
          繝繝・す繝･繝懊・繝峨∈謌ｻ繧・        </Link>
      </p>
    </div>
  );
}
