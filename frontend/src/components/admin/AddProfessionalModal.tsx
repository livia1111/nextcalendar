import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { XIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';
import { ProfessionalCreateInput } from '@/services/professionalServices';
import { formatPhone } from '@/utils/formatters';

interface AddProfessionalModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: ProfessionalCreateInput) => Promise<void>;
}

export function AddProfessionalModal({
  visible,
  onClose,
  onSubmit,
}: AddProfessionalModalProps) {
  const { fontSemiBold, fontRegular } = useAppFonts();

  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [commission, setCommission] = useState('50');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function formatCpf(val: string) {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  function resetForm() {
    setName('');
    setNickname('');
    setSpecialty('');
    setCpf('');
    setPhone('');
    setEmail('');
    setCommission('50');
    setError('');
  }

  async function handleSave() {
    if (!name.trim()) {
      setError('O nome do profissional é obrigatório.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Informe um e-mail válido.');
      return;
    }
    if (!phone.trim()) {
      setError('Informe um telefone de contato.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      await onSubmit({
        name: name.trim(),
        nickname: nickname.trim() || undefined,
        specialty: specialty.trim() || 'Profissional',
        cpf: cpf.replace(/\D/g, '') || '000.000.000-00',
        phone: phone.trim(),
        email: email.trim(),
        password: 'TempPassword123!',
        commission: Number(commission) || 50,
      });
      resetForm();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Não foi possível cadastrar o profissional.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleCol}>
              <Text style={[styles.title, { fontFamily: fontSemiBold }]}>
                Novo Profissional
              </Text>
              <Text style={[styles.subtitle, { fontFamily: fontRegular }]}>
                Adicione um membro à equipe do estabelecimento
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}>
              <XIcon size={18} color={Colors.grey500} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled">
            <InputField
              label="Nome completo *"
              placeholder="Ex: Carlos Silva"
              value={name}
              onChangeText={setName}
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <InputField
                  label="Apelido / Exibição"
                  placeholder="Ex: Carlinhos"
                  value={nickname}
                  onChangeText={setNickname}
                />
              </View>
              <View style={{ flex: 1 }}>
                <InputField
                  label="Especialidade"
                  placeholder="Ex: Barbeiro Master"
                  value={specialty}
                  onChangeText={setSpecialty}
                />
              </View>
            </View>

            <InputField
              label="E-mail *"
              placeholder="carlos@barbearia.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <InputField
                  label="Telefone / Celular *"
                  placeholder="(99) 99999-9999"
                  value={phone}
                  onChangeText={(t) => setPhone(formatPhone(t))}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <InputField
                  label="CPF"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChangeText={(t) => setCpf(formatCpf(t))}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <InputField
              label="Comissão Padrão (%)"
              placeholder="Ex: 50"
              value={commission}
              onChangeText={setCommission}
              keyboardType="number-pad"
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.actions}>
              <Button
                label={submitting ? 'Salvando...' : 'Cadastrar Profissional'}
                onPress={handleSave}
                disabled={submitting}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 13, 18, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grey100,
  },
  headerTitleCol: {
    gap: 4,
    flex: 1,
  },
  title: {
    fontSize: 18,
    color: Colors.dark,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.grey400,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContent: {
    paddingHorizontal: 24,
    paddingTop: 18,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    textAlign: 'center',
  },
  actions: {
    marginTop: 8,
    paddingBottom: 12,
  },
});
