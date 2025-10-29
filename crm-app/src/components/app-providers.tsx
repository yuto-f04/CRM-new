"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { useState, type ReactNode } from "react";

type Props = {
  session: Session | null;
  children: ReactNode;
};

export function AppProviders({ session, children }: Props) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </SessionProvider>
  );
}
