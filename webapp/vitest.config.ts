import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      enabled: false,
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      reportsDirectory: "./coverage",
      include: [
        "src/app/api/telemetry/route.ts",
        "src/lib/game-core/color.ts",
        "src/lib/game-core/math.ts",
        "src/lib/game-core/memory.ts",
        "src/lib/game-core/types.ts",
        "src/lib/progress-service/storage.ts",
      ],
      exclude: ["src/**/*.test.ts"],
      thresholds: {
        statements: 80,
        branches: 60,
        functions: 80,
        lines: 80,
      },
    },
  },
});
