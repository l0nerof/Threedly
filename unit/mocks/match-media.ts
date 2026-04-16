type MatchMediaListener =
  | EventListenerOrEventListenerObject
  | ((event: MediaQueryListEvent) => void);

export type MatchMediaController = {
  cleanup: () => void;
  setViewportWidth: (width: number) => void;
};

export function installMatchMediaMock(
  initialWidth = 1024,
): MatchMediaController {
  let currentWidth = initialWidth;
  const originalInnerWidth = Object.getOwnPropertyDescriptor(
    window,
    "innerWidth",
  );
  const originalMatchMedia = window.matchMedia;
  const listeners = new Map<MatchMediaListener, string>();

  const applyViewportWidth = (width: number) => {
    currentWidth = width;

    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: width,
    });
  };

  const matchesQuery = (query: string) => {
    const maxWidthMatch = /max-width:\s*(\d+)px/.exec(query);

    if (!maxWidthMatch) {
      return false;
    }

    return currentWidth <= Number(maxWidthMatch[1]);
  };

  const createChangeEvent = (query: string) => {
    const event = new Event("change") as MediaQueryListEvent;

    Object.defineProperties(event, {
      matches: {
        configurable: true,
        enumerable: true,
        value: matchesQuery(query),
      },
      media: {
        configurable: true,
        enumerable: true,
        value: query,
      },
    });

    return event;
  };

  const notifyListeners = () => {
    for (const [listener, query] of listeners) {
      const event = createChangeEvent(query);

      if (typeof listener === "function") {
        listener(event);
        continue;
      }

      listener.handleEvent(event);
    }
  };

  applyViewportWidth(initialWidth);

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string): MediaQueryList => ({
      matches: matchesQuery(query),
      media: query,
      onchange: null,
      addListener: (listener: (event: MediaQueryListEvent) => void) => {
        listeners.set(listener, query);
      },
      removeListener: (listener: (event: MediaQueryListEvent) => void) => {
        listeners.delete(listener);
      },
      addEventListener: (type: string, listener: MatchMediaListener | null) => {
        if (type === "change" && listener) {
          listeners.set(listener, query);
        }
      },
      removeEventListener: (
        type: string,
        listener: MatchMediaListener | null,
      ) => {
        if (type === "change" && listener) {
          listeners.delete(listener);
        }
      },
      dispatchEvent: () => true,
    }),
  });

  return {
    setViewportWidth: (width: number) => {
      applyViewportWidth(width);
      notifyListeners();
    },
    cleanup: () => {
      if (originalInnerWidth) {
        Object.defineProperty(window, "innerWidth", originalInnerWidth);
      }

      Object.defineProperty(window, "matchMedia", {
        configurable: true,
        writable: true,
        value: originalMatchMedia,
      });

      listeners.clear();
    },
  };
}
