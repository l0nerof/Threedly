import {
  PLAN_BADGE_COLORS,
  marketplacePlanKeys,
} from "@/src/business/constants/plans";
import { describe, expect, it } from "vitest";

describe("marketplace plan constants", () => {
  it("keeps the product plan keys and visual maps aligned", () => {
    expect(marketplacePlanKeys).toEqual(["free", "pro", "max"]);
    expect(Object.keys(PLAN_BADGE_COLORS).sort()).toEqual(
      [...marketplacePlanKeys].sort(),
    );
  });
});
