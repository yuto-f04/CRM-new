import Link from 'next/link';
import { redirect } from 'next/navigation';

import { SignOutButton } from '@/components/sign-out-button';
import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertRole } from '@/lib/rbac';
import { ROLE_OPTIONS } from '@/lib/roles';

import { CreateUserForm } from './create-user-form';
import { toggleUserActiveAction, updateUserRoleAction } from './actions';

export default async function AdminUsersPage() {
  const session = await getAuthSession();

  if (!session) {
    redirect('/login');
  }

  assertRole(session, 'admin');

  const users = await prisma.user.findMany({
    orderBy: [{ createdAt: 'asc' }],
  });

  return (
    <div className="stack">
      <div className="card">
        <div className="page-header">
          <div>
            <h1>User management</h1>
            <p>Provision and maintain user accounts for the CRM platform.</p>
          </div>
          <SignOutButton />
        </div>
        <p style={{ marginTop: '1rem' }}>Admins can create new accounts and adjust roles. Non-admins cannot access this page.</p>
      </div>

      <div className="card">
        <h2>Create a new user</h2>
        <CreateUserForm />
      </div>

      <div className="card">
        <h2>Existing users</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <caption>{users.length} users</caption>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Role</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <form action={updateUserRoleAction} className="inline-form">
                      <input type="hidden" name="userId" value={user.id} />
                      <select name="role" className="select" defaultValue={user.role} disabled={session.user.id === user.id}>
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                      <button type="submit" className="button secondary" disabled={session.user.id === user.id}>
                        Update
                      </button>
                    </form>
                  </td>
                  <td>{user.isActive ? 'Active' : 'Disabled'}</td>
                  <td>
                    <form action={toggleUserActiveAction} className="inline-form">
                      <input type="hidden" name="userId" value={user.id} />
                      <input type="hidden" name="isActive" value={(!user.isActive).toString()} />
                      <button
                        type="submit"
                        className={`button ${user.isActive ? 'secondary' : ''}`}
                        disabled={session.user.id === user.id}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'rgba(15, 23, 42, 0.7)' }}>
          Tip: Deactivated accounts cannot sign in until re-enabled. At least one admin must remain active.
        </p>
      </div>

      <p style={{ fontSize: '0.9rem' }}>
        <Link href="/dashboard">Back to dashboard</Link>
      </p>
    </div>
  );
}
