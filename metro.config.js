const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const reusableEntry = path.resolve(__dirname, 'src/reusable/index.ts');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    resolveRequest(context, moduleName, platform) {
      if (moduleName === '@reusable') {
        return { type: 'sourceFile', filePath: reusableEntry };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
