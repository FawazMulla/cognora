const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Workspace root — two levels up from apps/mobile
const workspaceRoot = path.resolve(__dirname, '../..');
const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// Add monorepo support: watch the entire workspace root and packages/shared
config.watchFolders = [workspaceRoot];

// Resolve modules from the workspace root so hoisted deps are found
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Ensure the @workspace/shared path alias resolves correctly
config.resolver.extraNodeModules = {
  '@workspace/shared': path.resolve(workspaceRoot, 'packages/shared/src'),
};

module.exports = config;
