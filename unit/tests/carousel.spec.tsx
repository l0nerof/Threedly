import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/src/shared/components/Carousel";
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
  waitFor,
} from "../fixtures";
import { installCarouselBrowserApis } from "../mocks/carousel";

let cleanup: () => void;
beforeEach(() => {
  cleanup = installCarouselBrowserApis();
});
afterEach(() => cleanup());

function slides(count: number) {
  return Array.from({ length: count }, (_, index) => (
    <CarouselItem key={index} style={{ marginRight: 0, marginBottom: 0 }}>
      Slide {index + 1}
    </CarouselItem>
  ));
}

describe("Carousel with real Embla", () => {
  it("disables controls for an empty or single-slide carousel", async () => {
    let api: CarouselApi;
    const { rerender } = render(
      <Carousel
        opts={{ duration: 0 }}
        setApi={(value) => {
          api = value;
        }}
      >
        <CarouselContent />
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>,
    );
    await waitFor(() => expect(api).toBeDefined());
    expect(
      screen.getByRole("button", { name: "Previous slide" }),
    ).toHaveProperty("disabled", true);
    expect(screen.getByRole("button", { name: "Next slide" })).toHaveProperty(
      "disabled",
      true,
    );
    rerender(
      <Carousel opts={{ duration: 0 }}>
        <CarouselContent>{slides(1)}</CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>,
    );
    await act(async () => {
      api?.reInit();
    });
    expect(screen.getByRole("button", { name: "Next slide" })).toHaveProperty(
      "disabled",
      true,
    );
  });

  it("updates controls after button and keyboard navigation", async () => {
    render(
      <Carousel opts={{ duration: 0 }} aria-label="Models">
        <CarouselContent>{slides(3)}</CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>,
    );
    const previous = screen.getByRole("button", { name: "Previous slide" });
    const next = screen.getByRole("button", { name: "Next slide" });
    await waitFor(() => expect(next).toHaveProperty("disabled", false));
    expect(previous).toHaveProperty("disabled", true);
    fireEvent.click(next);
    expect(previous).toHaveProperty("disabled", false);
    fireEvent.keyDown(screen.getByRole("region", { name: "Models" }), {
      key: "ArrowRight",
    });
    expect(next).toHaveProperty("disabled", true);
    fireEvent.keyDown(screen.getByRole("region", { name: "Models" }), {
      key: "ArrowLeft",
    });
    expect(next).toHaveProperty("disabled", false);
  });

  it("reads updated scroll limits on real reInit even when the selected index stays the same", async () => {
    let api: CarouselApi;
    render(
      <Carousel
        opts={{ duration: 0 }}
        setApi={(value) => {
          api = value;
        }}
      >
        <CarouselContent>{slides(3)}</CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>,
    );
    await waitFor(() => expect(api).toBeDefined());
    const previous = screen.getByRole("button", { name: "Previous slide" });
    expect(previous).toHaveProperty("disabled", true);
    await act(async () => {
      api?.reInit({ loop: true });
    });
    expect(api?.selectedScrollSnap()).toBe(0);
    expect(previous).toHaveProperty("disabled", false);
    await act(async () => {
      api?.reInit({ loop: false });
    });
    expect(previous).toHaveProperty("disabled", true);
  });
});
