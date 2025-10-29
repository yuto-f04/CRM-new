import Link from 'next/link';
import { redirect } from 'next/navigation';

import { SignOutButton } from '@/components/sign-out-button';
import { auth } from '@/lib/auth';
import { hasAtLeastManager, isAdmin } from '@/lib/rbac';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const items: Array<{ href: string; label: string; requireAdmin?: boolean }> = [
    { href: '/dashboard', label: 'Home' },
    { href: '/admin/users', label: 'User management', requireAdmin: true },
  ];

  return (
    <div className="card bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-50">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Welcome back, {session.user.name ?? session.user.email}. You are signed in as{' '}
            <span className="font-semibold text-gray-900 dark:text-gray-50">{session.user.role}</span>.
          </p>
        </div>
        <SignOutButton />
      </div>

      <section className="mt-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Quick links</h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm text-gray-700 dark:text-gray-200">
          {items
            .filter((item) => !item.requireAdmin || isAdmin(session))
            .map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="underline decoration-gray-400 hover:decoration-gray-600 dark:decoration-gray-500">
                  {item.label}
                </Link>
              </li>
            ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Current access</h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm text-gray-700 dark:text-gray-200">
          <li>
            Role:{' '}
            <span className="font-semibold text-gray-900 dark:text-gray-50">
              {session.user.role}
            </span>
          </li>
          <li>Manager privileges: {hasAtLeastManager(session) ? 'Yes' : 'No'}</li>
          <li>Email: {session.user.email}</li>
        </ul>
      </section>
    </div>
  );
}
