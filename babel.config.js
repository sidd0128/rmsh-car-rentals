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
          '@shared': path.join(src, 'shared'),
          '@features': path.join(src, 'features'),
          '@reusable': path.join(src, 'reusable'),
          '@locales': path.join(src, 'locales'),
        },
      },
    ],
    'react-native-reanimated/plugin',
  ],
};
