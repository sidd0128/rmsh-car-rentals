import '@core/i18n';
import React from 'react';
import { StatusBar } from 'react-native';
import { AppProvider } from './src/app/providers/AppProvider';
import { colors } from './src/app/theme';
import { ErrorBoundaryProvider } from './src/error/ErrorBoundary';

const App = () => (
  <ErrorBoundaryProvider>
    <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
    <AppProvider />
  </ErrorBoundaryProvider>
);

export default App;
