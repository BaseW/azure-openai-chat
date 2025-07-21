// lint-staged configuration
// This configuration ensures that checks only run on staged files
export default {
  // Run Biome on TypeScript and TSX files for both linting and formatting
  "**/*.{ts,tsx}": [
    // Check and fix linting issues with formatting enabled
    // Use --unsafe to apply all suggested fixes
    "biome check --write --unsafe --formatter-enabled=true",
    // Re-add files to staging after they've been fixed
    // This ensures that the fixed versions are committed
    (files) => `git add ${files.join(' ')}`,
    // Run TypeScript type checking
    "tsc --noEmit",
    // Run related unit tests
    "vitest related --run",
  ],
};
