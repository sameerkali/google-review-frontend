"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { makeQueryClient } from "@/lib/queryClient";
import { QueryDevtools } from "@/components/QueryDevtools";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Lazy-initialized, one instance per mount — never a module-scope
  // singleton, which would leak cached data across requests/users under
  // Next.js App Router's server-side module reuse.
  const [client] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={client}>
      {children}
      <QueryDevtools />
    </QueryClientProvider>
  );
}
