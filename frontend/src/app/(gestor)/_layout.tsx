import { Tabs } from 'expo-router';
import { ColorValue, StyleSheet } from 'react-native';
import { CalendarTabIcon, ClockIcon, UsersIcon, UserTabIcon } from '@/components/icons';
import { Colors } from '@/constants/colors';

interface TabBarIconProps {
  focused: boolean;
  color: ColorValue;
  size: number;
}

function AgendaIcon({ focused }: TabBarIconProps) {
  return <CalendarTabIcon color={focused ? Colors.gold : Colors.grey400} />;
}
function ServicosIcon({ focused }: TabBarIconProps) {
  return <ClockIcon color={focused ? Colors.gold : Colors.grey400} />;
}
function EquipeIcon({ focused }: TabBarIconProps) {
  return <UsersIcon color={focused ? Colors.gold : Colors.grey400} />;
}
function PerfilIcon({ focused }: TabBarIconProps) {
  return <UserTabIcon color={focused ? Colors.gold : Colors.grey400} />;
}

/**
 * Barra de navegação da área do Gestor.
 *
 * Cada aba é uma tela própria (sem dependência entre elas) — todas usam o
 * hook useEstablishment() para resolver o establishmentId de forma independente.
 */
export default function GestorTabLayout() {
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
        name="agenda"
        options={{ title: 'Agenda', tabBarIcon: AgendaIcon }}
      />
      <Tabs.Screen
        name="servicos"
        options={{ title: 'Serviços', tabBarIcon: ServicosIcon }}
      />
      <Tabs.Screen
        name="equipe"
        options={{ title: 'Equipe', tabBarIcon: EquipeIcon }}
      />
      <Tabs.Screen
        name="perfil"
        options={{ title: 'Perfil', tabBarIcon: PerfilIcon }}
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
