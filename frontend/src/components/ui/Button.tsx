/**
 * Botão primário dourado do app.
 *
 * @example
 * <Button label="Entrar" onPress={() => {}} />
 * <Button label="Carregando..." loading />
 * <Button label="Desabilitado" disabled />
 */

import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline';
  style?: ViewStyle;
}

export function Button({ label, onPress, loading, disabled, variant = 'primary', style }: ButtonProps) {
  const { fontSemiBold } = useAppFonts();
  const isOutline = variant === 'outline';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isOutline ? styles.outline : styles.primary,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}>
      {loading
        ? <ActivityIndicator color={isOutline ? Colors.gold : Colors.white} size="small" />
        : <Text style={[styles.text, { fontFamily: fontSemiBold }, isOutline && styles.outlineText]}>
            {label}
          </Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'stretch',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primary: {
    backgroundColor: Colors.gold,
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.gold,
  },
  disabled: {
    opacity: 0.55,
  },
  text: {
    color: Colors.white,
    fontSize: 16,
    lineHeight: 24.8,
    letterSpacing: -0.32,
    fontWeight: '600',
  },
  outlineText: {
    color: Colors.gold,
  },
});
