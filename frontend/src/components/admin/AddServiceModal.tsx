import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
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
import { ServiceCreatePayload } from '@/services/serviceServices';

// ─── Opções de duração (15 em 15 minutos, de 15 até 240) ──────────────────────

interface DurationOption { label: string; value: number; }

function buildDurationLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h 00min (${minutes} min)` : `${h}h ${String(m).padStart(2, '0')}min (${minutes} min)`;
}

const DURATION_OPTIONS: DurationOption[] = Array.from({ length: 16 }, (_, i) => {
  const value = (i + 1) * 15;
  return { label: buildDurationLabel(value), value };
});

// ─── Máscara de moeda BRL ─────────────────────────────────────────────────────

function maskBRL(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  const amount = Number(digits) / 100;
  return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseBRL(masked: string): number {
  const digits = masked.replace(/\D/g, '');
  return Number(digits) / 100;
}

/** Converte valor numérico vindo da API para a máscara de exibição. */
function numberToBRLMask(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── DurationPicker — select nativo na web, picker modal no mobile ────────────

interface DurationPickerProps {
  value: number | null;
  onChange: (val: number) => void;
  fontRegular: string;
  fontSemiBold: string;
}

function DurationPicker({ value, onChange, fontRegular, fontSemiBold }: DurationPickerProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const selectedLabel = DURATION_OPTIONS.find(o => o.value === value)?.label ?? 'Selecione...';

  // Na web renderizamos um <select> HTML nativo estilizado via View/Text
  if (Platform.OS === 'web') {
    return (
      <View style={dp.wrapper}>
        <Text style={[dp.label, { fontFamily: fontSemiBold }]}>Duração *</Text>
        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
        {/* @ts-ignore — select HTML válido na web via react-native-web */}
        <select
          value={value ?? ''}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(Number(e.target.value))}
          style={{
            height: 48,
            borderRadius: 10,
            borderWidth: 1.5,
            borderColor: Colors.grey200,
            backgroundColor: Colors.white,
            paddingLeft: 14,
            paddingRight: 14,
            fontSize: 14,
            color: value ? Colors.dark : Colors.grey400,
            fontFamily: fontRegular,
            width: '100%',
            appearance: 'none',
            WebkitAppearance: 'none',
            cursor: 'pointer',
            border: `1.5px solid ${Colors.grey200}`,
            outline: 'none',
          } as any}
        >
          <option value="" disabled>Selecione...</option>
          {DURATION_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </View>
    );
  }

  // Mobile: botão que abre um modal picker
  return (
    <View style={dp.wrapper}>
      <Text style={[dp.label, { fontFamily: fontSemiBold }]}>Duração *</Text>
      <TouchableOpacity
        style={[dp.trigger, !value && dp.triggerEmpty]}
        onPress={() => setPickerOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={[dp.triggerText, { fontFamily: fontRegular }, !value && dp.triggerPlaceholder]}>
          {selectedLabel}
        </Text>
        <Text style={dp.chevron}>▾</Text>
      </TouchableOpacity>

      <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={dp.backdrop} onPress={() => setPickerOpen(false)} />
        <View style={dp.pickerSheet}>
          <View style={dp.pickerHeader}>
            <Text style={[dp.pickerTitle, { fontFamily: fontSemiBold }]}>Duração do serviço</Text>
            <TouchableOpacity onPress={() => setPickerOpen(false)}>
              <XIcon size={18} color={Colors.grey500} />
            </TouchableOpacity>
          </View>
          <ScrollView style={dp.pickerList} showsVerticalScrollIndicator={false}>
            {DURATION_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[dp.pickerItem, opt.value === value && dp.pickerItemSelected]}
                onPress={() => { onChange(opt.value); setPickerOpen(false); }}
                activeOpacity={0.7}
              >
                <Text style={[dp.pickerItemText, { fontFamily: fontRegular }, opt.value === value && dp.pickerItemTextSelected]}>
                  {opt.label}
                </Text>
                {opt.value === value && <Text style={dp.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ─── DurationPicker styles ────────────────────────────────────────────────────

const dp = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { fontSize: 13, color: Colors.dark },
  trigger: {
    height: 48, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.grey200,
    backgroundColor: Colors.white, paddingHorizontal: 14, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  triggerEmpty: { borderColor: Colors.grey200 },
  triggerText: { fontSize: 14, color: Colors.dark, flex: 1 },
  triggerPlaceholder: { color: Colors.grey400 },
  chevron: { fontSize: 14, color: Colors.grey400, marginLeft: 8 },
  backdrop: { flex: 1, backgroundColor: 'rgba(13,13,18,0.35)' },
  pickerSheet: {
    backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '60%', paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 36 : 20,
  },
  pickerHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.grey100,
  },
  pickerTitle: { fontSize: 16, color: Colors.dark },
  pickerList: {},
  pickerItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.grey100,
  },
  pickerItemSelected: { backgroundColor: Colors.surface },
  pickerItemText: { fontSize: 14, color: Colors.dark },
  pickerItemTextSelected: { color: Colors.gold },
  checkmark: { fontSize: 16, color: Colors.gold },
});

// ─── AddServiceModal ──────────────────────────────────────────────────────────

interface AddServiceModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: ServiceCreatePayload) => Promise<void>;
}

export function AddServiceModal({ visible, onClose, onSubmit }: AddServiceModalProps) {
  const { fontSemiBold, fontRegular } = useAppFonts();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function resetForm() {
    setName('');
    setCategory('');
    setPrice('');
    setDuration(null);
    setError('');
  }

  async function handleSave() {
    if (!name.trim()) { setError('O nome do serviço é obrigatório.'); return; }
    if (!category.trim()) { setError('Informe a categoria do serviço.'); return; }
    const priceValue = parseBRL(price);
    if (!price.trim() || isNaN(priceValue) || priceValue <= 0) {
      setError('Informe um valor válido para o serviço.');
      return;
    }
    if (!duration || duration <= 0) {
      setError('Selecione a duração do serviço.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), category: category.trim(), price: priceValue, duration });
      resetForm();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Não foi possível cadastrar o serviço.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleCol}>
              <Text style={[styles.title, { fontFamily: fontSemiBold }]}>Novo Serviço</Text>
              <Text style={[styles.subtitle, { fontFamily: fontRegular }]}>
                Adicione um serviço ao catálogo do estabelecimento
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <XIcon size={18} color={Colors.grey500} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
            <InputField label="Nome do serviço *" placeholder="Ex: Corte Degradê" value={name} onChangeText={setName} />

            <InputField label="Categoria *" placeholder="Ex: Cabelo, Barba, Combo" value={category} onChangeText={setCategory} />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <InputField
                  label="Valor (R$) *"
                  placeholder="0,00"
                  value={price}
                  onChangeText={(t) => setPrice(maskBRL(t))}
                  keyboardType="number-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <DurationPicker
                  value={duration}
                  onChange={setDuration}
                  fontRegular={fontRegular}
                  fontSemiBold={fontSemiBold}
                />
              </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.actions}>
              <Button label={submitting ? 'Salvando...' : 'Cadastrar Serviço'} onPress={handleSave} disabled={submitting} />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(13, 13, 18, 0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: '90%', paddingTop: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    shadowColor: Colors.dark, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1,
    shadowRadius: 12, elevation: 10,
  },
  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.grey100,
  },
  headerTitleCol: { gap: 4, flex: 1 },
  title: { fontSize: 18, color: Colors.dark },
  subtitle: { fontSize: 13, color: Colors.grey400 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  formContent: { paddingHorizontal: 24, paddingTop: 18, gap: 16, paddingBottom: 16 },
  row: { flexDirection: 'row', gap: 12 },
  errorText: { color: Colors.error, fontSize: 13, textAlign: 'center' },
  actions: { marginTop: 8, paddingBottom: 12 },
});
