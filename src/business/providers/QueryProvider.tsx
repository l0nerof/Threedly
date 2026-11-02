"use client";

import { useFavoritesSession } from "@/src/business/hooks/useFavoritesSession";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

type QueryProviderProps = {
  children: ReactNode;
};

function FavoritesSessionSync() {
  useFavoritesSession();
  return null;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <FavoritesSessionSync />
      {children}
    </QueryClientProvider>
  );
}
