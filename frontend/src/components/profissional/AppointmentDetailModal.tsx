import React, { useState } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';
import { type Appointment, cancelAppointment } from '@/services/appointmentServices';
import { ClockIcon } from '@/components/icons';
import { isAxiosError } from 'axios';
import { useRouter } from 'expo-router';

interface AppointmentDetailModalProps {
  visible: boolean;
  appointment: Appointment | null;
  establishmentId: string;
  onClose: () => void;
  onAppointmentUpdated: () => void;
  onOpenReschedule: (appointment: Appointment) => void;
}

export function AppointmentDetailModal({
  visible,
  appointment,
  establishmentId,
  onClose,
  onAppointmentUpdated,
  onOpenReschedule,
}: AppointmentDetailModalProps) {
  const { fontRegular, fontSemiBold, fontBold } = useAppFonts();
    const router = useRouter();
  const [cancelling, setCancelling] = useState(false);

  if (!appointment) return null;

  function formatTime(iso: string) {
    if (!iso) return '--:--';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso.slice(11, 16);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function formatDate(iso: string) {
    if (!iso) return '--/--/----';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso.slice(0, 10);
    return d.toLocaleDateString('pt-BR');
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'SCHEDULED':
        return { label: 'Confirmado', color: '#1B873F', bg: '#E8F8EE' };
      case 'DONE':
        return { label: 'Concluído', color: '#1E64B4', bg: '#EDF4FC' };
      case 'CANCELLED':
        return { label: 'Cancelado', color: '#DC2626', bg: '#FEECEC' };
      case 'NO_SHOW':
        return { label: 'Não compareceu', color: '#6B7280', bg: '#F3F4F6' };
      default:
        return { label: status, color: '#4B5563', bg: '#F3F4F6' };
    }
  }

  const statusInfo = getStatusLabel(appointment.status);
  const canModify = appointment.status === 'SCHEDULED';

   const canOpenOrder = appointment.status !== 'CANCELLED' && appointment.status !== 'NO_SHOW';

  function handleOpenOrder() {
    onClose();
    router.push({
      pathname: '/(profissional)/comanda',
      params: { appointmentId: appointment!.id, establishmentId },
    } as any);
  }

  function handleOpenAtendimento() {
    onClose();
    router.push({
      pathname: '/(profissional)/atendimento',
      params: { appointmentId: appointment!.id, establishmentId },
    } as any);
  }

  function handleCancelConfirm() {
    Alert.alert(
      'Cancelar Agendamento',
      `Deseja realmente cancelar o agendamento de ${appointment?.clientName}?\n\nLembre-se: cancelamentos exigem antecedência mínima de 2 horas.`,
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Confirmar Cancelamento',
          style: 'destructive',
          onPress: executeCancel,
        },
      ]
    );
  }

  async function executeCancel() {
    setCancelling(true);
    try {
      await cancelAppointment(establishmentId, appointment!.id);
      Alert.alert('Sucesso', 'Agendamento cancelado com sucesso.');
      onAppointmentUpdated();
      onClose();
    } catch (err: any) {
      let msg = 'Não foi possível cancelar o agendamento.';
      if (isAxiosError(err)) {
        msg = err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response?.data : msg);
      }
      Alert.alert('Atenção', msg);
    } finally {
      setCancelling(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { fontFamily: fontSemiBold }]}>
              Detalhes do Agendamento
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={styles.body}>
            {/* Serviço e Valor */}
            <View style={styles.rowBetween}>
              <Text style={[styles.serviceName, { fontFamily: fontBold }]}>
                {appointment.serviceName}
              </Text>
              {appointment.servicePrice != null && (
                <Text style={[styles.priceText, { fontFamily: fontBold }]}>
                  R$ {appointment.servicePrice.toFixed(2)}
                </Text>
              )}
            </View>

            {/* Badges de Status e Encaixe */}
            <View style={styles.badgesRow}>
              <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                <Text style={[styles.statusText, { color: statusInfo.color, fontFamily: fontSemiBold }]}>
                  {statusInfo.label}
                </Text>
              </View>
              {appointment.isFitIn && (
                <View style={styles.fitInBadge}>
                  <Text style={[styles.fitInText, { fontFamily: fontSemiBold }]}>⚡ Encaixe</Text>
                </View>
              )}
            </View>

            {/* Data e Horário */}
            <View style={styles.infoRow}>
              <ClockIcon size={16} color={Colors.grey500} />
              <Text style={[styles.infoText, { fontFamily: fontRegular }]}>
                {formatDate(appointment.startDateTime)} • {formatTime(appointment.startDateTime)} às {formatTime(appointment.endDateTime)}
              </Text>
            </View>

            {/* Cliente */}
            <View style={styles.fieldBox}>
              <Text style={[styles.fieldLabel, { fontFamily: fontSemiBold }]}>Cliente</Text>
              <Text style={[styles.fieldValue, { fontFamily: fontRegular }]}>
                {appointment.clientName || 'Cliente avulso'}
              </Text>
            </View>

            {/* Observações */}
            {appointment.notes ? (
              <View style={styles.fieldBox}>
                <Text style={[styles.fieldLabel, { fontFamily: fontSemiBold }]}>Observações</Text>
                <Text style={[styles.fieldValue, { fontFamily: fontRegular }]}>
                  {appointment.notes}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Footer Actions */}
          <View style={styles.footer}>
              {canOpenOrder ? (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.rescheduleBtn]}
                  activeOpacity={0.8}
                  onPress={handleOpenOrder}>
                  <Text style={[styles.rescheduleText, { fontFamily: fontSemiBold }]}>
                    {appointment.status === 'DONE' ? 'Ver Comanda' : 'Iniciar Atendimento'}
                  </Text>
                </TouchableOpacity>
              ) : null}

              {appointment.status === 'DONE' ? (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.rescheduleBtn]}
                  activeOpacity={0.8}
                  onPress={handleOpenAtendimento}>
                  <Text style={[styles.rescheduleText, { fontFamily: fontSemiBold }]}>
                    Ficha & Fotos
                  </Text>
                </TouchableOpacity>
              ) : null}


            {canModify ? (
              <>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.rescheduleBtn]}
                  activeOpacity={0.8}
                  onPress={() => {
                    onClose();
                    onOpenReschedule(appointment);
                  }}>
                  <Text style={[styles.rescheduleText, { fontFamily: fontSemiBold }]}>
                    Remarcar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.cancelBtn]}
                  activeOpacity={0.8}
                  disabled={cancelling}
                  onPress={handleCancelConfirm}>
                  {cancelling ? (
                    <ActivityIndicator size="small" color="#DC2626" />
                  ) : (
                    <Text style={[styles.cancelText, { fontFamily: fontSemiBold }]}>
                      Cancelar
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            ) : null}

            <TouchableOpacity
              style={[styles.actionBtn, styles.closeBtn]}
              activeOpacity={0.8}
              onPress={onClose}>
              <Text style={[styles.closeBtnText, { fontFamily: fontSemiBold }]}>
                Fechar
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
    maxWidth: 400,
    overflow: 'hidden',
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
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
  body: {
    padding: 20,
    gap: 14,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceName: {
    fontSize: 18,
    color: Colors.dark,
    flex: 1,
    marginRight: 8,
  },
  priceText: {
    fontSize: 18,
    color: Colors.goldDark,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
  },
  fitInBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  fitInText: {
    fontSize: 12,
    color: '#D97706',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    padding: 10,
    borderRadius: 10,
  },
  infoText: {
    fontSize: 13,
    color: Colors.grey700,
  },
  fieldBox: {
    gap: 3,
  },
  fieldLabel: {
    fontSize: 12,
    color: Colors.grey400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 15,
    color: Colors.dark,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 18,
    paddingTop: 6,
    gap: 10,
  },
  actionBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rescheduleBtn: {
    backgroundColor: Colors.gold,
  },
  rescheduleText: {
    color: Colors.white,
    fontSize: 14,
  },
  cancelBtn: {
    backgroundColor: '#FEE2E2',
  },
  cancelText: {
    color: '#DC2626',
    fontSize: 14,
  },
  closeBtn: {
    backgroundColor: Colors.surface,
  },
  closeBtnText: {
    color: Colors.grey700,
    fontSize: 14,
  },
});
