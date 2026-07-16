import { ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';

interface CategoryPillProps {
  label: string;
  icon?: ReactNode;
  selected?: boolean;
  onPress?: () => void;
}

export function CategoryPill({ label, icon, selected = false, onPress }: CategoryPillProps) {
  const { fontRegular } = useAppFonts();
  return (
    <TouchableOpacity
      style={[styles.pill, selected && styles.selected]}
      activeOpacity={0.75}
      onPress={onPress}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={[styles.label, { fontFamily: fontRegular }, selected && styles.selectedLabel]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.grey100,
    backgroundColor: Colors.white,
    gap: 6,
  },
  selected: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  icon: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: Colors.dark,
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: -0.26,
  },
  selectedLabel: {
    color: Colors.white,
    fontWeight: '600',
  },
});
