import { Redirect, Slot, useSegments } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { getRoleHomeRoute } from '@/utils/roleHomeRoute';

/**
 * Layout da área do Profissional.
 *
 * Guards (em ordem):
 * 1. Não autenticado → /login
 * 2. Role errado → home do role correto
 * 3. mustChangePassword = true → /(profissional)/trocar-senha
 *    (exceto se já estiver nessa tela — useSegments cuida disso para evitar loop)
 */
export default function ProfissionalLayout() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();

  if (isLoading) return null;

  if (!user) return <Redirect href="/login" />;

  if (user.role !== 'PROFESSIONAL') {
    return <Redirect href={getRoleHomeRoute(user.role) as any} />;
  }

  // Redireciona para troca de senha, mas não se já estiver nessa tela
  const currentScreen = segments[segments.length - 1];
  if (user.mustChangePassword && currentScreen !== 'trocar-senha') {
    return <Redirect href="/(profissional)/trocar-senha" />;
  }

  return <Slot />;
}
