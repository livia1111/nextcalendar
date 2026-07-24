import { Stack } from 'expo-router';

export default function SchedulingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="agenda-do-profissional" />
      <Stack.Screen name="buscar-horario" />
      <Stack.Screen name="lista-de-espera" />
    </Stack>
  );
}