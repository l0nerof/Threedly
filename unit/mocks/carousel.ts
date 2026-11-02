import { vi } from "vitest";
import { installMatchMediaMock } from "./match-media";

class CarouselResizeObserver implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

class CarouselIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "0px";
  readonly thresholds = [0];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

export function installCarouselBrowserApis() {
  const media = installMatchMediaMock();
  vi.stubGlobal("ResizeObserver", CarouselResizeObserver);
  vi.stubGlobal("IntersectionObserver", CarouselIntersectionObserver);
  const width = vi
    .spyOn(HTMLElement.prototype, "offsetWidth", "get")
    .mockReturnValue(400);
  const height = vi
    .spyOn(HTMLElement.prototype, "offsetHeight", "get")
    .mockReturnValue(200);
  const left = vi
    .spyOn(HTMLElement.prototype, "offsetLeft", "get")
    .mockImplementation(function (this: HTMLElement) {
      if (this.dataset.slot !== "carousel-item") return 0;
      return Array.from(this.parentElement?.children ?? []).indexOf(this) * 400;
    });
  return () => {
    width.mockRestore();
    height.mockRestore();
    left.mockRestore();
    vi.unstubAllGlobals();
    media.cleanup();
  };
}
