import { useIsMobile } from "@/src/shared/hooks/use-mobile";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import {
  act,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  renderHook,
  waitFor,
} from "../fixtures";
import {
  type MatchMediaController,
  installMatchMediaMock,
} from "../mocks/match-media";

describe("useIsMobile", () => {
  let matchMedia: MatchMediaController;

  beforeEach(() => {
    matchMedia = installMatchMediaMock(1280);
  });

  afterEach(() => {
    matchMedia.cleanup();
  });

  it.each([
    [375, true],
    [767, true],
    [768, false],
  ] as const)("reads the initial viewport at %d pixels", (width, mobile) => {
    matchMedia.setViewportWidth(width);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(mobile);
  });

  it("uses the desktop server snapshot and then reads the real client viewport", () => {
    matchMedia.setViewportWidth(375);
    function ViewportStatus() {
      return createElement(
        "output",
        null,
        useIsMobile() ? "mobile" : "desktop",
      );
    }
    expect(renderToString(createElement(ViewportStatus))).toBe(
      "<output>desktop</output>",
    );
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("returns false when the viewport is desktop sized", async () => {
    const { result } = renderHook(() => useIsMobile());

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it("updates when the viewport crosses the mobile breakpoint", async () => {
    const { result } = renderHook(() => useIsMobile());

    await waitFor(() => {
      expect(result.current).toBe(false);
    });

    act(() => {
      matchMedia.setViewportWidth(767);
    });

    await waitFor(() => {
      expect(result.current).toBe(true);
    });

    act(() => {
      matchMedia.setViewportWidth(1024);
    });

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });
});
