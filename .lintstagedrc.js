// lint-staged configuration
// This configuration ensures that checks only run on staged files.
// For more details on bypass mechanisms, see README.md.
export default {
  "**/*.{ts,tsx}": [
    // Task 1: Run Biome for linting and formatting.
    // Skipped if SKIP_BIOME=true
    "[ \"$SKIP_BIOME\" = \"true\" ] && echo '⏩ Skipping Biome...' || (echo '🧪 Running Biome...' && biome check --write --unsafe --formatter-enabled=true)",
    
    // Task 2: Re-add files to staging after they've been fixed by Biome.
    (files) => `git add ${files.join(" ")}`,

    // Task 3: Run TypeScript type checking.
    // Skipped if SKIP_TSC=true
    "[ \"$SKIP_TSC\" = \"true\" ] && echo '⏩ Skipping TypeScript check...' || (echo '🧪 Running TypeScript check...' && tsc --noEmit)",

    // Task 4: Run related unit tests.
    // Skipped if SKIP_TESTS=true
    "[ \"$SKIP_TESTS\" = \"true\" ] && echo '⏩ Skipping tests...' || (echo '🧪 Running tests...' && vitest related --run)",
  ]
};
