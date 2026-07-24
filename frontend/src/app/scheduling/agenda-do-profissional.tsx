import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircleIcon, ChevronLeftIcon, PlusIcon, XIcon } from '@/components/icons';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';
import { useAuth } from '@/context/AuthContext';
import {
  getAgendaByDate,
  blockSlot,
  cancelAppointment,
  createAppointment,
  type AgendaSlot,
} from '@/services/agendaServices';

const VIEWS = ['Linha do tempo', 'Semana', 'Mês'] as const;
type ViewMode = typeof VIEWS[number];

const STATUS_STYLE: Record<AgendaSlot['status'], { bg: string; border: string; label: string }> = {
  confirmed: { bg: '#E6F9EF', border: Colors.success, label: 'Confirmado' },
  encaixe: { bg: '#EAF2FF', border: '#3B82F6', label: 'Encaixe' },
  blocked: { bg: '#FDECEA', border: Colors.error, label: 'Bloqueado' },
  free: { bg: Colors.surface, border: Colors.grey200, label: 'Livre' },
};

function formatDateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function buildWeekStrip(center: Date) {
  const days: Date[] = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date(center);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function AgendaDoProfissionalScreen() {
  const { fontRegular, fontSemiBold, fontBold } = useAppFonts();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useAuth();

  const [viewMode, setViewMode] = useState<ViewMode>('Linha do tempo');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [slots, setSlots] = useState<AgendaSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const [quickActionSlot, setQuickActionSlot] = useState<AgendaSlot | null>(null);
  const [newAppointmentSlot, setNewAppointmentSlot] = useState<AgendaSlot | null>(null);
  const [clientName, setClientName] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [isEncaixe, setIsEncaixe] = useState(false);
  const [successModal, setSuccessModal] = useState<'cancel' | 'block' | null>(null);

  const weekStrip = useMemo(() => buildWeekStrip(selectedDate), [selectedDate]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const data = await getAgendaByDate(formatDateKey(selectedDate), token);
      if (active) setSlots(data);
      setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [selectedDate, token]);

  function handleSlotPress(slot: AgendaSlot) {
    setQuickActionSlot(slot);
  }

  function openNewAppointmentForm(slot: AgendaSlot, encaixe = false) {
    setQuickActionSlot(null);
    setNewAppointmentSlot(slot);
    setIsEncaixe(encaixe);
    setClientName('');
    setServiceName('');
  }

  async function handleBlockSlot() {
    if (!quickActionSlot) return;
    await blockSlot(quickActionSlot.id, token);
    setSlots((prev) =>
      prev.map((s) => (s.id === quickActionSlot.id ? { ...s, status: 'blocked' } : s))
    );
    setQuickActionSlot(null);
    setSuccessModal('block');
  }

  async function handleCancelAppointment() {
    if (!quickActionSlot) return;
    await cancelAppointment(quickActionSlot.id, token);
    setSlots((prev) =>
      prev.map((s) =>
        s.id === quickActionSlot.id
          ? { ...s, status: 'free', clientName: undefined, service: undefined }
          : s
      )
    );
    setQuickActionSlot(null);
    setSuccessModal('cancel');
  }

  async function handleCreateAppointment() {
    if (!newAppointmentSlot || !clientName || !serviceName) return;
    await createAppointment(
      { slotId: newAppointmentSlot.id, clientName, service: serviceName, isEncaixe },
      token
    );
    setSlots((prev) =>
      prev.map((s) =>
        s.id === newAppointmentSlot.id
          ? { ...s, status: isEncaixe ? 'encaixe' : 'confirmed', clientName, service: serviceName }
          : s
      )
    );
    setNewAppointmentSlot(null);
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ChevronLeftIcon size={22} />
        </TouchableOpacity>
        <Text style={[styles.title, { fontFamily: fontBold }]}>Agenda</Text>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.push('/scheduling/buscar-horario')}>
          <Text style={{ fontSize: 18 }}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* View selector */}
      <View style={styles.viewSelector}>
        {VIEWS.map((v) => (
          <TouchableOpacity
            key={v}
            style={[styles.viewTab, viewMode === v && styles.viewTabActive]}
            onPress={() => setViewMode(v)}>
            <Text
              style={[
                styles.viewTabText,
                { fontFamily: fontSemiBold },
                viewMode === v && styles.viewTabTextActive,
              ]}>
              {v}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Date strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateStrip}>
        {weekStrip.map((d) => {
          const isSelected = formatDateKey(d) === formatDateKey(selectedDate);
          return (
            <TouchableOpacity
              key={d.toISOString()}
              style={[styles.dateChip, isSelected && styles.dateChipActive]}
              onPress={() => setSelectedDate(d)}>
              <Text
                style={[
                  styles.dateChipWeekday,
                  { fontFamily: fontRegular },
                  isSelected && styles.dateChipTextActive,
                ]}>
                {WEEKDAY_LABELS[d.getDay()]}
              </Text>
              <Text
                style={[
                  styles.dateChipDay,
                  { fontFamily: fontSemiBold },
                  isSelected && styles.dateChipTextActive,
                ]}>
                {d.getDate()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        {(['confirmed', 'encaixe', 'blocked'] as const).map((s) => (
          <View key={s} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: STATUS_STYLE[s].border }]} />
            <Text style={[styles.legendText, { fontFamily: fontRegular }]}>
              {STATUS_STYLE[s].label}
            </Text>
          </View>
        ))}
      </View>

      {/* Body */}
      {viewMode !== 'Linha do tempo' ? (
        <View style={styles.placeholder}>
          <Text style={[styles.placeholderText, { fontFamily: fontRegular }]}>
            Visão "{viewMode}" em breve.
          </Text>
        </View>
      ) : loading ? (
        <ActivityIndicator color={Colors.gold} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 40 }]}>
          {slots.map((slot) => {
            const style = STATUS_STYLE[slot.status];
            return (
              <TouchableOpacity
                key={slot.id}
                style={[styles.slotRow, { backgroundColor: style.bg, borderColor: style.border }]}
                onPress={() => handleSlotPress(slot)}>
                <Text style={[styles.slotTime, { fontFamily: fontSemiBold }]}>{slot.time}</Text>
                {slot.status === 'free' ? (
                  <Text style={[styles.slotFreeText, { fontFamily: fontRegular }]}>Livre</Text>
                ) : slot.status === 'blocked' ? (
                  <Text style={[styles.slotFreeText, { fontFamily: fontRegular }]}>Bloqueado</Text>
                ) : (
                  <View style={styles.slotClientInfo}>
                    <Text style={[styles.slotClientName, { fontFamily: fontSemiBold }]}>
                      {slot.clientName}
                    </Text>
                    <Text style={[styles.slotService, { fontFamily: fontRegular }]}>
                      {slot.service}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Quick Actions Modal */}
      <Modal visible={!!quickActionSlot} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setQuickActionSlot(null)}>
              <XIcon size={20} color={Colors.grey500} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { fontFamily: fontBold }]}>
              {quickActionSlot?.time}
            </Text>

            {quickActionSlot?.status === 'free' ? (
              <>
                <ActionRow
                  label="+ Novo Agendamento"
                  onPress={() => quickActionSlot && openNewAppointmentForm(quickActionSlot)}
                  font={fontSemiBold}
                />
                <ActionRow
                  label="Ver Lista de Espera"
                  onPress={() => {
                    setQuickActionSlot(null);
                    router.push('/scheduling/lista-de-espera');
                  }}
                  font={fontSemiBold}
                />
                <ActionRow label="Bloquear Horário" onPress={handleBlockSlot} font={fontSemiBold} danger />
              </>
            ) : (
              <>
                <ActionRow label="Abrir Comanda" onPress={() => setQuickActionSlot(null)} font={fontSemiBold} />
                <ActionRow
                  label="Reagendar"
                  onPress={() => {
                    setQuickActionSlot(null);
                    router.push('/booking');
                  }}
                  font={fontSemiBold}
                />
                <ActionRow
                  label="Ver Lista de Espera"
                  onPress={() => {
                    setQuickActionSlot(null);
                    router.push('/scheduling/lista-de-espera');
                  }}
                  font={fontSemiBold}
                />
                <ActionRow
                  label="Cancelar Agendamento"
                  onPress={handleCancelAppointment}
                  font={fontSemiBold}
                  danger
                />
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* New Appointment Modal */}
      <Modal visible={!!newAppointmentSlot} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setNewAppointmentSlot(null)}>
              <XIcon size={20} color={Colors.grey500} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { fontFamily: fontBold }]}>
              Novo Agendamento — {newAppointmentSlot?.time}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Nome do cliente"
              placeholderTextColor={Colors.grey400}
              value={clientName}
              onChangeText={setClientName}
            />
            <TextInput
              style={styles.input}
              placeholder="Serviço"
              placeholderTextColor={Colors.grey400}
              value={serviceName}
              onChangeText={setServiceName}
            />

            <TouchableOpacity
              style={styles.encaixeToggle}
              onPress={() => setIsEncaixe((v) => !v)}>
              <View style={[styles.checkbox, isEncaixe && styles.checkboxChecked]} />
              <Text style={[styles.encaixeLabel, { fontFamily: fontRegular }]}>
                Agendar como Encaixe
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.goldBtn, !clientName || !serviceName ? { opacity: 0.5 } : null]}
              disabled={!clientName || !serviceName}
              onPress={handleCreateAppointment}>
              <Text style={[styles.goldBtnText, { fontFamily: fontSemiBold }]}>Agendar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success Modal (block / cancel) */}
      <Modal visible={!!successModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.successCard}>
            <CheckCircleIcon size={72} color={Colors.success} />
            <Text style={[styles.successTitle, { fontFamily: fontBold }]}>
              {successModal === 'block' ? 'Bloqueio de Horário Efetuado' : 'Cancelamento efetuado'}
            </Text>
            <TouchableOpacity style={styles.goldBtn} onPress={() => setSuccessModal(null)}>
              <Text style={[styles.goldBtnText, { fontFamily: fontSemiBold }]}>Obrigado</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ActionRow({
  label,
  onPress,
  font,
  danger,
}: {
  label: string;
  onPress: () => void;
  font?: string;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.actionRow} onPress={onPress}>
      <Text style={[styles.actionRowText, { fontFamily: font, color: danger ? Colors.error : Colors.dark }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, color: Colors.dark },
  viewSelector: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  viewTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  viewTabActive: { backgroundColor: Colors.gold },
  viewTabText: { fontSize: 12, color: Colors.grey500 },
  viewTabTextActive: { color: Colors.white },
  dateStrip: { paddingHorizontal: 20, gap: 10, paddingBottom: 12 },
  dateChip: {
    width: 48,
    height: 60,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dateChipActive: { backgroundColor: Colors.gold },
  dateChipWeekday: { fontSize: 11, color: Colors.grey400 },
  dateChipDay: { fontSize: 16, color: Colors.dark },
  dateChipTextActive: { color: Colors.white },
  legend: { flexDirection: 'row', gap: 16, paddingHorizontal: 20, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: Colors.grey500 },
  placeholder: { alignItems: 'center', paddingTop: 60 },
  placeholderText: { color: Colors.grey400, fontSize: 14 },
  list: { paddingHorizontal: 20, gap: 10 },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  slotTime: { width: 48, color: Colors.dark, fontSize: 13 },
  slotFreeText: { color: Colors.grey400, fontSize: 13 },
  slotClientInfo: { flex: 1, gap: 2 },
  slotClientName: { color: Colors.dark, fontSize: 14 },
  slotService: { color: Colors.grey500, fontSize: 12 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: Colors.white, borderRadius: 20, padding: 24, width: '100%', gap: 8 },
  modalClose: { alignSelf: 'flex-end', padding: 4 },
  modalTitle: { color: Colors.dark, fontSize: 17, marginBottom: 8 },
  actionRow: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.grey100 },
  actionRowText: { fontSize: 15 },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.grey200,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 14,
    color: Colors.dark,
    marginTop: 8,
  },
  encaixeToggle: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, marginBottom: 4 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: Colors.grey200 },
  checkboxChecked: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  encaixeLabel: { fontSize: 13, color: Colors.grey500 },
  goldBtn: { height: 50, borderRadius: 12, backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  goldBtnText: { color: Colors.white, fontSize: 15 },
  successCard: { backgroundColor: Colors.white, borderRadius: 20, padding: 32, width: '100%', alignItems: 'center', gap: 20 },
  successTitle: { color: Colors.dark, fontSize: 19, textAlign: 'center' },
});