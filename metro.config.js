const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for .mjs files which are used by @lottiefiles/dotlottie-react
config.resolver.sourceExts.push('mjs');

// Add conditionNames to support modern package exports (required for Lottie web)
config.resolver.conditionNames = ['browser', 'require', 'import'];

// Prioritize web-compatible entry points
config.resolver.resolverMainFields = ['browser', 'module', 'main'];

config.resolver.unstable_enablePackageExports = true;

module.exports = config;