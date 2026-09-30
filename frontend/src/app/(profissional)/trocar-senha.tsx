import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { changePassword } from '@/services/authServices';
import { isAxiosError } from 'axios';

export default function TrocarSenhaScreen() {
  const { updateUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleChangePassword() {
    setError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Preencha todos os campos.');
      return;
    }

    if (newPassword.length < 8) {
      setError('A nova senha deve ter no mínimo 8 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('A nova senha e a confirmação não coincidem.');
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      // Atualiza o AuthContext localmente — sem precisar fazer novo login
      await updateUser({ mustChangePassword: false });
      router.replace('/(profissional)/home');
    } catch (err) {
      if (isAxiosError(err)) {
        const data = err.response?.data;
        const msg =
          typeof data === 'string' ? data.trim()
          : typeof data?.message === 'string' ? data.message
          : 'Não foi possível trocar a senha. Tente novamente.';
        setError(msg);
      } else {
        setError('Não foi possível trocar a senha. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        <View style={styles.header}>
          <Text style={styles.title}>Troque sua senha 🔐</Text>
          <Text style={styles.subtitle}>
            Por segurança, você precisa criar uma senha pessoal antes de continuar.
          </Text>
        </View>

        <View style={styles.form}>
          <InputField
            label="Senha provisória"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Digite a senha recebida"
            secureTextEntry
          />
          <InputField
            label="Nova senha"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Mínimo 8 caracteres"
            secureTextEntry
          />
          <InputField
            label="Confirmar nova senha"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Repita a nova senha"
            secureTextEntry
          />
        </View>

        <Button
          label={isSubmitting ? 'Salvando...' : 'Salvar nova senha'}
          onPress={handleChangePassword}
          disabled={isSubmitting}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scroll: { paddingHorizontal: 24, gap: 24 },
  header: { gap: 8 },
  title: { color: Colors.dark, fontSize: 24, fontWeight: '600', lineHeight: 34 },
  subtitle: { color: Colors.grey400, fontSize: 14, lineHeight: 21 },
  form: { gap: 16 },
  errorText: { color: '#E53935', fontSize: 13 },
});
