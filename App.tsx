import React from 'react';
import { StatusBar } from 'react-native';
import { AppProvider } from './src/app/providers/AppProvider';
import { colors } from './src/app/theme';

const App = () => (
  <>
    <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
    <AppProvider />
  </>
);

export default App;
