import "./globals.css";

import { Inter } from "next/font/google";
import type { Metadata } from "next";
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="ja" className="light" suppressHydrationWarning>
      <head>
        {/* UAのダーク配色を抑止 */}
        <meta name="color-scheme" content="light" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body
        // 最優先のフォールバック（何があっても白/濃い文字）
        style={{ backgroundColor: "#fff", color: "#111" }}
        className={cn(
          "min-h-screen bg-background text-foreground antialiased",
          inter.className
        )}
      >
        <AppProviders>
          <SessionProviders session={session}>
            <div id="root-app" className="app-shell">
              {children}
            </div>
          </SessionProviders>
        </AppProviders>
      </body>
    </html>
  );
}
