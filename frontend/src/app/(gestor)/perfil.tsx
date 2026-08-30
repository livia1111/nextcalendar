import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { SettingsIcon, LocationPinIcon } from '@/components/icons';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';
import { useAuth } from '@/context/AuthContext';
import { useEstablishment } from '@/hooks/useEstablishment';

export default function PerfilScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { fontSemiBold, fontRegular } = useAppFonts();
  const { user, signOut } = useAuth();
  const { establishmentName } = useEstablishment();

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { fontFamily: fontSemiBold }]}>Perfil</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <LocationPinIcon size={16} color={Colors.goldDark} />
            <View>
              <Text style={[styles.label, { fontFamily: fontRegular }]}>Estabelecimento</Text>
              <Text style={[styles.value, { fontFamily: fontSemiBold }]}>{establishmentName}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View>
              <Text style={[styles.label, { fontFamily: fontRegular }]}>Gestor</Text>
              <Text style={[styles.value, { fontFamily: fontSemiBold }]}>{user?.name || '—'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View>
              <Text style={[styles.label, { fontFamily: fontRegular }]}>E-mail</Text>
              <Text style={[styles.value, { fontFamily: fontSemiBold }]}>{user?.email || '—'}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.optionRow}
          activeOpacity={0.7}
          onPress={() => router.push('/empresa')}>
          <SettingsIcon size={18} color={Colors.dark} />
          <Text style={[styles.optionText, { fontFamily: fontSemiBold }]}>
            Configurações do Estabelecimento
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.signOutBtn} activeOpacity={0.7} onPress={signOut}>
          <Text style={[styles.signOutText, { fontFamily: fontSemiBold }]}>Sair</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollContent: {
    gap: 20,
  },
  header: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    color: Colors.dark,
  },
  card: {
    marginHorizontal: 20,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.grey100,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    fontSize: 12,
    color: Colors.grey400,
  },
  value: {
    fontSize: 15,
    color: Colors.dark,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.grey100,
  },
  optionRow: {
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.grey100,
  },
  optionText: {
    fontSize: 14,
    color: Colors.dark,
  },
  signOutBtn: {
    marginHorizontal: 20,
    alignItems: 'center',
    paddingVertical: 14,
  },
  signOutText: {
    color: Colors.error,
    fontSize: 15,
  },
});
