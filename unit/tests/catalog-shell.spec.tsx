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
      group: {
        title: "Group",
        description: "Select a whole catalog area.",
      },
      category: {
        title: "Category",
        description: "You can select more than one category.",
        empty: "Category data is not available yet",
        pickerButton: "Choose categories",
        pickerTitle: "Choose categories",
        pickerDescription: "Search groups and categories.",
        searchPlaceholder: "Search categories",
        emptySearch: "No matching categories.",
        pickerDone: "Done",
        showMore: "Show {count} more",
        showLess: "Show less",
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

const categoryGroups = [
  {
    value: "furniture",
    label: "Furniture",
    categories: [
      {
        id: "00000000-0000-0000-0000-000000000001",
        value: "chairs",
        label: "Chairs",
      },
    ],
  },
  {
    value: "decor",
    label: "Decor",
    categories: [
      {
        id: "00000000-0000-0000-0000-000000000004",
        value: "lighting",
        label: "Lighting",
      },
    ],
  },
];

const denseCategoryGroups = [
  categoryGroups[0],
  {
    value: "decor",
    label: "Decor",
    categories: [
      {
        id: "00000000-0000-0000-0000-000000000004",
        value: "lighting",
        label: "Lighting",
      },
      {
        id: "00000000-0000-0000-0000-000000000005",
        value: "vases",
        label: "Vases",
      },
      {
        id: "00000000-0000-0000-0000-000000000006",
        value: "rugs",
        label: "Rugs",
      },
      {
        id: "00000000-0000-0000-0000-000000000007",
        value: "mirrors",
        label: "Mirrors",
      },
      {
        id: "00000000-0000-0000-0000-000000000008",
        value: "curtains",
        label: "Curtains",
      },
      {
        id: "00000000-0000-0000-0000-000000000009",
        value: "clocks",
        label: "Clocks",
      },
    ],
  },
];

function renderCatalogShell(paramsString = "", groups = categoryGroups) {
  mockSearchParamsValue = paramsString;
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <CatalogShell categoryGroups={groups} />
    </NextIntlClientProvider>,
  );
}

function openDesktopCategoryPicker() {
  const desktopFilters = screen.getAllByLabelText("Filters")[0];

  fireEvent.click(
    within(desktopFilters).getByRole("button", {
      name: "Choose categories",
    }),
  );

  return screen.getByRole("dialog", { name: "Choose categories" });
}

function closeCategoryPicker(picker: HTMLElement) {
  fireEvent.click(within(picker).getByRole("button", { name: "Done" }));
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
    const picker = openDesktopCategoryPicker();

    // Toggle → apply button appears → clicking it commits to router
    fireEvent.click(within(picker).getByRole("checkbox", { name: "Lighting" }));
    closeCategoryPicker(picker);
    fireEvent.click(
      within(desktopFilters).getByRole("button", { name: "Show 42 models" }),
    );
    expect(mockPushFn).toHaveBeenCalledWith(
      expect.stringContaining("category=lighting"),
      expect.anything(),
    );
  });

  it("pushes group param and clears category selections via deferred apply button", () => {
    mockPushFn = vi.fn();
    renderCatalogShell("category=chairs");

    const desktopFilters = screen.getAllByLabelText("Filters")[0];
    const picker = openDesktopCategoryPicker();

    fireEvent.click(within(picker).getByRole("checkbox", { name: "Decor" }));
    closeCategoryPicker(picker);
    fireEvent.click(
      within(desktopFilters).getByRole("button", { name: "Show 42 models" }),
    );

    expect(mockPushFn).toHaveBeenCalledWith(
      expect.stringContaining("group=decor"),
      expect.anything(),
    );
    expect(mockPushFn).toHaveBeenCalledWith(
      expect.not.stringContaining("category=chairs"),
      expect.anything(),
    );
  });

  it("pushes multiple group values via deferred apply button", () => {
    mockPushFn = vi.fn();
    renderCatalogShell();

    const desktopFilters = screen.getAllByLabelText("Filters")[0];
    const picker = openDesktopCategoryPicker();

    fireEvent.click(
      within(picker).getByRole("checkbox", { name: "Furniture" }),
    );
    fireEvent.click(within(picker).getByRole("checkbox", { name: "Decor" }));
    closeCategoryPicker(picker);
    fireEvent.click(
      within(desktopFilters).getByRole("button", { name: "Show 42 models" }),
    );

    const pushedUrl = String(mockPushFn.mock.calls.at(-1)?.[0]);

    expect(decodeURIComponent(pushedUrl)).toContain("group=furniture,decor");
  });

  it("gives category selections priority over multiple groups", () => {
    mockPushFn = vi.fn();
    renderCatalogShell("group=furniture,decor");

    const desktopFilters = screen.getAllByLabelText("Filters")[0];
    const picker = openDesktopCategoryPicker();

    fireEvent.click(within(picker).getByRole("checkbox", { name: "Lighting" }));
    closeCategoryPicker(picker);
    fireEvent.click(
      within(desktopFilters).getByRole("button", { name: "Show 42 models" }),
    );

    const pushedUrl = String(mockPushFn.mock.calls.at(-1)?.[0]);

    expect(pushedUrl).toContain("category=lighting");
    expect(pushedUrl).not.toContain("group=");
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
    expect(within(desktopFilters).queryByText("1 selected")).toBeNull();
    expect(within(desktopFilters).queryByText("Chairs")).toBeNull();

    const picker = openDesktopCategoryPicker();
    expect(
      within(picker)
        .getByRole("checkbox", { name: "Chairs" })
        .getAttribute("data-state"),
    ).toBe("checked");
  });

  it("pre-selects groups from URL search params", () => {
    renderCatalogShell("group=furniture,decor");

    const activeFilters = screen.getByLabelText("Active filters");

    expect(
      within(activeFilters).getByRole("button", { name: /Furniture/i }),
    ).not.toBeNull();
    expect(
      within(activeFilters).getByRole("button", { name: /Decor/i }),
    ).not.toBeNull();
    const picker = openDesktopCategoryPicker();
    expect(
      within(picker)
        .getByRole("checkbox", { name: "Furniture" })
        .getAttribute("data-state"),
    ).toBe("checked");
    expect(
      within(picker)
        .getByRole("checkbox", { name: "Decor" })
        .getAttribute("data-state"),
    ).toBe("checked");
  });

  it("keeps the count button accurate when removing the last URL group filter", () => {
    renderCatalogShell("group=decor");

    const desktopFilters = screen.getAllByLabelText("Filters")[0];
    const picker = openDesktopCategoryPicker();

    fireEvent.click(within(picker).getByRole("checkbox", { name: "Decor" }));
    closeCategoryPicker(picker);

    expect(
      within(desktopFilters).getByRole("button", { name: "Show 42 models" }),
    ).not.toBeNull();
  });

  it("keeps category filters in a separate searchable picker", () => {
    renderCatalogShell("", denseCategoryGroups);

    const desktopFilters = screen.getAllByLabelText("Filters")[0];

    expect(
      within(desktopFilters).queryByRole("checkbox", { name: "Clocks" }),
    ).toBeNull();
    const picker = openDesktopCategoryPicker();

    expect(
      within(picker).getByRole("checkbox", { name: "Clocks" }),
    ).not.toBeNull();

    fireEvent.change(
      within(picker).getByRole("textbox", { name: "Search categories" }),
      { target: { value: "clock" } },
    );

    expect(
      within(picker).getByRole("checkbox", { name: "Clocks" }),
    ).not.toBeNull();
    expect(
      within(picker).queryByRole("checkbox", { name: "Lighting" }),
    ).toBeNull();
  });
});
