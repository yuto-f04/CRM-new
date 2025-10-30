import "./globals.css";

import { Inter } from "next/font/google";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Providers from "@/components/providers";
import ClientOnly from "@/components/client-only";

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
  const session = await getServerSession(authOptions);

  return (
    <html lang="ja" className="light" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light" />
      </head>
      <body
        style={{ backgroundColor: "#fff", color: "#111" }}
        className={cn("min-h-screen antialiased", inter.className)}
      >
        <ClientOnly>
          <Providers session={session}>
            <div className="app-shell">{children}</div>
          </Providers>
        </ClientOnly>
      </body>
    </html>
  );
}