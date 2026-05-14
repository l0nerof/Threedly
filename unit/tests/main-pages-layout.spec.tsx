import MainPagesLayout from "@/src/app/[locale]/(main-pages)/layout";
import type { ReactNode } from "react";
import { vi } from "vitest";
import { describe, expect, it, render, screen } from "../fixtures";

vi.mock("@/src/business/components/Header", () => ({
  default: () => <header>Header</header>,
}));

vi.mock("@/src/business/components/Footer", () => ({
  default: () => <footer>Footer</footer>,
}));

vi.mock("@/src/business/utils/isLocaleCode", () => ({
  isLocaleCode: (locale: string) => locale === "ua" || locale === "en",
}));

vi.mock("next-intl/server", () => ({
  setRequestLocale: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("notFound");
  }),
}));

function renderMainPagesLayout(children: ReactNode) {
  return MainPagesLayout({
    children,
    params: Promise.resolve({ locale: "ua" }),
  });
}

describe("MainPagesLayout", () => {
  it("stretches short pages so the footer stays at the bottom of the viewport", async () => {
    const ui = await renderMainPagesLayout(<section>Page content</section>);

    const { container } = render(ui);
    const wrapper = container.firstElementChild;

    expect(wrapper?.classList.contains("flex")).toBe(true);
    expect(wrapper?.classList.contains("min-h-screen")).toBe(true);
    expect(wrapper?.classList.contains("flex-col")).toBe(true);
    expect(screen.getByRole("main").classList.contains("flex-1")).toBe(true);
  });
});
