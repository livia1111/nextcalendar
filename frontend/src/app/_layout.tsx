import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { SplashScreen } from '@/components/splash-screen';
import { AuthProvider, useAuth } from '@/context/AuthContext';

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = !segments[0] || segments[0] === 'login' || segments[0] === 'register' || segments[0] === 'register-empresa';
    
    if (!user && !inAuthGroup) {
      // Não está logado e tentou acessar área restrita
      router.replace('/login');
    } else if (user && inAuthGroup) {
      // Está logado e tentou acessar login/register
      router.replace('/(tabs)/home');
    }
  }, [user, isLoading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Auth */}
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="register-empresa" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="verify-code" />
      <Stack.Screen name="new-password" />
      <Stack.Screen name="setup-account" />

      {/* Main App (tabs) */}
      <Stack.Screen name="(tabs)" />

      {/* Detail screens */}
      <Stack.Screen name="booking" />
      <Stack.Screen name="empresa" />
      <Stack.Screen name="empresa-home" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <SplashScreen />
      <RootLayoutNav />
    </AuthProvider>
  );
}
