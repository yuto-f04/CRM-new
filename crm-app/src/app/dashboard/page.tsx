import Link from 'next/link';
import { redirect } from 'next/navigation';

import { SignOutButton } from '@/components/sign-out-button';
import { getAuthSession } from '@/lib/auth';
import { hasAtLeastManager, isAdmin } from '@/lib/rbac';

export default async function DashboardPage() {
  const session = await getAuthSession();

  if (!session) {
    redirect('/login');
  }

  const items: Array<{ href: string; label: string; requireAdmin?: boolean }> = [
    { href: '/dashboard', label: 'Home' },
    { href: '/admin/users', label: 'User management', requireAdmin: true },
  ];

  return (
    <div className="card">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>
            Welcome back, {session.user.name ?? session.user.email}. You are signed in as <strong>{session.user.role}</strong>.
          </p>
        </div>
        <SignOutButton />
      </div>

      <section style={{ marginTop: '1.5rem' }}>
        <h2>Quick links</h2>
        <ul style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {items
            .filter((item) => !item.requireAdmin || isAdmin(session))
            .map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
        </ul>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Current access</h2>
        <ul style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li>
            Role: <strong>{session.user.role}</strong>
          </li>
          <li>Manager privileges: {hasAtLeastManager(session) ? 'Yes' : 'No'}</li>
          <li>Email: {session.user.email}</li>
        </ul>
      </section>
    </div>
  );
}
