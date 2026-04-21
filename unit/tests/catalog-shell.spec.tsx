import CatalogShell from "@/src/app/[locale]/(main-pages)/catalog/components/CatalogShell";
import {
  describe,
  expect,
  fireEvent,
  it,
  render,
  screen,
  within,
} from "../fixtures";

const content = {
  badge: "Catalog",
  title: "Find 3D models faster",
  subtitle: "Use search and filters together.",
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
    },
    format: {
      title: "Format",
      description: "Filter by file format.",
    },
  },
  resultsArea: {
    ariaLabel: "Catalog results area",
    title: "Model cards",
    description: "Real models arrive next.",
    paginationLabel: "Pagination",
  },
};

const categories = [
  { value: "chairs", label: "Chairs" },
  { value: "lighting", label: "Lighting" },
];

const planOptions = [
  { value: "free", label: "Free", description: "Entry" },
  { value: "pro", label: "Pro", description: "Professional" },
  { value: "max", label: "Max", description: "Highest tier" },
] as const;

const formatOptions = [
  { value: "glb", label: "GLB", description: "Preview friendly" },
  { value: "fbx", label: "FBX", description: "Exchange format" },
  { value: "max", label: "MAX", description: "3ds Max" },
] as const;

const sortOptions = [
  {
    value: "curated",
    label: "Curated first",
    description: "Premium discovery order",
  },
  {
    value: "fresh",
    label: "Newest arrivals",
    description: "Latest additions first",
  },
  {
    value: "downloads",
    label: "Most downloaded",
    description: "Demand-led order",
  },
] as const;

function renderCatalogShell(initialCategories: string[] = []) {
  return render(
    <CatalogShell
      categories={categories}
      planOptions={[...planOptions]}
      formatOptions={[...formatOptions]}
      sortOptions={[...sortOptions]}
      initialCategories={initialCategories}
      content={content}
    />,
  );
}

describe("CatalogShell", () => {
  it("opens the mobile filters sheet", () => {
    renderCatalogShell();

    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Filters" }));

    expect(screen.getByRole("dialog")).not.toBeNull();
  });

  it("updates local filter state and resets back to defaults", () => {
    renderCatalogShell();

    const searchInput = screen.getByRole("textbox", {
      name: "Search catalog",
    }) as HTMLInputElement;
    const desktopFilters = screen.getAllByLabelText("Filters")[0];
    const activeFilters = screen.getByLabelText("Active filters");

    fireEvent.change(searchInput, { target: { value: "oak" } });
    fireEvent.click(
      within(desktopFilters).getByRole("checkbox", { name: "Lighting" }),
    );
    fireEvent.click(
      within(desktopFilters).getByRole("checkbox", { name: /Pro/i }),
    );

    expect(
      within(activeFilters).getByRole("button", { name: /oak/i }),
    ).not.toBeNull();
    expect(
      within(activeFilters).getByRole("button", { name: /Lighting/i }),
    ).not.toBeNull();
    expect(
      within(activeFilters).getByRole("button", { name: /Pro/i }),
    ).not.toBeNull();

    fireEvent.click(screen.getAllByRole("button", { name: "Reset" })[0]);

    expect(searchInput.value).toBe("");
    expect(activeFilters.textContent).toContain("No active filters yet");
    expect(
      within(desktopFilters)
        .getByRole("checkbox", { name: /Pro/i })
        .getAttribute("data-state"),
    ).toBe("unchecked");
  });

  it("applies the initial category as the default selected filter", () => {
    renderCatalogShell(["chairs"]);

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
