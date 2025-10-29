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
    <div className="bg-background text-foreground">
      <section className="mx-auto max-w-5xl p-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Welcome back, {session.user.name ?? session.user.email}. You are signed in as{" "}
              <span className="font-medium text-foreground">{session.user.role}</span>.
            </p>
          </div>
          <SignOutButton />
        </header>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-foreground">Quick links</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
            {items
              .filter((item) => !item.requireAdmin || isAdmin(session))
              .map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="underline decoration-muted-foreground hover:decoration-foreground">
                    {item.label}
                  </Link>
                </li>
              ))}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-foreground">Current access</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
            <li>
              Role: <span className="font-semibold text-foreground">{session.user.role}</span>
            </li>
            <li>Manager privileges: {hasAtLeastManager(session) ? "Yes" : "No"}</li>
            <li>Email: {session.user.email}</li>
          </ul>
        </section>
      </section>
    </div>
  );
}
