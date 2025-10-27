import Link from 'next/link';
import { redirect } from 'next/navigation';

import { LoginForm } from '@/components/login-form';
import { getAuthSession } from '@/lib/auth';

export default async function LoginPage() {
  const session = await getAuthSession();
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="card" style={{ maxWidth: '420px', margin: '0 auto' }}>
      <h1>Sign in</h1>
      <p style={{ marginTop: 0, marginBottom: '1.5rem', color: 'rgba(15, 23, 42, 0.7)' }}>
        Use your administrator credentials to access the CRM console.
      </p>
      <LoginForm />
      <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: 'rgba(15, 23, 42, 0.7)' }}>
        Need an account? Ask an administrator to provision it from the admin portal.
      </p>
      <p style={{ marginTop: '0.5rem' }}>
        <Link href="/">Return to dashboard</Link>
      </p>
    </div>
  );
}
