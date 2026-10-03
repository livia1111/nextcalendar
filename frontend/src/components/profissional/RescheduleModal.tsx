import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';
import { ChevronLeftIcon, ClockIcon } from '@/components/icons';
import {
  type Appointment,
  rescheduleAppointment,
  getAvailableSlots,
} from '@/services/appointmentServices';
import { isAxiosError } from 'axios';

interface RescheduleModalProps {
  visible: boolean;
  appointment: Appointment | null;
  establishmentId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function RescheduleModal({
  visible,
  appointment,
  establishmentId,
  onClose,
  onSuccess,
}: RescheduleModalProps) {
  const { fontRegular, fontSemiBold, fontBold } = useAppFonts();

  // Data selecionada (padrão: hoje ou a data do agendamento)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Inicializa com a data do agendamento ao abrir
  useEffect(() => {
    if (appointment?.startDateTime) {
      const d = appointment.startDateTime.slice(0, 10);
      setSelectedDate(d);
    }
    setSelectedSlot(null);
    setErrorMsg(null);
  }, [appointment, visible]);

  // Carrega horários disponíveis quando a data ou agendamento muda
  useEffect(() => {
    if (!visible || !appointment || !establishmentId) return;

    let active = true;
    async function fetchSlots() {
      setLoadingSlots(true);
      setErrorMsg(null);
      setSelectedSlot(null);
      try {
        const res = await getAvailableSlots(
          establishmentId,
          appointment!.professionalId,
          appointment!.serviceId,
          selectedDate
        );
        if (active) {
          setAvailableSlots(res.slots || []);
        }
      } catch (err: any) {
        if (active) {
          setAvailableSlots([]);
          if (isAxiosError(err)) {
            const msg = err.response?.data?.message || err.response?.data;
            setErrorMsg(typeof msg === 'string' ? msg : 'Profissional não atende nesta data.');
          } else {
            setErrorMsg('Não foi possível carregar os horários.');
          }
        }
      } finally {
        if (active) setLoadingSlots(false);
      }
    }

    fetchSlots();
    return () => {
      active = false;
    };
  }, [visible, appointment, establishmentId, selectedDate]);

  function handleDateChange(deltaDays: number) {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + deltaDays);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
  }

  function formatDisplayDate(dateStr: string) {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  async function handleConfirm() {
    if (!appointment || !selectedSlot) return;

    setSubmitting(true);
    setErrorMsg(null);

    // Formata o novo início em ISO: "YYYY-MM-DDTHH:mm:00"
    const timePart = selectedSlot.length === 5 ? `${selectedSlot}:00` : selectedSlot;
    const newStartDateTime = `${selectedDate}T${timePart}`;

    try {
      await rescheduleAppointment(establishmentId, appointment.id, {
        newStartDateTime,
      });
      Alert.alert('Sucesso', 'Agendamento remarcado com sucesso!');
      onSuccess();
      onClose();
    } catch (err: any) {
      let msg = 'Não foi possível remarcar.';
      if (isAxiosError(err)) {
        msg = err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response?.data : msg);
      }
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (!appointment) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { fontFamily: fontSemiBold }]}>
              Remarcar Agendamento
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Info do agendamento */}
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryTitle, { fontFamily: fontSemiBold }]}>
                {appointment.serviceName}
              </Text>
              <Text style={[styles.summaryClient, { fontFamily: fontRegular }]}>
                Cliente: {appointment.clientName}
              </Text>
            </View>

            {/* Navegador de Data */}
            <Text style={[styles.sectionLabel, { fontFamily: fontSemiBold }]}>
              Escolha a nova data
            </Text>
            <View style={styles.dateSelector}>
              <TouchableOpacity
                style={styles.navBtn}
                onPress={() => handleDateChange(-1)}>
                <ChevronLeftIcon size={18} color={Colors.dark} />
              </TouchableOpacity>

              <Text style={[styles.dateText, { fontFamily: fontSemiBold }]}>
                {formatDisplayDate(selectedDate)}
              </Text>

              <TouchableOpacity
                style={[styles.navBtn, { transform: [{ rotate: '180deg' }] }]}
                onPress={() => handleDateChange(1)}>
                <ChevronLeftIcon size={18} color={Colors.dark} />
              </TouchableOpacity>
            </View>

            {/* Horários Livres */}
            <Text style={[styles.sectionLabel, { fontFamily: fontSemiBold }]}>
              Horários disponíveis
            </Text>

            {loadingSlots ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color={Colors.gold} />
                <Text style={[styles.hintText, { fontFamily: fontRegular }]}>
                  Buscando horários disponíveis...
                </Text>
              </View>
            ) : availableSlots.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={[styles.hintText, { fontFamily: fontRegular }]}>
                  {errorMsg || 'Nenhum horário livre para esta data.'}
                </Text>
              </View>
            ) : (
              <View style={styles.slotsGrid}>
                {availableSlots.map((slot) => {
                  const isSelected = selectedSlot === slot;
                  return (
                    <TouchableOpacity
                      key={slot}
                      style={[styles.slotChip, isSelected && styles.slotChipSelected]}
                      activeOpacity={0.8}
                      onPress={() => setSelectedSlot(slot)}>
                      <ClockIcon
                        size={12}
                        color={isSelected ? Colors.white : Colors.dark}
                      />
                      <Text
                        style={[
                          styles.slotText,
                          { fontFamily: isSelected ? fontBold : fontRegular },
                          isSelected && styles.slotTextSelected,
                        ]}>
                        {slot.slice(0, 5)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Mensagem de Erro da submissão */}
            {errorMsg && !loadingSlots && availableSlots.length > 0 ? (
              <View style={styles.errorBox}>
                <Text style={[styles.errorText, { fontFamily: fontRegular }]}>
                  {errorMsg}
                </Text>
              </View>
            ) : null}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.confirmBtn, (!selectedSlot || submitting) && styles.btnDisabled]}
              activeOpacity={0.8}
              disabled={!selectedSlot || submitting}
              onPress={handleConfirm}>
              {submitting ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={[styles.confirmBtnText, { fontFamily: fontSemiBold }]}>
                  Confirmar Remarcação
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              activeOpacity={0.8}
              onPress={onClose}>
              <Text style={[styles.cancelBtnText, { fontFamily: fontSemiBold }]}>
                Voltar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    width: '100%',
    maxHeight: '85%',
    maxWidth: 420,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grey100,
  },
  title: {
    fontSize: 17,
    color: Colors.dark,
  },
  closeIcon: {
    fontSize: 18,
    color: Colors.grey400,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 20,
    gap: 14,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.grey100,
    gap: 4,
  },
  summaryTitle: {
    fontSize: 15,
    color: Colors.dark,
  },
  summaryClient: {
    fontSize: 13,
    color: Colors.grey500,
  },
  sectionLabel: {
    fontSize: 13,
    color: Colors.grey500,
    marginTop: 4,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.grey200,
  },
  navBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 14,
    color: Colors.dark,
  },
  loadingBox: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  emptyBox: {
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 13,
    color: Colors.grey400,
    textAlign: 'center',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.grey200,
    backgroundColor: Colors.white,
  },
  slotChipSelected: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  slotText: {
    fontSize: 13,
    color: Colors.dark,
  },
  slotTextSelected: {
    color: Colors.white,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
  },
  footer: {
    padding: 20,
    paddingTop: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.grey100,
  },
  confirmBtn: {
    backgroundColor: Colors.gold,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: Colors.white,
    fontSize: 15,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  cancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: Colors.grey500,
    fontSize: 14,
  },
});
