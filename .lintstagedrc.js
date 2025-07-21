// lint-staged configuration
// This configuration ensures that checks only run on staged files
export default {
  // Run Biome on TypeScript and TSX files for both linting and formatting
  "**/*.{ts,tsx}": ["biome check --apply"],
  
  // Re-add files to staging after they've been fixed
  // This ensures that the fixed versions are committed
  "**/*.{ts,tsx}": [(files) => {
    // This will only run on staged files that match the pattern
    return `git add ${files.join(' ')}`;
  }],
};
