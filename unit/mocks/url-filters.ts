import { vi } from "vitest";

type RouterPush = ReturnType<
  typeof import("next/navigation").useRouter
>["push"];

export const urlFiltersNavigation = {
  search: "",
  pathname: "/en/catalog",
  push: vi.fn<RouterPush>(),
};

export function resetUrlFiltersNavigation(search = "") {
  urlFiltersNavigation.search = search;
  urlFiltersNavigation.pathname = "/en/catalog";
  urlFiltersNavigation.push.mockReset();
}

export function createUrlFiltersNavigationMock() {
  return {
    useRouter: () => ({ push: urlFiltersNavigation.push }),
    usePathname: () => urlFiltersNavigation.pathname,
    useSearchParams: () => new URLSearchParams(urlFiltersNavigation.search),
  };
}
