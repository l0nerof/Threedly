import uaMessages from "@/messages/ua.json";
import { describe, expect, it } from "../fixtures";

describe("featured models copy", () => {
  it("uses recommendation-oriented Ukrainian wording for featured models", () => {
    expect(uaMessages.FeaturedModels.title).toBe("Рекомендовані моделі");
  });
});
