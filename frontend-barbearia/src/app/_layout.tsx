import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#000000' },
          headerTintColor: '#D9B76A',
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: '#000000' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="usuarios" options={{ title: 'Usuários' }} />
        <Stack.Screen name="servicos" options={{ headerShown: false }} />
        <Stack.Screen name="comanda" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
