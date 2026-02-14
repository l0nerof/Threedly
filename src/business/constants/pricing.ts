export const planKeys = ["free", "pro", "business"] as const;

export const featureKeysByPlan = {
  free: ["one", "two", "three", "four"] as const,
  pro: ["one", "two", "three", "four", "five"] as const,
  business: ["one", "two", "three", "four", "five", "six"] as const,
};

export const faqKeys = ["one", "two", "three", "four", "five"] as const;
