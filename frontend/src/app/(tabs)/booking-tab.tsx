import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';

/** Tela placeholder para o botão central de QR/Booking da tab bar */
export default function BookingTabScreen() {
  const { fontSemiBold } = useAppFonts();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={[styles.title, { fontFamily: fontSemiBold }]}>Agendamento</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  title: { color: Colors.dark, fontSize: 22 },
});
