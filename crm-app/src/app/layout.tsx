import type { Metadata } from 'next';
import { Inter, Roboto_Mono } from 'next/font/google';

import { Providers } from '@/components/providers';
import { auth } from '@/lib/auth';

import './globals.css';

const sans = Inter({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const mono = Roboto_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'CRM Admin Portal',
  description: 'Secure CRM administration surface with RBAC.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={`${sans.variable} ${mono.variable} antialiased`}>
        <Providers session={session}>
          <div className="app-shell">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
