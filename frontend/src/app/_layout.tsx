import { Stack } from 'expo-router';
import { SplashScreen } from '@/components/splash-screen';
import { AuthProvider } from '@/context/AuthContext'
export default function RootLayout() {
  return (
    <>
    <AuthProvider>

      <SplashScreen />
      <Stack screenOptions={{ headerShown: false }}>
        {/* Auth */}
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="verify-code" />
        <Stack.Screen name="new-password" />
        <Stack.Screen name="setup-account" />

        {/* Main App (tabs) */}
        <Stack.Screen name="(tabs)" />
        

        {/* Detail screens */}
        <Stack.Screen name="Schedulling" />
        <Stack.Screen name="barber/[id]" />
        <Stack.Screen name="booking" />
      </Stack>
    </AuthProvider>
    </>
    
  );
}