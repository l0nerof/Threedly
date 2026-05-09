"use client";

import { useDebounce } from "@/src/shared/hooks/use-debounce";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const SEARCH_MIN_CHARS = 2;
const SEARCH_DEBOUNCE_MS = 350;

export function splitParam(value: string | null): string[] {
  if (!value) return [];
  return value.split(",").filter(Boolean);
}

export function parseListParam<T extends string>(
  value: string | null,
  allowed: readonly T[],
): T[] {
  if (!value) return [];
  return value
    .split(",")
    .filter((v): v is T => (allowed as readonly string[]).includes(v));
}

type UseUrlFiltersReturn = {
  searchValue: string;
  setSearchValue: (value: string) => void;
  activeSearch: string | undefined;
  applyFilter: (updates: Record<string, string | null>) => void;
  setPage: (page: number) => void;
  resetAll: () => void;
};

export function useUrlFilters(): UseUrlFiltersReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlSearch = searchParams.get("q") ?? "";
  const [searchValue, setSearchValue] = useState(urlSearch);
  const debouncedSearch = useDebounce(searchValue, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    setSearchValue(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    const effective =
      debouncedSearch.trim().length >= SEARCH_MIN_CHARS
        ? debouncedSearch.trim()
        : "";
    const current = searchParams.get("q") ?? "";
    if (effective === current) return;

    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (effective) {
      params.set("q", effective);
    } else {
      params.delete("q");
    }
    router.push(`?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const applyFilter = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const setPage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage === 1) {
      params.delete("page");
    } else {
      params.set("page", String(nextPage));
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const resetAll = () => {
    setSearchValue("");
    router.push(pathname, { scroll: false });
  };

  const activeSearch =
    urlSearch.trim().length >= SEARCH_MIN_CHARS ? urlSearch.trim() : undefined;

  return {
    searchValue,
    setSearchValue,
    activeSearch,
    applyFilter,
    setPage,
    resetAll,
  };
}
