const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('mjs');

config.resolver.resolverMainFields = ['browser', 'module', 'main'];
config.resolver.conditionNames = ['browser', 'require', 'import'];

config.resolver.unstable_enablePackageExports = true;

/**
 * 🔥 BLOCK ALL NATIVE FABRIC FILES FOR WEB
 */
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName.includes('/fabric/') ||
    moduleName.includes('/specs/') ||
    moduleName.includes('NativeComponent')
  ) {
    return {
      filePath: require.resolve('./empty.js'),
      type: 'sourceFile',
    };
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
