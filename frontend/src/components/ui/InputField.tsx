/**
 * Campo de input com label, usado em todos os formulários do app.
 *
 * @example
 * <InputField label="Email" value={email} onChangeText={setEmail} placeholder="seu@email.com" keyboardType="email-address" />
 * <InputField label="Senha" value={pw} onChangeText={setPw} secureTextEntry />
 */

import { useState } from 'react';
import {
  KeyboardTypeOptions,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { EyeIcon } from '@/components/icons';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  style?: ViewStyle;
  editable?: boolean;
}

export function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  secureTextEntry = false,
  autoCapitalize = 'none',
  style,
  editable = true,
}: InputFieldProps) {
  const { fontRegular, fontSemiBold } = useAppFonts();
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <View style={[styles.group, style]}>
      <Text style={[styles.label, { fontFamily: fontSemiBold }]}>{label}</Text>
      <View style={styles.wrapper}>
        <TextInput
          style={[styles.input, { fontFamily: fontRegular, flex: 1 }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.grey400}
          secureTextEntry={secureTextEntry && !passwordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          editable={editable}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setPasswordVisible(v => !v)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <EyeIcon visible={passwordVisible} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 6,
  },
  label: {
    color: Colors.dark,
    fontSize: 14,
    lineHeight: 21.7,
    letterSpacing: -0.28,
    fontWeight: '500',
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.grey100,
    backgroundColor: Colors.white,
    gap: 8,
  },
  input: {
    color: Colors.dark,
    fontSize: 16,
    lineHeight: 25.6,
    letterSpacing: -0.32,
    padding: 0,
  },
});
