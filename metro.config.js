const fs = require('fs');
const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const projectRoot = __dirname;
const fastImagePackageDir = path.join(
  projectRoot,
  'node_modules',
  '@d11',
  'react-native-fast-image',
);
const fastImageStub = path.join(projectRoot, 'src/lib/fastImageStub.tsx');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    resolveRequest(context, moduleName, platform) {
      if (moduleName === '@d11/react-native-fast-image') {
        if (!fs.existsSync(fastImagePackageDir)) {
          return {
            filePath: fastImageStub,
            type: 'sourceFile',
          };
        }
      }

      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
