import { Inter } from "next/font/google";
import type { Metadata } from "next";

import "./globals.css";
import AppProviders from "./app-providers";
import { AppProviders as SessionProviders } from "@/components/app-providers";
import { auth } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"] });

function cn(...inputs: Array<string | false | undefined>) {
  return inputs.filter(Boolean).join(" ");
}

export const metadata: Metadata = {
  title: "CRM Admin Portal",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light" />
      </head>
      <body className={cn("min-h-screen bg-white text-gray-900 antialiased", inter.className)}>
        <AppProviders>
          <SessionProviders session={session}>
            <div className="app-shell">{children}</div>
          </SessionProviders>
        </AppProviders>
      </body>
    </html>
  );
}
