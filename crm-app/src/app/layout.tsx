import type { Metadata } from 'next';
import { Inter, Roboto_Mono } from 'next/font/google';

import { Providers } from '@/components/providers';

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable} antialiased`}>
        <Providers>
          <div className="app-shell">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
