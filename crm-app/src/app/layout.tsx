import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import Providers from "./providers";
import { AppProviders } from "@/components/app-providers";
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
    <html lang="ja" className="light" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light" />
      </head>
      <body className={cn("min-h-screen bg-background text-foreground antialiased", inter.className)}>
        <Providers>
          <AppProviders session={session}>
            <div className="app-shell">{children}</div>
          </AppProviders>
        </Providers>
      </body>
    </html>
  );
}
