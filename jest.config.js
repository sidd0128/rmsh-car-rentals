module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@gorhom|@shopify|react-native-paper|react-native-vector-icons|react-native-reanimated|react-native-gesture-handler|react-native-safe-area-context|react-native-screens)/)',
  ],
  moduleNameMapper: {
    '^@core/config/env\\.generated$': '<rootDir>/jest.env.mock.js',
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@features/(.*)$': '<rootDir>/src/features/$1',
    '^@reusable$': '<rootDir>/src/reusable/index.ts',
    '^@reusable/(.*)$': '<rootDir>/src/reusable/$1',
  },
};
