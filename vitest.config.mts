import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    include: ["unit/tests/**/*.spec.ts", "unit/tests/**/*.spec.tsx"],
    setupFiles: ["./vitest.setup.ts"],
    restoreMocks: true,
  },
});
