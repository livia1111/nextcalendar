import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';

interface DividerProps {
  label?: string;
}

export function Divider({ label = 'Ou continue com' }: DividerProps) {
  const { fontRegular } = useAppFonts();
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <Text style={[styles.text, { fontFamily: fontRegular }]}>{label}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.grey100,
  },
  text: {
    color: Colors.grey400,
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: -0.26,
  },
});
