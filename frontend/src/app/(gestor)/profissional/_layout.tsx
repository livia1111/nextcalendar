import { Stack } from 'expo-router';

export default function ProfissionalLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[id]" />
      <Stack.Screen name="bloquear-horario" />
    </Stack>
  );
}
