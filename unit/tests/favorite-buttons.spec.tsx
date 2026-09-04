import FavoriteModelButton from "@/src/business/components/FavoriteModelButton";
import FollowDesignerButton from "@/src/business/components/FollowDesignerButton";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
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
  deleteTargetEqMock: vi.fn(),
  deleteUserEqMock: vi.fn(),
  deleteMock: vi.fn(),
  eqMock: vi.fn(),
  fromMock: vi.fn(),
  getUserMock: vi.fn(),
  insertMock: vi.fn(),
  selectMock: vi.fn(),
}));

vi.mock("@/src/business/utils/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: mocks.getUserMock,
    },
    from: mocks.fromMock,
  }),
}));

const messages = {
  Catalog: {
    resultsArea: {
      modelCard: {
        favoriteButton: "Add to favorites",
        removeFavoriteButton: "Remove from favorites",
      },
    },
  },
  Designers: {
    card: {
      followButton: "Follow designer",
      unfollowButton: "Unfollow designer",
    },
  },
};

function renderWithProviders(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale="en" messages={messages}>
        {ui}
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );

  return queryClient;
}

function mockSelectRows(rows: unknown[]) {
  mocks.selectMock.mockReturnValue({ eq: mocks.eqMock });
  mocks.eqMock.mockResolvedValue({
    data: rows,
    error: null,
  });
}

describe("favorite buttons", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fromMock.mockReturnValue({
      delete: mocks.deleteMock,
      insert: mocks.insertMock,
      select: mocks.selectMock,
    });
    mocks.insertMock.mockResolvedValue({ error: null });
    mocks.deleteMock.mockReturnValue({ eq: mocks.deleteUserEqMock });
    mocks.deleteUserEqMock.mockReturnValue({ eq: mocks.deleteTargetEqMock });
    mocks.deleteTargetEqMock.mockResolvedValue({ error: null });
  });

  it("hides the model favorite button for guests", async () => {
    mocks.getUserMock.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    renderWithProviders(<FavoriteModelButton modelId="model-1" />);

    await waitFor(() => expect(mocks.getUserMock).toHaveBeenCalled());
    expect(
      screen.queryByRole("button", { name: "Add to favorites" }),
    ).toBeNull();
  });

  it("adds a model to favorites for authenticated users", async () => {
    mocks.getUserMock.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockSelectRows([]);

    renderWithProviders(<FavoriteModelButton modelId="model-1" />);

    const button = await screen.findByRole("button", {
      name: "Add to favorites",
    });
    await waitFor(() => expect(button).not.toHaveProperty("disabled", true));

    fireEvent.click(button);

    await waitFor(() => {
      expect(mocks.insertMock).toHaveBeenCalledWith({
        model_id: "model-1",
        user_id: "user-1",
      });
    });
  });

  it("hides the designer follow button for the current profile", async () => {
    mocks.getUserMock.mockResolvedValue({
      data: { user: { id: "designer-1" } },
      error: null,
    });
    mockSelectRows([]);

    renderWithProviders(<FollowDesignerButton designerId="designer-1" />);

    await waitFor(() => expect(mocks.getUserMock).toHaveBeenCalled());
    expect(
      screen.queryByRole("button", { name: "Follow designer" }),
    ).toBeNull();
  });
});
