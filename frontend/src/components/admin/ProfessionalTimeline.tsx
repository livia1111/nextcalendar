import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronLeftIcon, ArrowRightIcon, ClockIcon } from '@/components/icons';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';
import { AgendaSlot, SlotStatus } from '@/services/agendaServices';

interface ProfessionalTimelineProps {
  selectedDate: string;
  professionalName?: string;
  slots: AgendaSlot[];
  onDateChange: (delta: number) => void;
  onSelectSlot: (slot: AgendaSlot) => void;
}

export function ProfessionalTimeline({
  selectedDate,
  professionalName,
  slots,
  onDateChange,
  onSelectSlot,
}: ProfessionalTimelineProps) {
  const { fontSemiBold, fontRegular } = useAppFonts();

  function formatDisplayDate(dateStr: string) {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
      });
    } catch {
      return dateStr;
    }
  }

  function getStatusBadge(status: SlotStatus) {
    switch (status) {
      case 'confirmed':
        return { label: 'Confirmado', bg: '#E8F8EE', color: '#1B873F', border: '#C2ECCF' };
      case 'encaixe':
        return { label: 'Encaixe', bg: '#FDF2E9', color: '#D97706', border: '#FCD34D' };
      case 'blocked':
        return { label: 'Bloqueado', bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' };
      case 'free':
      default:
        return { label: 'Disponível', bg: '#F7F8FA', color: '#9CA3AF', border: '#E5E7EB' };
    }
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

      {/* Slots List */}
      <View style={styles.slotsList}>
        {slots.map((slot) => {
          const badge = getStatusBadge(slot.status);
          const isFree = slot.status === 'free';
          const isBlocked = slot.status === 'blocked';

          return (
            <TouchableOpacity
              key={slot.id}
              style={[
                styles.slotCard,
                isFree && styles.slotFree,
                isBlocked && styles.slotBlocked,
              ]}
              activeOpacity={0.75}
              onPress={() => onSelectSlot(slot)}>
              {/* Time Column */}
              <View style={styles.timeCol}>
                <ClockIcon size={14} color={isFree ? Colors.grey400 : Colors.dark} />
                <Text
                  style={[
                    styles.timeText,
                    { fontFamily: fontSemiBold },
                    isFree && { color: Colors.grey400 },
                  ]}>
                  {slot.time}
                </Text>
              </View>

              {/* Center Content */}
              <View style={styles.slotMain}>
                {isFree ? (
                  <Text style={[styles.freeText, { fontFamily: fontRegular }]}>
                    + Horário livre para agendamento
                  </Text>
                ) : isBlocked ? (
                  <Text style={[styles.blockedText, { fontFamily: fontRegular }]}>
                    Intervalo / Horário indisponível
                  </Text>
                ) : (
                  <View style={styles.clientInfo}>
                    <Text style={[styles.clientName, { fontFamily: fontSemiBold }]} numberOfLines={1}>
                      {slot.clientName || 'Cliente'}
                    </Text>
                    <Text style={[styles.serviceName, { fontFamily: fontRegular }]} numberOfLines={1}>
                      {slot.service || 'Serviço'}
                    </Text>
                  </View>
                )}
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
  slotFree: {
    borderStyle: 'dashed',
    backgroundColor: '#FAFAFC',
  },
  slotBlocked: {
    backgroundColor: '#F7F8FA',
    opacity: 0.8,
  },
  timeCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 70,
  },
  timeText: {
    fontSize: 14,
    color: Colors.dark,
  },
  slotMain: {
    flex: 1,
  },
  clientInfo: {
    gap: 2,
  },
  clientName: {
    fontSize: 14,
    color: Colors.dark,
  },
  serviceName: {
    fontSize: 12,
    color: Colors.grey400,
  },
  freeText: {
    fontSize: 13,
    color: Colors.grey400,
  },
  blockedText: {
    fontSize: 13,
    color: Colors.grey500,
    fontStyle: 'italic',
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
