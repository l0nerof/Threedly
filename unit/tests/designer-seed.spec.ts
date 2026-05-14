import { describe, expect, it } from "../fixtures";

describe("designer seed data", () => {
  it("assigns seeded models to public designer profiles", async () => {
    const seedModule = await import("../../scripts/post-seed-designers.mjs");

    expect(seedModule.DESIGNER_MODEL_ASSIGNMENTS).toMatchObject({
      volodymyr_hrytsenko: [
        "11111111-1111-1111-1111-111111111141",
        "11111111-1111-1111-1111-111111111142",
        "11111111-1111-1111-1111-111111111143",
      ],
    });
  });
});
