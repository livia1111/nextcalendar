import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeftIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';

const CODE_LENGTH = 4;

export default function VerifyCodeScreen() {
  const { fontRegular, fontSemiBold } = useAppFonts();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [code, setCode] = useState(['', '', '', '']);
  const inputs = useRef<(TextInput | null)[]>([]);

  function handleChange(text: string, idx: number) {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const next = [...code];
    next[idx] = digit;
    setCode(next);
    if (digit && idx < CODE_LENGTH - 1) {
      inputs.current[idx + 1]?.focus();
    }
  }

  function handleKeyPress(e: any, idx: number) {
    if (e.nativeEvent.key === 'Backspace' && !code[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
      <StatusBar style="dark" />

      <View style={styles.scroll}>
        {/* Back */}
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <ChevronLeftIcon />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { fontFamily: fontSemiBold }]}>Digite o código enviado</Text>
          <Text style={[styles.subtitle, { fontFamily: fontRegular }]}>
            Enviamos um código de verificação para o seu e-mail cadastrado.
          </Text>
        </View>

        {/* OTP Inputs */}
        <View style={styles.otpRow}>
          {code.map((digit, idx) => (
            <TextInput
              key={idx}
              ref={r => { inputs.current[idx] = r; }}
              style={[styles.otpBox, digit && styles.otpBoxFilled]}
              value={digit}
              onChangeText={t => handleChange(t, idx)}
              onKeyPress={e => handleKeyPress(e, idx)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectionColor={Colors.gold}
            />
          ))}
        </View>

        {/* Resend */}
        <View style={styles.resendRow}>
          <Text style={[styles.resendText, { fontFamily: fontRegular }]}>Não recebeu o código? </Text>
          <TouchableOpacity>
            <Text style={[styles.resendLink, { fontFamily: fontSemiBold }]}>Reenviar</Text>
          </TouchableOpacity>
        </View>

        <Button
          label="Verificar"
          onPress={() => router.push('/new-password' as any)}
          disabled={code.some(d => !d)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white, paddingHorizontal: 25 },
  scroll: { flex: 1, gap: 28 },
  back: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: Colors.grey100, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  header: { gap: 8 },
  title: { color: Colors.dark, fontSize: 24, lineHeight: 36, fontWeight: '600' },
  subtitle: { color: Colors.grey400, fontSize: 14, lineHeight: 21.7, letterSpacing: -0.28 },
  otpRow: { flexDirection: 'row', gap: 16, justifyContent: 'center' },
  otpBox: {
    width: 64,
    height: 64,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.grey100,
    fontSize: 28,
    fontWeight: '700',
    color: Colors.dark,
    backgroundColor: Colors.surface,
  },
  otpBoxFilled: {
    borderColor: Colors.gold,
    backgroundColor: Colors.white,
  },
  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  resendText: { color: Colors.grey400, fontSize: 14 },
  resendLink: { color: Colors.gold, fontSize: 14, fontWeight: '600' },
});
