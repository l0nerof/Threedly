import { useUrlFilters } from "@/src/shared/hooks/use-url-filters";
import { vi } from "vitest";
import {
  act,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  renderHook,
} from "../fixtures";
import {
  urlFiltersNavigation as navigation,
  resetUrlFiltersNavigation,
} from "../mocks/url-filters";

vi.mock("next/navigation", async () =>
  (await import("../mocks/url-filters")).createUrlFiltersNavigationMock(),
);

beforeEach(() => {
  resetUrlFiltersNavigation();
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

describe("URL search filters", () => {
  it("debounces typing, trims the search and resets pagination while retaining filters", () => {
    resetUrlFiltersNavigation("plans=pro&page=3");
    const { result } = renderHook(() => useUrlFilters());
    act(() => result.current.setSearchValue("  chair  "));
    act(() => vi.advanceTimersByTime(349));
    expect(navigation.push).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(navigation.push).toHaveBeenCalledTimes(1);
    const params = new URLSearchParams(navigation.push.mock.calls[0][0]);
    expect(params.get("q")).toBe("chair");
    expect(params.get("plans")).toBe("pro");
    expect(params.has("page")).toBe(false);
  });

  it("does not commit a search shorter than two characters", () => {
    resetUrlFiltersNavigation("q=chair&page=2");
    const { result } = renderHook(() => useUrlFilters());
    act(() => result.current.setSearchValue("x"));
    act(() => vi.advanceTimersByTime(350));
    expect(navigation.push).toHaveBeenCalledWith("?", { scroll: false });
  });

  it("restores an external URL search without pushing a stale value back", () => {
    resetUrlFiltersNavigation("q=chair");
    const { result, rerender } = renderHook(() => useUrlFilters());
    act(() => result.current.setSearchValue("local typing"));
    navigation.search = "q=sofa";
    rerender();
    expect(result.current.searchValue).toBe("sofa");
    expect(result.current.activeSearch).toBe("sofa");
    act(() => vi.advanceTimersByTime(350));
    expect(navigation.push).not.toHaveBeenCalled();
    navigation.search = "q=chair";
    rerender();
    expect(result.current.searchValue).toBe("chair");
    act(() => vi.advanceTimersByTime(350));
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it("keeps local typing when only another URL parameter changes", () => {
    resetUrlFiltersNavigation("q=chair");
    const { result, rerender } = renderHook(() => useUrlFilters());
    act(() => result.current.setSearchValue("local typing"));
    navigation.search = "q=chair&plans=max&page=2";
    rerender();
    expect(result.current.searchValue).toBe("local typing");
  });

  it("clears search on reset and does not replay it after the URL is reset", () => {
    resetUrlFiltersNavigation("q=chair&plans=pro&page=3");
    const { result, rerender } = renderHook(() => useUrlFilters());
    act(() => result.current.resetAll());
    expect(result.current.searchValue).toBe("");
    expect(navigation.push).toHaveBeenCalledWith("/en/catalog", {
      scroll: false,
    });
    navigation.search = "";
    rerender();
    act(() => vi.advanceTimersByTime(350));
    expect(navigation.push).toHaveBeenCalledTimes(1);
  });

  it("does not navigate after unmount with pending typing", () => {
    const { result, unmount } = renderHook(() => useUrlFilters());
    act(() => result.current.setSearchValue("pending"));
    unmount();
    act(() => vi.advanceTimersByTime(350));
    expect(navigation.push).not.toHaveBeenCalled();
  });
});
