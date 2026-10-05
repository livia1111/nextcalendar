import { Redirect, Tabs, useSegments } from 'expo-router';
import { ColorValue, StyleSheet } from 'react-native';
import { AttendanceTabIcon, CalendarTabIcon, ClockIcon, UserTabIcon } from '@/components/icons';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { getRoleHomeRoute } from '@/utils/roleHomeRoute';

interface TabBarIconProps {
  focused: boolean;
  color: ColorValue;
  size: number;
}

function AgendaIcon({ focused }: TabBarIconProps) {
  return <CalendarTabIcon color={focused ? Colors.gold : Colors.grey400} />;
}
function BloqueiosIcon({ focused }: TabBarIconProps) {
  return <ClockIcon color={focused ? Colors.gold : Colors.grey400} />;
}
function AtendimentosIcon({ focused }: TabBarIconProps) {
  return <AttendanceTabIcon color={focused ? Colors.gold : Colors.grey400} />;
}
function PerfilIcon({ focused }: TabBarIconProps) {
  return <UserTabIcon color={focused ? Colors.gold : Colors.grey400} />;
}

/**
 * Layout com Tabs da área do Profissional.
 *
 * Guards (em ordem):
 * 1. Não autenticado → /login
 * 2. Role errado → home do role correto
 * 3. mustChangePassword = true → /(profissional)/trocar-senha
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

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: Colors.grey400,
        tabBarShowLabel: true,
      }}>
      <Tabs.Screen
        name="home"
        options={{ title: 'Agenda', tabBarIcon: AgendaIcon }}
      />
      <Tabs.Screen
        name="atendimentos"
        options={{ title: 'Atendimentos', tabBarIcon: AtendimentosIcon }}
      />
      <Tabs.Screen
        name="bloqueios"
        options={{ title: 'Bloqueios', tabBarIcon: BloqueiosIcon }}
      />
      <Tabs.Screen
        name="perfil"
        options={{ title: 'Perfil', tabBarIcon: PerfilIcon }}
      />
      <Tabs.Screen
        name="trocar-senha"
        options={{ href: null, tabBarStyle: { display: 'none' } }}
      />
      <Tabs.Screen
        name="novo-bloqueio"
        options={{ href: null, tabBarStyle: { display: 'none' } }}
      />
      <Tabs.Screen
        name="comanda"
        options={{ href: null, tabBarStyle: { display: 'none' } }}
      />
      <Tabs.Screen
        name="produtos"
        options={{ href: null, tabBarStyle: { display: 'none' } }}
      />
      <Tabs.Screen
        name="clientes"
        options={{ href: null, tabBarStyle: { display: 'none' } }}
      />
      <Tabs.Screen
        name="atendimento"
        options={{ href: null, tabBarStyle: { display: 'none' } }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.grey100,
    height: 72,
    paddingBottom: 12,
    paddingTop: 8,
    elevation: 8,
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
});
