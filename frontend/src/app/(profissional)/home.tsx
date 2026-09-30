import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';

/**
 * Tela inicial provisória da área do Profissional.
 */
export default function ProfissionalHome() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  async function handleSignOut() {
    await signOut();
    router.replace('/login');
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}>
      <Text style={styles.greeting}>Olá, {user?.name ?? 'Profissional'} 👋</Text>
      <Text style={styles.subtitle}>Área do Profissional</Text>

      <TouchableOpacity style={styles.button} onPress={handleSignOut} activeOpacity={0.8}>
        <Text style={styles.buttonText}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.dark,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.grey400,
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    backgroundColor: Colors.gold,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
});
