import Link from 'next/link';
import { redirect } from 'next/navigation';

import { type Role } from '@prisma/client';

import { SignOutButton } from '@/components/sign-out-button';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ROLE_OPTIONS } from '@/lib/roles';

import UsersClient from './users-client';
import { toggleUserActiveAction, updateUserRoleAction } from './actions';

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

  const role = (session.user.role ?? 'member') as 'admin' | 'manager' | 'member' | 'viewer';
  const canManage = role === 'admin' || role === 'manager';

  if (!canManage) {
    redirect('/');
  }

  const users = await prisma.user.findMany({
    orderBy: [{ createdAt: 'asc' }],
  });

  return (
    <div className="stack">
      <div className="card">
        <div className="page-header">
          <div>
            <h1>ユーザー管理</h1>
            <p>管理者・マネージャーはユーザーの作成と権限変更ができます。その他のユーザーはこのページにアクセスできません。</p>
          </div>
          <SignOutButton />
        </div>
        <p style={{ marginTop: '1rem' }}>
          必要な権限を持つ場合のみ、ユーザーの新規作成やステータス変更を行ってください。
        </p>
      </div>

      <div className="card">
        <UsersClient canManage={canManage} />
      </div>

      <div className="card">
        <h2>既存ユーザー</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <caption>{users.length}名のユーザー</caption>
            <thead>
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
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <form action={updateUserRoleAction} className="inline-form">
                        <input type="hidden" name="userId" value={user.id} />
                        <select name="role" className="select" defaultValue={user.role} disabled={disabled}>
                          {ROLE_OPTIONS.map((roleOption) => (
                            <option key={roleOption} value={roleOption}>
                              {ROLE_LABELS[roleOption]}
                            </option>
                          ))}
                        </select>
                        <button type="submit" className="button secondary" disabled={disabled}>
                          更新
                        </button>
                      </form>
                    </td>
                    <td>{user.isActive ? '有効' : '無効'}</td>
                    <td>
                      <form action={toggleUserActiveAction} className="inline-form">
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="isActive" value={(!user.isActive).toString()} />
                        <button type="submit" className={`button ${user.isActive ? 'secondary' : ''}`} disabled={disabled}>
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
        <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'rgba(15, 23, 42, 0.7)' }}>
          ヒント: 無効化されたアカウントは再度有効化するまでサインインできません。少なくとも1人の管理者を有効に保ってください。
        </p>
      </div>

      <p style={{ fontSize: '0.9rem' }}>
        <Link href="/dashboard">ダッシュボードへ戻る</Link>
      </p>
    </div>
  );
}
