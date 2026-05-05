import messages from "@/messages/en.json";
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
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
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
      within(desktopFilters).getByRole("button", { name: "Show (42)" }),
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
      within(desktopFilters).getByRole("button", { name: "Show (42)" }),
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
