import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronLeftIcon, ArrowRightIcon, ClockIcon, UsersIcon } from '@/components/icons';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';
import { type Appointment, type AppointmentStatus } from '@/services/appointmentServices';

interface ProfessionalTimelineProps {
  selectedDate: string;
  professionalName?: string;
  appointments: Appointment[];
  isLoading?: boolean;
  onDateChange: (delta: number) => void;
  onSelectAppointment?: (appointment: Appointment) => void;
}

export function ProfessionalTimeline({
  selectedDate,
  professionalName,
  appointments,
  isLoading = false,
  onDateChange,
  onSelectAppointment,
}: ProfessionalTimelineProps) {
  const { fontSemiBold, fontRegular, fontBold } = useAppFonts();

  function formatDisplayDate(dateStr: string) {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
      });
    } catch {
      return dateStr;
    }
  }

  function getStatusBadge(status: AppointmentStatus, isFitIn?: boolean) {
    if (isFitIn) {
      return { label: 'Encaixe', bg: '#FDF2E9', color: '#D97706', border: '#FCD34D' };
    }
    switch (status) {
      case 'SCHEDULED':
        return { label: 'Confirmado', bg: '#E8F8EE', color: '#1B873F', border: '#C2ECCF' };
      case 'COMPLETED':
        return { label: 'Concluído', bg: '#EDF4FC', color: '#1E64B4', border: '#BFDBFE' };
      case 'CANCELLED':
        return { label: 'Cancelado', bg: '#FEECEC', color: '#DC2626', border: '#FECACA' };
      case 'NO_SHOW':
        return { label: 'Não compareceu', bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' };
      default:
        return { label: status, bg: '#F7F8FA', color: '#9CA3AF', border: '#E5E7EB' };
    }
  }

  function formatTime(iso: string) {
    if (!iso) return '--:--';
    const d = new Date(iso);
    if (isNaN(d.getTime())) {
      return iso.includes('T') ? iso.slice(11, 16) : iso.slice(0, 5);
    }
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <View style={styles.container}>
      {/* Date Header & Navigator */}
      <View style={styles.dateBar}>
        <View style={styles.agendaTitleCol}>
          <Text style={[styles.agendaTitle, { fontFamily: fontSemiBold }]}>
            Agenda {professionalName ? `— ${professionalName}` : 'Geral'}
          </Text>
          <Text style={[styles.dateSubtitle, { fontFamily: fontRegular }]}>
            {formatDisplayDate(selectedDate)}
          </Text>
        </View>

        <View style={styles.dateNav}>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => onDateChange(-1)}
            activeOpacity={0.7}>
            <ChevronLeftIcon size={16} color={Colors.dark} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => onDateChange(1)}
            activeOpacity={0.7}>
            <ArrowRightIcon size={16} color={Colors.dark} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading State */}
      {isLoading && (
        <View style={styles.feedbackBox}>
          <ActivityIndicator size="small" color={Colors.gold} />
          <Text style={[styles.feedbackText, { fontFamily: fontRegular }]}>
            Carregando agendamentos…
          </Text>
        </View>
      )}

      {/* Empty State */}
      {!isLoading && appointments.length === 0 && (
        <View style={styles.feedbackBox}>
          <Text style={{ fontSize: 32 }}>📅</Text>
          <Text style={[styles.emptyTitle, { fontFamily: fontSemiBold }]}>
            Nenhum agendamento para este dia
          </Text>
          <Text style={[styles.feedbackText, { fontFamily: fontRegular }]}>
            Os agendamentos confirmados aparecerão aqui em tempo real.
          </Text>
        </View>
      )}

      {/* Appointments List */}
      {!isLoading && appointments.length > 0 && (
        <View style={styles.slotsList}>
          {appointments.map((appt) => {
            const badge = getStatusBadge(appt.status, appt.isFitIn);
            const isCancelled = appt.status === 'CANCELLED';

            return (
              <TouchableOpacity
                key={appt.id}
                style={[
                  styles.slotCard,
                  isCancelled && styles.slotCancelled,
                ]}
                activeOpacity={0.75}
                onPress={() => onSelectAppointment?.(appt)}>
                {/* Time Column */}
                <View style={styles.timeCol}>
                  <ClockIcon size={14} color={isCancelled ? Colors.grey400 : Colors.dark} />
                  <Text
                    style={[
                      styles.timeText,
                      { fontFamily: fontSemiBold },
                      isCancelled && { color: Colors.grey400 },
                    ]}>
                    {formatTime(appt.startDateTime)}
                  </Text>
                </View>

                {/* Center Content */}
                <View style={styles.slotMain}>
                  <View style={styles.serviceRow}>
                    <Text style={[styles.serviceName, { fontFamily: fontSemiBold }]} numberOfLines={1}>
                      {appt.serviceName || 'Serviço'}
                    </Text>
                    {appt.servicePrice != null && (
                      <Text style={[styles.priceText, { fontFamily: fontBold }]}>
                        R$ {appt.servicePrice.toFixed(2)}
                      </Text>
                    )}
                  </View>

                  <Text style={[styles.clientName, { fontFamily: fontRegular }]} numberOfLines={1}>
                    Cliente: <Text style={{ fontFamily: fontSemiBold, color: Colors.dark }}>{appt.clientName || 'Cliente'}</Text>
                  </Text>

                  {/* Profissional vinculado */}
                  <View style={styles.profRow}>
                    <UsersIcon size={12} color={Colors.goldDark} />
                    <Text style={[styles.profName, { fontFamily: fontSemiBold }]} numberOfLines={1}>
                      {appt.professionalName || 'Profissional'}
                    </Text>
                  </View>
                </View>

                {/* Status Badge */}
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: badge.bg, borderColor: badge.border },
                  ]}>
                  <Text
                    style={[
                      styles.badgeText,
                      { fontFamily: fontSemiBold, color: badge.color },
                    ]}>
                    {badge.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    gap: 16,
  },
  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  agendaTitleCol: {
    gap: 2,
    flex: 1,
  },
  agendaTitle: {
    fontSize: 16,
    color: Colors.dark,
  },
  dateSubtitle: {
    fontSize: 13,
    color: Colors.grey400,
    textTransform: 'capitalize',
  },
  dateNav: {
    flexDirection: 'row',
    gap: 8,
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.grey100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  feedbackBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.grey100,
  },
  emptyTitle: {
    color: Colors.dark,
    fontSize: 15,
    textAlign: 'center',
  },
  feedbackText: {
    color: Colors.grey400,
    fontSize: 13,
    textAlign: 'center',
  },
  slotsList: {
    gap: 10,
  },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.grey100,
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    gap: 12,
  },
  slotCancelled: {
    backgroundColor: '#FAF9F9',
    opacity: 0.7,
  },
  timeCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 62,
  },
  timeText: {
    fontSize: 14,
    color: Colors.dark,
  },
  slotMain: {
    flex: 1,
    gap: 3,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  serviceName: {
    fontSize: 14,
    color: Colors.dark,
    flex: 1,
  },
  priceText: {
    fontSize: 13,
    color: Colors.goldDark,
  },
  clientName: {
    fontSize: 12,
    color: Colors.grey500,
  },
  profRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  profName: {
    fontSize: 12,
    color: Colors.goldDark,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
  },
});
