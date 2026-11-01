/** @type {import('lint-staged').Config} */
module.exports = {
  // TypeScript & JavaScript: lint + format
  '**/*.{ts,tsx,js,jsx,mjs,cjs}': ['eslint --fix', 'prettier --write'],

  // JSON, Markdown, YAML: format only
  '**/*.{json,md,yaml,yml}': ['prettier --write'],

  // CSS / style files: format only
  '**/*.{css,scss}': ['prettier --write'],
};
