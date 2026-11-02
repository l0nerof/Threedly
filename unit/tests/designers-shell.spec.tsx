import messages from "@/messages/en.json";
import DesignersShell from "@/src/app/[locale]/(main-pages)/designers/components/DesignersShell";
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
  usePathname: () => "/en/designers",
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryKey }: { queryKey: readonly unknown[] }) => {
    if (queryKey[0] === "designers" && queryKey[1] === "count") {
      return { data: 13, isLoading: false, isError: false, isFetching: false };
    }

    return {
      data: { designers: [], totalCount: 0 },
      isLoading: false,
      isError: false,
      isFetching: false,
    };
  },
}));

const categoryGroups = [
  {
    value: "furniture",
    label: "Furniture",
  },
];

function renderDesignersShell(paramsString = "") {
  mockSearchParamsValue = paramsString;

  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <DesignersShell categoryGroups={categoryGroups} />
    </NextIntlClientProvider>,
  );
}

describe("DesignersShell", () => {
  it("updates only the draft fields whose URL parameters changed", () => {
    const view = renderDesignersShell("groups=furniture&levels=free");
    fireEvent.click(
      within(screen.getAllByLabelText("Filters")[0]).getByRole("checkbox", {
        name: /^Pro/i,
      }),
    );
    mockSearchParamsValue = "levels=free";
    view.rerender(
      <NextIntlClientProvider locale="en" messages={messages}>
        <DesignersShell categoryGroups={categoryGroups} />
      </NextIntlClientProvider>,
    );
    const filters = screen.getAllByLabelText("Filters")[0];
    expect(
      within(filters)
        .getByRole("checkbox", { name: "Furniture" })
        .getAttribute("data-state"),
    ).toBe("unchecked");
    expect(
      within(filters)
        .getByRole("checkbox", { name: /^Pro/i })
        .getAttribute("data-state"),
    ).toBe("checked");
    mockSearchParamsValue = "groups=furniture&levels=max";
    view.rerender(
      <NextIntlClientProvider locale="en" messages={messages}>
        <DesignersShell categoryGroups={categoryGroups} />
      </NextIntlClientProvider>,
    );
    expect(
      within(filters)
        .getByRole("checkbox", { name: "Furniture" })
        .getAttribute("data-state"),
    ).toBe("checked");
    expect(
      within(filters)
        .getByRole("checkbox", { name: /^Max/i })
        .getAttribute("data-state"),
    ).toBe("checked");
    expect(
      within(filters)
        .getByRole("checkbox", { name: /^Pro/i })
        .getAttribute("data-state"),
    ).toBe("unchecked");
  });

  it("preserves unapplied groups when sorting or pagination changes", () => {
    const view = renderDesignersShell();
    fireEvent.click(
      within(screen.getAllByLabelText("Filters")[0]).getByRole("checkbox", {
        name: "Furniture",
      }),
    );
    mockSearchParamsValue = "sort=models&page=2";
    view.rerender(
      <NextIntlClientProvider locale="en" messages={messages}>
        <DesignersShell categoryGroups={categoryGroups} />
      </NextIntlClientProvider>,
    );
    const filters = screen.getAllByLabelText("Filters")[0];
    expect(
      within(filters)
        .getByRole("checkbox", { name: "Furniture" })
        .getAttribute("data-state"),
    ).toBe("checked");
    fireEvent.click(
      within(filters).getByRole("button", { name: "Show 13 designers" }),
    );
    expect(String(mockPushFn.mock.calls.at(-1)?.[0])).toContain(
      "groups=furniture",
    );
  });

  it("pushes portfolio group filters to the URL from the desktop sidebar", () => {
    mockPushFn = vi.fn();
    renderDesignersShell();

    const desktopFilters = screen.getAllByLabelText("Filters")[0];

    fireEvent.click(
      within(desktopFilters).getByRole("checkbox", { name: "Furniture" }),
    );
    fireEvent.click(
      within(desktopFilters).getByRole("button", {
        name: "Show 13 designers",
      }),
    );

    const pushedUrl = String(mockPushFn.mock.calls.at(-1)?.[0]);

    expect(decodeURIComponent(pushedUrl)).toContain("groups=furniture");
  });
});
