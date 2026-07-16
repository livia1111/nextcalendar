import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';

export default function ProfileScreen() {
  const { fontSemiBold, fontRegular } = useAppFonts();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 80 }]}>
      <Text style={[styles.title, { fontFamily: fontSemiBold }]}>Conta</Text>
      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>👤</Text>
        <Text style={[styles.emptyTitle, { fontFamily: fontSemiBold }]}>Seu perfil</Text>
        <Text style={[styles.emptySubtitle, { fontFamily: fontRegular }]}>
          As configurações do seu perfil aparecerão aqui em breve.
        </Text>
      </View>
    </View>
  );
}

// Tela de placeholder para a tab de booking central
export function BookingTabScreen() {
  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white, paddingHorizontal: 20 },
  title: { color: Colors.dark, fontSize: 22, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { color: Colors.dark, fontSize: 18, fontWeight: '600', textAlign: 'center' },
  emptySubtitle: { color: Colors.grey400, fontSize: 14, textAlign: 'center', lineHeight: 21 },
});
