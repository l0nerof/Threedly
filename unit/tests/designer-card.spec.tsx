import DesignerCard from "@/src/app/[locale]/(main-pages)/designers/components/DesignerCard";
import type { Designer } from "@/src/business/types/designer";
import { NextIntlClientProvider } from "next-intl";
import type { ComponentProps, ReactNode } from "react";
import { vi } from "vitest";
import { describe, expect, it, render, screen } from "../fixtures";

vi.mock("@/src/business/components/FollowDesignerButton", () => ({
  default: () => null,
}));

vi.mock("@/src/i18n/routing", () => ({
  Link: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  usePathname: () => "/profile/library",
}));

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt?: string; src: string }) => (
    <span data-alt={alt} data-src={src} />
  ),
}));

vi.mock("motion/react", () => ({
  motion: {
    article: ({
      children,
      ...props
    }: ComponentProps<"article"> & {
      transition?: unknown;
      whileHover?: unknown;
    }) => {
      delete props.transition;
      delete props.whileHover;

      return <article {...props}>{children}</article>;
    },
  },
}));

const messages = {
  Designers: {
    card: {
      browseModels: "View {count} models",
      openProfile: "Open @{username} profile",
    },
  },
};

const designer: Designer = {
  avatar_path: null,
  bio: "Interior assets.",
  created_at: "2026-01-15T10:00:00.000Z",
  id: "designer-1",
  model_count: 3,
  plan_key: "pro",
  username: "demo_studio",
};

describe("DesignerCard", () => {
  it("preserves profile library as the designer profile back target", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <DesignerCard designer={designer} />
      </NextIntlClientProvider>,
    );

    expect(
      screen
        .getByRole("link", { name: "Open @demo_studio profile" })
        .getAttribute("href"),
    ).toBe("/designers/demo_studio?from=%2Fprofile%2Flibrary");
  });
});
