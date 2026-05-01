import CatalogShell from "@/src/app/[locale]/(main-pages)/catalog/components/CatalogShell";
import { NextIntlClientProvider } from "next-intl";
import { vi } from "vitest";
import {
  describe,
  expect,
  fireEvent,
  it,
  render,
  screen,
  within,
} from "../fixtures";

let mockSearchParamsValue = "";
let mockPushFn = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPushFn }),
  useSearchParams: () => new URLSearchParams(mockSearchParamsValue),
  usePathname: () => "/en/catalog",
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryKey }: { queryKey: readonly unknown[] }) => {
    if (
      queryKey[0] === "catalog" &&
      queryKey[1] === "models" &&
      queryKey[2] === "count"
    ) {
      return { data: 42, isLoading: false, isError: false, isFetching: false };
    }
    return {
      data: undefined,
      isLoading: true,
      isError: false,
      isFetching: false,
    };
  },
}));

const messages = {
  Catalog: {
    title: "Find 3D models faster",
    searchLabel: "Search catalog",
    searchPlaceholder: "Search by model or material",
    mobileFiltersButton: "Filters",
    sortLabel: "Sort",
    resetFilters: "Reset",
    activeFiltersLabel: "Active filters",
    noActiveFilters: "No active filters yet",
    removeFilter: "Remove filter",
    filtersPanel: {
      title: "Filters",
      description: "Refine the catalog for your workflow.",
      showCount: "{count, plural, one {Show # model} other {Show # models}}",
      countLoading: "Searching...",
    },
    filters: {
      category: {
        title: "Category",
        description: "You can select more than one category.",
        empty: "Category data is not available yet",
      },
      plan: {
        title: "Plan",
        description: "Filter by access tier.",
        options: {
          free: { label: "Free", description: "Entry" },
          pro: { label: "Pro", description: "Professional" },
          max: { label: "Max", description: "Highest tier" },
        },
      },
      format: {
        title: "Format",
        description: "Filter by file format.",
        options: {
          glb: { label: "GLB", description: "Preview friendly" },
          fbx: { label: "FBX", description: "Exchange format" },
          max: { label: "MAX", description: "3ds Max" },
        },
      },
    },
    sortOptions: {
      curated: {
        label: "Curated first",
        description: "Premium discovery order",
      },
      fresh: {
        label: "Newest arrivals",
        description: "Latest additions first",
      },
      downloads: { label: "Most downloaded", description: "Demand-led order" },
    },
    resultsArea: {
      ariaLabel: "Catalog results area",
      title: "Model catalog",
      description: "Browse available 3D models.",
      count: "{count} models",
      pageOf: "Page {page} of {total}",
      empty: "No models found.",
      error: "Failed to load models.",
      paginationLabel: "Pagination",
      previousPage: "Previous page",
      nextPage: "Next page",
      modelCard: {
        downloads: "{count} downloads",
        planBadge: { free: "Free", pro: "Pro", max: "Max" },
        previewButton: "Preview",
        downloadButton: "Download",
      },
    },
  },
};

const categories = [
  { value: "chairs", label: "Chairs" },
  { value: "lighting", label: "Lighting" },
];

function renderCatalogShell(paramsString = "") {
  mockSearchParamsValue = paramsString;
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <CatalogShell categories={categories} />
    </NextIntlClientProvider>,
  );
}

describe("CatalogShell", () => {
  it("opens the mobile filters sheet", () => {
    renderCatalogShell();

    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Filters" }));

    expect(screen.getByRole("dialog")).not.toBeNull();
  });

  it("pushes category param to router via deferred apply button", () => {
    mockPushFn = vi.fn();
    renderCatalogShell();

    const searchInput = screen.getByRole("textbox", {
      name: "Search catalog",
    }) as HTMLInputElement;
    const desktopFilters = screen.getAllByLabelText("Filters")[0];

    // Typing updates the local input immediately (debounce handles URL sync async)
    fireEvent.change(searchInput, { target: { value: "oak" } });
    expect(searchInput.value).toBe("oak");

    // Toggle → apply button appears → clicking it commits to router
    fireEvent.click(
      within(desktopFilters).getByRole("checkbox", { name: "Lighting" }),
    );
    fireEvent.click(
      within(desktopFilters).getByRole("button", { name: "Show 42 models" }),
    );
    expect(mockPushFn).toHaveBeenCalledWith(
      expect.stringContaining("category=lighting"),
      expect.anything(),
    );
  });

  it("pushes plan param to router via deferred apply button", () => {
    mockPushFn = vi.fn();
    renderCatalogShell();

    const desktopFilters = screen.getAllByLabelText("Filters")[0];

    // Toggle plan → apply button appears → clicking it commits to router
    fireEvent.click(
      within(desktopFilters).getByRole("checkbox", { name: /Pro/i }),
    );
    fireEvent.click(
      within(desktopFilters).getByRole("button", { name: "Show 42 models" }),
    );
    expect(mockPushFn).toHaveBeenCalledWith(
      expect.stringContaining("plans=pro"),
      expect.anything(),
    );
  });

  it("navigates to clean pathname when Reset is clicked", () => {
    mockPushFn = vi.fn();
    // Pre-set URL params so hasActiveFilters = true and Reset button is visible
    renderCatalogShell("category=chairs");

    fireEvent.click(screen.getAllByRole("button", { name: "Reset" })[0]);
    expect(mockPushFn).toHaveBeenCalledWith("/en/catalog", expect.anything());
  });

  it("pre-selects categories from URL search params", () => {
    renderCatalogShell("category=chairs");

    const activeFilters = screen.getByLabelText("Active filters");
    const desktopFilters = screen.getAllByLabelText("Filters")[0];

    expect(
      within(activeFilters).getByRole("button", { name: /Chairs/i }),
    ).not.toBeNull();
    expect(
      within(desktopFilters)
        .getByRole("checkbox", { name: "Chairs" })
        .getAttribute("data-state"),
    ).toBe("checked");
  });
});
