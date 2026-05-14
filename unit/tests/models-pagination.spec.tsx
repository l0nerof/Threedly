import ModelsPagination from "@/src/business/components/ModelsPagination";
import { vi } from "vitest";
import { describe, expect, it, render, screen } from "../fixtures";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("ModelsPagination", () => {
  it("renders localized previous and next button text", () => {
    render(
      <ModelsPagination
        currentPage={2}
        totalPages={3}
        pageOfLabel="Показано 10-18 із 49 моделей"
        previousPageLabel="Попередня сторінка"
        nextPageLabel="Наступна сторінка"
      />,
    );

    expect(screen.getByText("Попередня сторінка")).not.toBeNull();
    expect(screen.getByText("Наступна сторінка")).not.toBeNull();
    expect(screen.queryByText("Previous")).toBeNull();
    expect(screen.queryByText("Next")).toBeNull();
  });
});
