import { Stack, useRouter, usePathname, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { useColorScheme, View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Toast } from '@/components/ui/Toast';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { loading, isAuthenticated } = useAuth();
  const segments = useSegments();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const isAuthRoute =
      segments.some((s) => s === '(auth)' || s === 'login') ||
      pathname === '/login' ||
      pathname === '/(auth)/login' ||
      pathname.includes('login');

    if (!isAuthenticated && !isAuthRoute) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && isAuthRoute) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, loading, segments, pathname, router]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colorScheme === 'dark' ? '#09090B' : '#FFFFFF',
        }}
      >
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
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
