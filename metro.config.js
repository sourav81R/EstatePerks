const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for .mjs files (Lottie etc.)
config.resolver.sourceExts.push('mjs');

// Add conditionNames to support modern package exports
config.resolver.conditionNames = ['browser', 'require', 'import'];

// Prioritize web-compatible entry points
config.resolver.resolverMainFields = ['browser', 'module', 'main'];

config.resolver.unstable_enablePackageExports = true;

/* =========================
   🔥 SAFE AREA FIX FOR WEB
   ========================= */
config.resolver.alias = {
  ...(config.resolver.alias || {}),
  'react-native-safe-area-context':
    'react-native-safe-area-context/lib/module/index.web',
};

module.exports = config;
