import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  preset: "ts-jest",
  testEnvironment: "node",
  verbose: true,
  testMatch: ["**/test/services/*.test.ts"],
  globalSetup: "./test/services/setup.ts",
  testTimeout: 30000,
  collectCoverage: true,
  coverageReporters: ["lcov", "json-summary"],
  collectCoverageFrom: ["./src/services/*", "!./src/services/util.ts"]
};

export default config;
