import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircleIcon, ChevronLeftIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';

export default function NewPasswordScreen() {
  const { fontRegular, fontSemiBold } = useAppFonts();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  function handleSave() {
    if (password && confirm && password === confirm) {
      setShowSuccess(true);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <ChevronLeftIcon />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.title, { fontFamily: fontSemiBold }]}>Digite sua nova senha</Text>
          <Text style={[styles.subtitle, { fontFamily: fontRegular }]}>
            Crie uma senha forte com pelo menos 8 caracteres.
          </Text>
        </View>

        <View style={styles.form}>
          <InputField label="Nova senha" value={password} onChangeText={setPassword} placeholder="Nova senha" secureTextEntry />
          <InputField label="Confirmar a senha" value={confirm} onChangeText={setConfirm} placeholder="Confirmar a senha" secureTextEntry />
        </View>

        <Button label="Salvar" onPress={handleSave} />

      </ScrollView>

      {/* Success Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <CheckCircleIcon size={72} color={Colors.success} />
            <Text style={[styles.modalTitle, { fontFamily: fontSemiBold }]}>Senha Alterada</Text>
            <Text style={[styles.modalSub, { fontFamily: fontRegular }]}>
              Sua senha foi alterada com sucesso!
            </Text>
            <Button
              label="Fazer Login"
              onPress={() => { setShowSuccess(false); router.replace('/login'); }}
            />
          </View>
        </View>
      </Modal>
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
  form: { gap: 16 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modal: { backgroundColor: Colors.white, borderRadius: 20, padding: 32, alignItems: 'center', gap: 16, width: '100%' },
  modalTitle: { color: Colors.dark, fontSize: 22, fontWeight: '700' },
  modalSub: { color: Colors.grey400, fontSize: 14, textAlign: 'center', lineHeight: 21 },
});
