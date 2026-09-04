import FeaturedModelCard from "@/src/business/components/FeaturedModelCard";
import type { CatalogModel } from "@/src/business/types/catalog";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { vi } from "vitest";
import { describe, expect, it, render, screen } from "../fixtures";

const mocks = vi.hoisted(() => ({
  getUserMock: vi.fn(),
}));

vi.mock("@/src/business/utils/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: mocks.getUserMock,
    },
  }),
}));

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt?: string; src: string }) => (
    <span data-alt={alt} data-src={src} />
  ),
}));

const messages = {
  Catalog: {
    resultsArea: {
      modelCard: {
        downloadButton: "Download",
        downloads: "{count} downloads",
        favoriteButton: "Add to favorites",
        removeFavoriteButton: "Remove from favorites",
        planBadge: {
          free: "Free",
          max: "Max",
          pro: "Pro",
        },
        previewButton: "Preview",
      },
    },
  },
  FeaturedModels: {
    modelCard: {
      downloads: "{count} downloads",
      planBadge: {
        free: "Free",
        max: "Max",
        pro: "Pro",
      },
    },
  },
};

const model: CatalogModel = {
  cover_image_path: "/cover.webp",
  description_en: null,
  description_ua: null,
  download_count: 48,
  file_format: "glb",
  id: "model-1",
  is_featured: true,
  minimum_plan: "free",
  published_at: "2026-05-01T10:00:00.000Z",
  slug: "cantilever-chair",
  title_en: "Cantilever Chair",
  title_ua: "Cantilever Chair",
};

function renderCard() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale="en" messages={messages}>
        <FeaturedModelCard model={model} />
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}

describe("FeaturedModelCard", () => {
  it("uses the shared model-card behavior from catalog cards", () => {
    mocks.getUserMock.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    renderCard();

    expect(
      screen.queryByRole("button", { name: "Add to favorites" }),
    ).toBeNull();
    expect(screen.getByRole("button", { name: "Preview" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Download" })).toBeTruthy();
  });
});
