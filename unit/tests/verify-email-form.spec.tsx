import ua from "@/messages/ua.json";
import VerifyEmailForm from "@/src/app/[locale]/(auth)/components/VerifyEmailForm";
import { NextIntlClientProvider } from "next-intl";
import { Toaster, toast } from "sonner";
import { vi } from "vitest";
import {
  act,
  afterEach,
  beforeEach,
  describe,
  expect,
  fireEvent,
  it,
  render,
  screen,
} from "../fixtures";
import { installMatchMediaMock } from "../mocks/match-media";

type Resend =
  typeof import("@/src/app/[locale]/(auth)/verify-email/actions").resendEmailOtp;
type Verify =
  typeof import("@/src/app/[locale]/(auth)/verify-email/actions").verifyEmailOtp;
type Router = ReturnType<typeof import("next/navigation").useRouter>;

const mocks = vi.hoisted(() => ({
  resend: vi.fn<Resend>(),
  verify: vi.fn<Verify>(),
  push: vi.fn<Router["push"]>(),
  refresh: vi.fn<Router["refresh"]>(),
}));

vi.mock("@/src/app/[locale]/(auth)/verify-email/actions", () => ({
  resendEmailOtp: mocks.resend,
  verifyEmailOtp: mocks.verify,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));

const initialTime = Date.UTC(2026, 9, 27, 12);
const email = "unit-otp@threedly.local";
const messages = ua.Auth.verifyEmail;
let view: ReturnType<typeof render> | undefined;
let cleanupMedia: () => void;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(initialTime);
  vi.clearAllMocks();
  mocks.resend.mockResolvedValue({ ok: true });
  mocks.verify.mockResolvedValue({ ok: true, nextPath: "/ua" });
  cleanupMedia = installMatchMediaMock().cleanup;
  vi.stubGlobal(
    "ResizeObserver",
    class implements ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  view?.unmount();
  view = undefined;
  toast.dismiss();
  cleanupMedia();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function renderForm(initialEmail = email) {
  view = render(
    <NextIntlClientProvider locale="ua" messages={ua} timeZone="UTC">
      <VerifyEmailForm initialEmail={initialEmail} />
      <Toaster theme="light" duration={Infinity} />
    </NextIntlClientProvider>,
  );
  return view;
}

function resendButton() {
  return screen.getByRole("button", {
    name: /^(Надіслати код ще раз|Повторна відправка через|Надсилаємо)/,
  });
}

function expectRemaining(seconds: number) {
  expect(resendButton().textContent).toBe(
    `Повторна відправка через ${seconds}с`,
  );
  expect(resendButton().hasAttribute("disabled")).toBe(true);
}

function expectResendAvailable() {
  expect(resendButton().textContent).toBe(messages.resend);
  expect(resendButton().hasAttribute("disabled")).toBe(false);
}

describe("email verification resend cooldown", () => {
  it("blocks early resend and enables it at the sixty-second deadline", () => {
    renderForm();
    expectRemaining(60);
    act(() => vi.advanceTimersByTime(59_999));
    expectRemaining(1);
    fireEvent.click(resendButton());
    expect(mocks.resend).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expectResendAvailable();
  });

  it("a delayed interval uses elapsed time instead of waiting for sixty callbacks", () => {
    renderForm();
    vi.setSystemTime(initialTime + 65_000);
    act(() => vi.advanceTimersByTime(1000));
    expectResendAvailable();
  });

  it("updates immediately on focus after the deadline without a timer callback", () => {
    renderForm();
    vi.setSystemTime(initialTime + 70_000);
    fireEvent.focus(window);
    expectResendAvailable();
  });

  it("recalculates rounded remaining time on visibility changes and never enables early", () => {
    renderForm();
    vi.setSystemTime(initialTime + 12_500);
    fireEvent(document, new Event("visibilitychange"));
    expectRemaining(48);
    vi.setSystemTime(initialTime + 59_999);
    fireEvent(document, new Event("visibilitychange"));
    expectRemaining(1);
    vi.setSystemTime(initialTime + 60_000);
    fireEvent(document, new Event("visibilitychange"));
    expectResendAvailable();
  });

  it("starts a fresh deadline only after a successful resend and preserves the typed code", async () => {
    let resolveResend: (result: Awaited<ReturnType<Resend>>) => void = () => {};
    mocks.resend.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveResend = resolve;
      }),
    );
    renderForm();
    fireEvent.change(screen.getByLabelText(messages.otpLabel), {
      target: { value: "123456" },
    });
    act(() => vi.advanceTimersByTime(60_000));
    fireEvent.click(resendButton());
    expect(resendButton().textContent).toBe(messages.resending);
    expect(resendButton().hasAttribute("disabled")).toBe(true);
    fireEvent.click(resendButton());
    expect(mocks.resend).toHaveBeenCalledTimes(1);
    expect(mocks.resend).toHaveBeenCalledWith({ email, locale: "ua" });
    vi.setSystemTime(initialTime + 90_000);
    await act(async () => {
      resolveResend({ ok: true });
    });
    expectRemaining(60);
    expect(
      screen.getByLabelText<HTMLInputElement>(messages.otpLabel).value,
    ).toBe("123456");
    act(() => vi.advanceTimersByTime(59_000));
    expectRemaining(1);
    act(() => vi.advanceTimersByTime(1000));
    expectResendAvailable();
  });

  it("shows resend failure without restarting the cooldown and allows a successful retry", async () => {
    mocks.resend.mockResolvedValueOnce({ ok: false, error: "rateLimit" });
    renderForm();
    fireEvent.change(screen.getByLabelText(messages.otpLabel), {
      target: { value: "654321" },
    });
    act(() => vi.advanceTimersByTime(60_000));
    await act(async () => {
      fireEvent.click(resendButton());
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(20);
    });
    expect(screen.getByText(messages.errors.rateLimit)).toBeTruthy();
    expectResendAvailable();
    expect(
      screen.getByLabelText<HTMLInputElement>(messages.otpLabel).value,
    ).toBe("654321");
    await act(async () => {
      fireEvent.click(resendButton());
    });
    expect(mocks.resend).toHaveBeenCalledTimes(2);
    expectRemaining(60);
  });

  it("does not enable resend without an email even after the deadline", () => {
    renderForm("");
    vi.setSystemTime(initialTime + 70_000);
    fireEvent.focus(window);
    expect(resendButton().hasAttribute("disabled")).toBe(true);
    fireEvent.click(resendButton());
    expect(mocks.resend).not.toHaveBeenCalled();
  });

  it("removes timer and focus/visibility subscriptions on unmount", () => {
    const removeFocus = vi.spyOn(window, "removeEventListener");
    const removeVisibility = vi.spyOn(document, "removeEventListener");
    const clearTimer = vi.spyOn(window, "clearInterval");
    const form = renderForm();
    form.unmount();
    expect(removeFocus).toHaveBeenCalledWith("focus", expect.any(Function));
    expect(removeVisibility).toHaveBeenCalledWith(
      "visibilitychange",
      expect.any(Function),
    );
    expect(clearTimer).toHaveBeenCalled();
    vi.setSystemTime(initialTime + 70_000);
    fireEvent.focus(window);
    fireEvent(document, new Event("visibilitychange"));
    expect(mocks.resend).not.toHaveBeenCalled();
  });
});
