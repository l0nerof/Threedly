import ModelHero from "@/src/app/[locale]/(main-pages)/catalog/[slug]/components/ModelHero";
import OverviewTab from "@/src/app/[locale]/(main-pages)/catalog/[slug]/components/OverviewTab";
import type { CatalogModel } from "@/src/business/types/catalog";
import { NextIntlClientProvider } from "next-intl";
import { vi } from "vitest";
import { describe, expect, it, render, screen } from "../fixtures";

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async (namespace?: string) => {
    if (namespace === "ModelPage.hero") {
      return (key: string, values?: Record<string, string | number>) => {
        const messages: Record<string, string> = {
          byPrefix: "від",
          downloadButton: "Завантажити",
          downloads: `${values?.count} завантажень`,
          planInfo: `План ${values?.plan}`,
          previewButton: "Прев'ю",
          specificationsTitle: "Специфікації",
          updated: `Оновлено ${values?.date}`,
        };

        return messages[key] ?? key;
      };
    }

    return (key: string) => {
      const messages: Record<string, string> = {
        aboutEmpty: "Опис відсутній.",
        aboutTitle: "Про модель",
        designerTitle: "Дизайнер",
        designerViewProfile: "Переглянути профіль",
      };

      return messages[key] ?? key;
    };
  }),
}));

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt?: string; src: string }) => (
    <span data-alt={alt} data-src={src} />
  ),
}));

function buildModel(overrides: Partial<CatalogModel> = {}): CatalogModel {
  return {
    cover_image_path: "/cover.webp",
    description_en: "Soft sofa for premium interiors.",
    description_ua: "М'який диван для преміальних інтер'єрів.",
    download_count: 87,
    file_format: "fbx",
    id: "model-1",
    is_featured: true,
    minimum_plan: "max",
    published_at: "2026-05-01T10:00:00.000Z",
    slug: "cloud-sofa",
    title_en: "Cloud Sofa",
    title_ua: "Cloud Sofa",
    ...overrides,
  };
}

describe("model detail components", () => {
  it("formats the updated date with the active locale", async () => {
    const model = buildModel();
    const expectedDate = new Intl.DateTimeFormat("uk-UA", {
      month: "short",
      year: "numeric",
    }).format(new Date(model.published_at ?? ""));

    render(await ModelHero({ model, locale: "ua" }));

    expect(screen.getByText(`Оновлено ${expectedDate}`)).toBeTruthy();
    expect(screen.queryByText("Оновлено May 2026")).toBeNull();
  });

  it("renders the real model creator and initials when the creator has no avatar", async () => {
    const model = buildModel({
      creator: {
        avatar_path: null,
        username: "anna_kovalenko",
      },
    } as Partial<CatalogModel>);

    render(
      <NextIntlClientProvider locale="ua" messages={{}}>
        {await OverviewTab({ model, locale: "ua" })}
      </NextIntlClientProvider>,
    );

    expect(screen.getByText("@anna_kovalenko")).toBeTruthy();
    expect(screen.getByText("AN")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Переглянути профіль" })
        .getAttribute("href"),
    ).toBe("/ua/designers/anna_kovalenko?from=%2Fcatalog%2Fcloud-sofa");
  });
});
