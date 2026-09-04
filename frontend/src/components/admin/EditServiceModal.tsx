import { useEffect, useState } from 'react';
import {
  Alert,
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
import { ServiceResponse, ServiceUpdatePayload } from '@/services/serviceServices';

interface EditServiceModalProps {
  visible: boolean;
  service: ServiceResponse | null;
  onClose: () => void;
  onSubmit: (serviceId: string, data: ServiceUpdatePayload) => Promise<void>;
  onDelete: (serviceId: string) => Promise<void>;
}

export function EditServiceModal({
  visible,
  service,
  onClose,
  onSubmit,
  onDelete,
}: EditServiceModalProps) {
  const { fontSemiBold, fontRegular } = useAppFonts();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  // Preenche o formulário sempre que um novo serviço for selecionado para edição
  useEffect(() => {
    if (service) {
      setName(service.name);
      setCategory(service.category);
      setPrice(String(service.price).replace('.', ','));
      setDuration(String(service.duration));
      setError('');
    }
  }, [service]);

  function parsePrice(val: string) {
    const normalized = val.replace(/\./g, '').replace(',', '.');
    return Number(normalized);
  }

  async function handleSave() {
    if (!service) return;

    if (!name.trim()) {
      setError('O nome do serviço é obrigatório.');
      return;
    }
    if (!category.trim()) {
      setError('Informe a categoria do serviço.');
      return;
    }
    const priceValue = parsePrice(price);
    if (!price.trim() || isNaN(priceValue) || priceValue <= 0) {
      setError('Informe um valor válido para o serviço.');
      return;
    }
    const durationValue = Number(duration);
    if (!duration.trim() || isNaN(durationValue) || durationValue <= 0) {
      setError('Informe uma duração válida (em minutos).');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await onSubmit(service.id, {
        name: name.trim(),
        category: category.trim(),
        price: priceValue,
        duration: durationValue,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Não foi possível salvar as alterações.');
    } finally {
      setSubmitting(false);
    }
  }

  function confirmDelete() {
    if (!service) return;

    // Alert.alert com múltiplos botões não funciona de forma confiável na web
    // (react-native-web não implementa os callbacks de botão). Por isso,
    // usamos window.confirm() nativo do navegador quando rodando na web.
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Tem certeza que deseja excluir "${service.name}"? Essa ação não pode ser desfeita.`
      );
      if (confirmed) {
        handleDelete();
      }
      return;
    }

    Alert.alert(
      'Excluir Serviço',
      `Tem certeza que deseja excluir "${service.name}"? Essa ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: handleDelete },
      ]
    );
  }

  async function handleDelete() {
    if (!service) return;
    setDeleting(true);
    try {
      await onDelete(service.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Não foi possível excluir o serviço.');
    } finally {
      setDeleting(false);
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
                Editar Serviço
              </Text>
              <Text style={[styles.subtitle, { fontFamily: fontRegular }]}>
                Atualize as informações ou remova o serviço
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
              label="Nome do serviço *"
              placeholder="Ex: Corte Degradê"
              value={name}
              onChangeText={setName}
            />

            <InputField
              label="Categoria *"
              placeholder="Ex: Cabelo, Barba, Combo"
              value={category}
              onChangeText={setCategory}
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <InputField
                  label="Valor (R$) *"
                  placeholder="Ex: 45,00"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <InputField
                  label="Duração (min) *"
                  placeholder="Ex: 30"
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.actions}>
              <Button
                label={submitting ? 'Salvando...' : 'Salvar Alterações'}
                onPress={handleSave}
                disabled={submitting || deleting}
              />
            </View>

            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={confirmDelete}
              disabled={submitting || deleting}
              activeOpacity={0.7}>
              <Text style={[styles.deleteText, { fontFamily: fontSemiBold }]}>
                {deleting ? 'Excluindo...' : 'Excluir Serviço'}
              </Text>
            </TouchableOpacity>
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
  },
  deleteBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
    marginBottom: 8,
  },
  deleteText: {
    color: Colors.error,
    fontSize: 14,
  },
});
