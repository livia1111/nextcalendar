import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeftIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';

export default function ForgotPasswordScreen() {
  const { fontRegular, fontSemiBold } = useAppFonts();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [email, setEmail] = useState('');

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* Back */}
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <ChevronLeftIcon />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { fontFamily: fontSemiBold }]}>Esqueceu a senha?</Text>
          <Text style={[styles.subtitle, { fontFamily: fontRegular }]}>
            Digite o e-mail cadastrado e enviaremos as instruções para recuperar sua senha.
          </Text>
        </View>

        <InputField
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          placeholder="Cadastro@gmail.com"
          keyboardType="email-address"
        />

        <Button label="Enviar código" onPress={() => router.push('/verify-code' as any)} />

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scroll: { paddingHorizontal: 25, gap: 24 },
  back: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: Colors.grey100, alignItems: 'center', justifyContent: 'center' },
  header: { gap: 8 },
  title: { color: Colors.dark, fontSize: 24, lineHeight: 36, fontWeight: '600' },
  subtitle: { color: Colors.grey400, fontSize: 14, lineHeight: 21.7, letterSpacing: -0.28 },
});
