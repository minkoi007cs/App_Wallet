import { Stack, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { useColorScheme } from 'react-native';
import { useAuth } from '@/hooks/useAuth';

import { Toast } from '@/components/ui/Toast';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <>
        <Redirect href="/(auth)/login" />
        <Toast />
      </>
    );
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colorScheme === 'dark' ? '#09090B' : '#FFFFFF',
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Toast />
    </>
  );
}
