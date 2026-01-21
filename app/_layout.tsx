import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import 'react-native-reanimated';
import { View } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { FloatingHelpCenter } from '@/components/FloatingHelpCenter'
import { storage } from '@/src/lib/storage';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore errors */
});

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const [isAuthed, setIsAuthed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const hideHelpOnRoutes = useMemo(
    () => new Set(['/join-community', '/sign-in', '/sign-up']),
    [],
  );

  const [fontsLoaded] = useFonts({
    Inter_400Regular: require('@/assets/fonts/Inter_400Regular.ttf'),
    Inter_500Medium: require('@/assets/fonts/Inter_500Medium.ttf'),
    Inter_600SemiBold: require('@/assets/fonts/Inter_600SemiBold.ttf'),
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await storage.getToken();
        const user = await storage.getUser();
        setIsAuthed(Boolean(token && user));
      } catch {
        setIsAuthed(false);
      } finally {
        setAuthChecked(true);
      }
    };
    checkAuth();
  }, [pathname]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {
        /* ignore errors */
      });
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1 }}>
        <Stack initialRouteName="sign-in">
          {/* <Stack.Screen name="splash" options={{ headerShown: false }} /> */}
          <Stack.Screen name="join-community" options={{ headerShown: false }} />
          <Stack.Screen name="sign-in" options={{ headerShown: false }} />
          <Stack.Screen name="sign-up" options={{ headerShown: false }} />
          <Stack.Screen name="add-post" options={{ headerShown: false }} />
          <Stack.Screen name="search" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="ads-rewards" options={{ headerShown: false }} />
          <Stack.Screen name="ads-detail" options={{ headerShown: false }} />
          <Stack.Screen name="notification" options={{ headerShown: false }} />
          <Stack.Screen name="profile" options={{ headerShown: false }} />
          <Stack.Screen name="chat-support" options={{ headerShown: false }} />
          <Stack.Screen name="chat-history" options={{ headerShown: false }} />
          <Stack.Screen name="chat-detail" options={{ headerShown: false }} />
          <Stack.Screen name="faq" options={{ headerShown: false }} />
          <Stack.Screen name="post-detail" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        {authChecked && isAuthed && !hideHelpOnRoutes.has(pathname) ? (
          <FloatingHelpCenter />
        ) : null}
      </View>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
