import Header from "@/src/business/components/Header";
import { NextIntlClientProvider } from "next-intl";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { vi } from "vitest";
import {
  beforeEach,
  describe,
  expect,
  fireEvent,
  it,
  render,
  screen,
  waitFor,
} from "../fixtures";

const mocks = vi.hoisted(() => ({
  supabaseFromMock: vi.fn(),
  authGetUserMock: vi.fn(),
  authStateChangeMock: vi.fn(),
  routerReplaceMock: vi.fn(),
  setThemeMock: vi.fn(),
}));

vi.mock("@/src/business/utils/supabase/client", () => ({
  createClient: () => ({
    from: mocks.supabaseFromMock,
    auth: {
      getUser: mocks.authGetUserMock,
      onAuthStateChange: mocks.authStateChangeMock,
    },
  }),
}));

vi.mock("@/src/i18n/routing", () => ({
  Link: ({
    href,
    children,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  usePathname: () => "/en",
  useRouter: () => ({ replace: mocks.routerReplaceMock }),
}));

vi.mock("next/image", () => ({
  default: ({ alt }: { alt?: string }) => (
    <span aria-label={alt} data-testid="mocked-next-image" />
  ),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({
    setTheme: mocks.setThemeMock,
    theme: "dark",
  }),
}));

const messages = {
  Header: {
    logo: "Threedly",
    allCategories: "All categories",
    login: "Login",
    signup: "Sign up",
    profile: "Profile",
    nav: {
      catalog: "Catalog",
      categories: "Categories",
      designers: "Designers",
      pricing: "Pricing",
    },
    language: {
      toggle: "Change language",
      ua: "Ukrainian",
      en: "English",
    },
    theme: {
      toggle: "Change theme",
      light: "Light",
      dark: "Dark",
      system: "System",
    },
  },
};

function renderHeader(children: ReactNode = <Header />) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {children}
    </NextIntlClientProvider>,
  );
}

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authGetUserMock.mockResolvedValue({ data: { user: null } });
    mocks.authStateChangeMock.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    });
    mocks.supabaseFromMock.mockImplementation((table: string) => {
      if (table !== "category_groups") {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        select: () => ({
          order: vi.fn(async () => ({
            data: [
              {
                id: "group-furniture",
                slug: "furniture",
                name_ua: "Меблі",
                name_en: "Furniture",
                sort_order: 10,
                categories: [
                  {
                    id: "category-chairs",
                    slug: "chairs",
                    name_ua: "Стільці",
                    name_en: "Chairs",
                    sort_order: 10,
                    is_featured: true,
                  },
                ],
              },
            ],
          })),
        }),
      };
    });
  });

  it("keeps the mobile categories menu compact by listing groups without child categories", async () => {
    renderHeader();

    await waitFor(() => {
      expect(
        screen.getAllByRole("button", { name: /Categories/i }).length,
      ).toBeGreaterThan(0);
    });
    fireEvent.click(screen.getByRole("button", { name: "Toggle menu" }));
    fireEvent.click(screen.getAllByRole("button", { name: /Categories/i })[1]);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Furniture" })).not.toBeNull();
    });
    expect(screen.queryByRole("link", { name: "Chairs" })).toBeNull();
  });
});
