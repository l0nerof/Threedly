import { useIsMobile } from "@/src/shared/hooks/use-mobile";
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
