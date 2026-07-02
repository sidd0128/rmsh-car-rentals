const path = require('path');

const src = path.resolve(__dirname, 'src');

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: [src],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@app': path.join(src, 'app'),
          '@core': path.join(src, 'core'),
          '@contextApis': path.join(src, 'contextApis'),
          '@error': path.join(src, 'error'),
          '@shared': path.join(src, 'shared'),
          '@features': path.join(src, 'features'),
          '@network': path.join(src, 'network'),
          '@zustand': path.join(src, 'zustand'),
          '@locales': path.join(src, 'locales'),
        },
      },
    ],
    'react-native-reanimated/plugin',
  ],
};
