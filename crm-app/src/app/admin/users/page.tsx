import Link from 'next/link';
import { redirect } from 'next/navigation';

import { type Role } from '@prisma/client';

import { SignOutButton } from '@/components/sign-out-button';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ROLE_OPTIONS } from '@/lib/roles';

import UsersClient from './users-client';
import { toggleUserActiveAction, updateUserRoleAction } from './actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ROLE_LABELS: Record<Role, string> = {
  admin: '管理者',
  manager: 'マネージャー',
  member: 'メンバー',
  viewer: '閲覧者',
};

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  const role = (session.user.role ?? 'member') as Role;
  const canManage = role === 'admin' || role === 'manager';

  if (!canManage) {
    redirect('/');
  }

  const users = await prisma.user.findMany({
    orderBy: [{ createdAt: 'asc' }],
  });

  return (
    <div className="stack text-gray-900">
      <section className="card bg-white">
        <div className="page-header">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ユーザー管理</h1>
            <p className="text-sm text-gray-600">
              管理者・マネージャーはユーザーの作成と権限変更ができます。その他のユーザーはこのページにアクセスできません。
            </p>
          </div>
          <SignOutButton />
        </div>
        <p className="mt-4 text-sm text-gray-600">必要な権限を持つ場合のみ、ユーザーの新規作成やステータス変更を行ってください。</p>
      </section>

      <section className="card bg-white">
        <UsersClient canManage={canManage} />
      </section>

      <section className="card bg-white">
        <h2 className="text-xl font-semibold text-gray-900">既存ユーザー</h2>
        <div className="mt-4 overflow-x-auto text-gray-900">
          <table className="table text-gray-900">
            <caption className="text-sm text-gray-600">{users.length}名のユーザー</caption>
            <thead className="text-gray-700">
              <tr>
                <th scope="col">氏名</th>
                <th scope="col">メールアドレス</th>
                <th scope="col">権限</th>
                <th scope="col">ステータス</th>
                <th scope="col">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isSelf = session.user.id === user.id;
                const disabled = !canManage || isSelf;

                return (
                  <tr key={user.id} className="text-gray-900">
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <form action={updateUserRoleAction} className="inline-form">
                        <input type="hidden" name="userId" value={user.id} />
                        <select
                          name="role"
                          className="select bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/30"
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
                    <td>{user.isActive ? '有効' : '無効'}</td>
                    <td>
                      <form action={toggleUserActiveAction} className="inline-form">
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="isActive" value={(!user.isActive).toString()} />
                        <button
                          type="submit"
                          className={`button ${user.isActive ? 'secondary' : ''} disabled:opacity-50`}
                          disabled={disabled}
                        >
                          {user.isActive ? '無効化' : '有効化'}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-gray-600">
          ヒント: 無効化されたアカウントは再度有効化するまでサインインできません。少なくとも1人の管理者を有効に保ってください。
        </p>
      </section>

      <p className="text-sm">
        <Link href="/dashboard" className="text-blue-600 underline">
          ダッシュボードへ戻る
        </Link>
      </p>
    </div>
  );
}
