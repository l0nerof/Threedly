import ProfileSettingsForm from "@/src/app/[locale]/(main-pages)/profile/settings/components/ProfileSettingsForm";
import { designersQueryKeys } from "@/src/business/queries/designers";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { vi } from "vitest";
import {
  describe,
  expect,
  fireEvent,
  it,
  render,
  screen,
  waitFor,
} from "../fixtures";

const mocks = vi.hoisted(() => ({
  refreshMock: vi.fn(),
  toastErrorMock: vi.fn(),
  toastSuccessMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mocks.refreshMock,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: mocks.toastErrorMock,
    success: mocks.toastSuccessMock,
  },
}));

vi.mock("@/src/business/utils/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: { id: "user-1", email: "demo@threedly.local" } },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () => ({
            data: {
              avatar_path: null,
              bio: "Old profile bio",
              username: "demo_studio",
            },
          })),
        })),
      })),
    })),
  }),
}));

const messages = {
  Profile: {
    settings: {
      profile: {
        avatarMenuAriaLabel: "Open avatar menu",
        avatarMenu: {
          remove: "Remove avatar",
          upload: "Upload avatar",
        },
        avatar: "Avatar",
        bio: "Bio",
        bioPlaceholder: "Tell something short",
        description: "Basic profile data.",
        email: "Email",
        save: "Save",
        saveError: "Could not save profile.",
        saveSuccess: "Profile saved.",
        title: "Profile",
        username: "Username",
      },
    },
  },
};

function renderProfileSettingsForm() {
  const queryClient = new QueryClient();
  const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
  const onSubmitAction = vi.fn(async () => ({ ok: true as const }));

  render(
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale="en" messages={messages}>
        <ProfileSettingsForm
          onSubmitAction={onSubmitAction}
          onUploadAvatarAction={vi.fn()}
          onRemoveAvatarAction={vi.fn()}
        />
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );

  return { invalidateQueriesSpy, onSubmitAction };
}

describe("ProfileSettingsForm", () => {
  it("invalidates cached designers data after profile details are saved", async () => {
    const { invalidateQueriesSpy } = renderProfileSettingsForm();

    const usernameInput = await screen.findByLabelText("Username");
    await waitFor(() => {
      expect((usernameInput as HTMLInputElement).value).toBe("demo_studio");
    });

    fireEvent.change(usernameInput, {
      target: { value: "updated_studio" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: designersQueryKeys.root,
      });
    });
    expect(mocks.refreshMock).toHaveBeenCalled();
  });
});
