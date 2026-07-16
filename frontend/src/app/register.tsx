import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';

export default function RegisterScreen() {
  const { fontRegular, fontSemiBold } = useAppFonts();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        <Image
          source={{ uri: 'https://api.builder.io/api/v1/image/assets/TEMP/b6498689774337ed760cfa4c9fc86c77834936e1?width=300' }}
          style={styles.logo}
          contentFit="contain"
        />

        <View style={styles.header}>
          <Text style={[styles.title, { fontFamily: fontSemiBold }]}>Criar Nova Conta</Text>
          <Text style={[styles.subtitle, { fontFamily: fontRegular }]}>Preencha seus dados para se cadastrar</Text>
        </View>

        <View style={styles.form}>
          <InputField label="Nome completo" value={name} onChangeText={setName} placeholder="Seu nome completo" autoCapitalize="words" />
          <InputField label="Email" value={email} onChangeText={setEmail} placeholder="seu@email.com" keyboardType="email-address" />
          <InputField label="Número de telefone" value={phone} onChangeText={setPhone} placeholder="(00) 00000-0000" keyboardType="phone-pad" />
          <InputField label="Senha" value={password} onChangeText={setPassword} placeholder="••••••••••••" secureTextEntry />
        </View>

        <Button label="Criar conta" onPress={() => router.push('/(tabs)/home' as any)} />

        <View style={styles.loginRow}>
          <Text style={[styles.loginText, { fontFamily: fontRegular }]}>Já tem uma conta? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.loginLink, { fontFamily: fontSemiBold }]}>Entrar</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scroll: { paddingHorizontal: 25, alignItems: 'center', gap: 24 },
  logo: { width: 150, height: 124 },
  header: { alignSelf: 'stretch', gap: 8 },
  title: { color: Colors.dark, fontSize: 24, lineHeight: 36, fontWeight: '600' },
  subtitle: { color: Colors.grey400, fontSize: 14, lineHeight: 21.7, letterSpacing: -0.28 },
  form: { alignSelf: 'stretch', gap: 16 },
  loginRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  loginText: { color: Colors.grey400, fontSize: 14, lineHeight: 21.7, letterSpacing: -0.28 },
  loginLink: { color: Colors.gold, fontSize: 14, lineHeight: 21.7, letterSpacing: -0.28, fontWeight: '600' },
});
