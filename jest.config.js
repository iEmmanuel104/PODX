/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  preset: "ts-jest", // Use ts-jest for TypeScript support
  testEnvironment: "node", // Set the test environment to Node.js
  testMatch: ["**/__tests__/**/*.test.ts"], // Match test files
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1", // Optional: Alias for imports
  },
  clearMocks: true, // Automatically clear mocks between tests
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"], // Optional: Setup file
};