import { ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';

interface SocialButtonProps {
  icon: ReactNode;
  label: string;
  onPress?: () => void;
}

export function SocialButton({ icon, label, onPress }: SocialButtonProps) {
  const { fontRegular } = useAppFonts();
  return (
    <TouchableOpacity style={styles.button} activeOpacity={0.75} onPress={onPress}>
      <View style={styles.icon}>{icon}</View>
      <Text style={[styles.text, { fontFamily: fontRegular }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.grey100,
    paddingHorizontal: 16,
    gap: 12,
    backgroundColor: Colors.white,
  },
  icon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: Colors.dark,
    fontSize: 15,
    lineHeight: 23,
    letterSpacing: -0.3,
  },
});
