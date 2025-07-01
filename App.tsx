import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import * as SplashScreen from 'expo-splash-screen';

const theme = {
  colors: {
    primary: '#007AFF',
    secondary: '#34C759',
    tertiary: '#FF9500',
    surface: '#FFFFFF',
    background: '#F2F2F7',
    error: '#FF3B30',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onSurface: '#000000',
    onBackground: '#000000',
    outline: '#C7C7CC',
  },
};

SplashScreen.preventAutoHideAsync();

export default function App() {
useEffect(() => {
  const prepare = async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    await SplashScreen.hideAsync();
  };
  prepare();
}, []);

  return (
    <PaperProvider theme={theme}>
      <StatusBar style="auto" />
      <AppNavigator />
    </PaperProvider>
  );
}
