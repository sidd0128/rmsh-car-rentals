import '@core/i18n';
import React from 'react';
import { AppProvider } from './src/app/providers/AppProvider';
import { ErrorBoundaryProvider } from './src/error/ErrorBoundary';

const App = () => (
  <ErrorBoundaryProvider>
    <AppProvider />
  </ErrorBoundaryProvider>
);

export default App;
