import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { isAxiosError } from 'axios';

import { ChevronLeftIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';
import { useMyProfessionalProfile } from '@/hooks/useMyProfessionalProfile';
import { createBlockedTime } from '@/services/blockedTimesServices';
import { listWorkingHours, type WorkingHours } from '@/services/workingHoursServices';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const WEEK_DAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
const DAY_MAP_EN = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

function buildCalendar(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

function toDateString(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

/**
 * Gera slots de 30 em 30 min dentro do intervalo startTime e endTime.
 */
function generateSlotsForRange(startTimeStr: string, endTimeStr: string): string[] {
  const [startH, startM] = startTimeStr.slice(0, 5).split(':').map(Number);
  const [endH, endM] = endTimeStr.slice(0, 5).split(':').map(Number);

  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;

  const slots: string[] = [];
  for (let m = startTotal; m <= endTotal; m += 30) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  }
  return slots;
}

export default function ProfissionalNovoBloqueioScreen() {
  const { fontRegular, fontSemiBold } = useAppFonts();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { establishmentId, professionalId, professional } = useMyProfessionalProfile();

  // Working hours
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([]);
  const [loadingWh, setLoadingWh] = useState(true);

  // Calendário
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Horários
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);

  // Motivo
  const [reason, setReason] = useState('');

  // Submissão
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!establishmentId || !professionalId) return;

    async function load() {
      setLoadingWh(true);
      try {
        const whList = await listWorkingHours(establishmentId!, professionalId!);
        setWorkingHours(whList);
      } catch {
        // Silencia
      } finally {
        setLoadingWh(false);
      }
    }
    load();
  }, [establishmentId, professionalId]);

  const calendar = buildCalendar(year, month);

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
    setSelectedDay(null);
    setStartTime(null);
    setEndTime(null);
    setErrorMsg(null);
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
    setSelectedDay(null);
    setStartTime(null);
    setEndTime(null);
    setErrorMsg(null);
  }

  // Verifica se o profissional trabalha no dia selecionado
  const selectedDateObj = selectedDay ? new Date(year, month, selectedDay) : null;
  const selectedDayOfWeekEn = selectedDateObj ? DAY_MAP_EN[selectedDateObj.getDay()] : null;
  const currentWorkingHour = selectedDayOfWeekEn
    ? workingHours.find((w) => w.dayOfWeek === selectedDayOfWeekEn && w.active)
    : null;

  // Gera slots baseado no horário de trabalho cadastrado
  const availableTimeSlots = currentWorkingHour
    ? generateSlotsForRange(currentWorkingHour.startTime, currentWorkingHour.endTime)
    : [];

  // Slots válidos de término (posteriores ao início)
  const validEndSlots = startTime
    ? availableTimeSlots.filter((t) => t > startTime)
    : [];

  const canConfirm =
    !!establishmentId &&
    !!professionalId &&
    !!selectedDay &&
    !!currentWorkingHour &&
    !!startTime &&
    !!endTime;

  async function handleConfirm() {
    if (!canConfirm) return;
    setLoading(true);
    setErrorMsg(null);

    const dateStr = toDateString(year, month, selectedDay!);
    const startDateTime = `${dateStr}T${startTime}:00`;
    const endDateTime = `${dateStr}T${endTime}:00`;

    try {
      await createBlockedTime(establishmentId!, professionalId!, {
        startDateTime,
        endDateTime,
        reason: reason.trim() || undefined,
      });
      router.back();
    } catch (err: any) {
      if (isAxiosError(err)) {
        const msg = err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response?.data : null);
        if (msg) {
          setErrorMsg(msg);
        } else if (err.response?.status === 400) {
          setErrorMsg('Já existe um agendamento ou bloqueio neste horário.');
        } else {
          setErrorMsg('Não foi possível registrar o bloqueio. Tente novamente.');
        }
      } else {
        setErrorMsg('Erro inesperado ao registrar bloqueio.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeftIcon size={22} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={[styles.title, { fontFamily: fontSemiBold }]}>
          Novo Bloqueio de Horário
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}>

        {/* Info do profissional */}
        <View style={styles.profBadge}>
          <Text style={[styles.profBadgeText, { fontFamily: fontRegular }]}>
            Profissional:{' '}
            <Text style={{ fontFamily: fontSemiBold }}>
              {professional?.name || 'Profissional'}
            </Text>
          </Text>
        </View>

        {/* Calendário */}
        <View style={styles.section}>
          <Text style={[styles.label, { fontFamily: fontSemiBold }]}>Escolha o Dia</Text>
          <View style={styles.calendarCard}>
            {/* Navegação Mês */}
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={prevMonth} style={styles.monthNavBtn}>
                <ChevronLeftIcon size={18} color={Colors.dark} />
              </TouchableOpacity>
              <Text style={[styles.monthLabel, { fontFamily: fontSemiBold }]}>
                {MONTHS[month]} {year}
              </Text>
              <TouchableOpacity
                onPress={nextMonth}
                style={[styles.monthNavBtn, { transform: [{ rotate: '180deg' }] }]}>
                <ChevronLeftIcon size={18} color={Colors.dark} />
              </TouchableOpacity>
            </View>

            {/* Dias da semana */}
            <View style={styles.weekRow}>
              {WEEK_DAYS.map((d) => (
                <Text key={d} style={[styles.weekDay, { fontFamily: fontSemiBold }]}>
                  {d}
                </Text>
              ))}
            </View>

            {/* Grade de dias */}
            <View style={styles.daysGrid}>
              {calendar.map((day, idx) => {
                if (!day) {
                  return <View key={idx} style={[styles.dayCell, styles.dayCellEmpty]} />;
                }

                const cellDate = new Date(year, month, day);
                const cellDayEn = DAY_MAP_EN[cellDate.getDay()];
                const hasWork = workingHours.some((w) => w.dayOfWeek === cellDayEn && w.active);
                const isSelected = day === selectedDay;

                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.dayCell,
                      isSelected && styles.dayCellSelected,
                      !hasWork && styles.dayCellDisabled,
                    ]}
                    onPress={() => {
                      if (!hasWork) {
                        setErrorMsg(`Você não possui expediente cadastrado para ${WEEK_DAYS[cellDate.getDay()]}. Bloqueios só podem ser feitos em dias trabalhados.`);
                        setSelectedDay(null);
                        setStartTime(null);
                        setEndTime(null);
                        return;
                      }
                      setSelectedDay(day);
                      setStartTime(null);
                      setEndTime(null);
                      setErrorMsg(null);
                    }}>
                    <Text
                      style={[
                        styles.dayText,
                        { fontFamily: fontRegular },
                        isSelected && styles.dayTextSelected,
                        !hasWork && styles.dayTextDisabled,
                      ]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Aviso de Expediente do Dia */}
        {selectedDay && currentWorkingHour && (
          <View style={styles.scheduleInfoBox}>
            <Text style={[styles.scheduleInfoText, { fontFamily: fontRegular }]}>
              ⏰ Expediente cadastrado neste dia:{' '}
              <Text style={{ fontFamily: fontSemiBold }}>
                {currentWorkingHour.startTime.slice(0, 5)} às {currentWorkingHour.endTime.slice(0, 5)}
              </Text>
            </Text>
          </View>
        )}

        {/* Hora de Início */}
        {selectedDay && currentWorkingHour && (
          <>
            <View style={styles.section}>
              <Text style={[styles.label, { fontFamily: fontSemiBold }]}>Hora de Início</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {availableTimeSlots.slice(0, -1).map((slot) => {
                  const isSelected = startTime === slot;
                  return (
                    <TouchableOpacity
                      key={`start-${slot}`}
                      style={[styles.chip, isSelected && styles.chipSelected]}
                      onPress={() => {
                        setStartTime(slot);
                        if (endTime && endTime <= slot) setEndTime(null);
                        setErrorMsg(null);
                      }}>
                      <Text
                        style={[
                          styles.chipText,
                          { fontFamily: fontRegular },
                          isSelected && styles.chipTextSelected,
                        ]}>
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Hora de Término */}
            <View style={styles.section}>
              <Text style={[styles.label, { fontFamily: fontSemiBold }]}>Hora de Término</Text>
              {!startTime ? (
                <Text style={[styles.emptyHint, { fontFamily: fontRegular }]}>
                  Selecione a hora de início primeiro.
                </Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {validEndSlots.map((slot) => {
                    const isSelected = endTime === slot;
                    return (
                      <TouchableOpacity
                        key={`end-${slot}`}
                        style={[styles.chip, isSelected && styles.chipSelected]}
                        onPress={() => {
                          setEndTime(slot);
                          setErrorMsg(null);
                        }}>
                        <Text
                          style={[
                            styles.chipText,
                            { fontFamily: fontRegular },
                            isSelected && styles.chipTextSelected,
                          ]}>
                          {slot}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          </>
        )}

        {/* Motivo */}
        <View style={styles.section}>
          <Text style={[styles.label, { fontFamily: fontSemiBold }]}>
            Motivo <Text style={[styles.optional, { fontFamily: fontRegular }]}>(opcional)</Text>
          </Text>
          <TextInput
            style={[styles.input, { fontFamily: fontRegular }]}
            placeholder="Ex: folga, médico, compromisso pessoal..."
            placeholderTextColor={Colors.grey400}
            value={reason}
            onChangeText={setReason}
            maxLength={150}
          />
        </View>

        {/* Resumo */}
        {(selectedDay || startTime || endTime) && (
          <View style={styles.summaryCard}>
            {selectedDay ? (
              <Text style={[styles.summaryText, { fontFamily: fontRegular }]}>
                📅 Data:{' '}
                <Text style={{ fontFamily: fontSemiBold }}>
                  {String(selectedDay).padStart(2, '0')}/{String(month + 1).padStart(2, '0')}/{year}
                </Text>
              </Text>
            ) : null}
            {startTime && endTime ? (
              <Text style={[styles.summaryText, { fontFamily: fontRegular }]}>
                🕐 Horário:{' '}
                <Text style={{ fontFamily: fontSemiBold }}>
                  {startTime} às {endTime}
                </Text>
              </Text>
            ) : null}
            {reason.trim() ? (
              <Text style={[styles.summaryText, { fontFamily: fontRegular }]}>
                📝 Motivo: <Text style={{ fontFamily: fontSemiBold }}>{reason.trim()}</Text>
              </Text>
            ) : null}
          </View>
        )}

        {/* Erro */}
        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={[styles.errorText, { fontFamily: fontRegular }]}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Botão Confirmar */}
        <Button
          label="Confirmar Bloqueio"
          onPress={handleConfirm}
          disabled={!canConfirm}
          loading={loading}
          style={styles.confirmBtn}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grey100,
    backgroundColor: Colors.white,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    color: Colors.dark,
    flex: 1,
    textAlign: 'center',
  },
  scroll: {
    padding: 16,
    gap: 16,
  },
  profBadge: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.grey100,
  },
  profBadgeText: {
    fontSize: 13,
    color: Colors.dark,
  },
  section: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    color: Colors.grey500,
  },
  optional: {
    fontSize: 12,
    color: Colors.grey400,
  },
  calendarCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.grey100,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthNavBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    color: Colors.dark,
    fontSize: 15,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  weekDay: {
    width: 36,
    textAlign: 'center',
    color: Colors.grey400,
    fontSize: 11,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
  },
  dayCellSelected: {
    backgroundColor: Colors.gold,
  },
  dayCellDisabled: {
    opacity: 0.35,
  },
  dayCellEmpty: {
    opacity: 0,
  },
  dayText: {
    color: Colors.dark,
    fontSize: 14,
  },
  dayTextSelected: {
    color: Colors.white,
    fontWeight: '700',
  },
  dayTextDisabled: {
    color: Colors.grey400,
  },
  scheduleInfoBox: {
    backgroundColor: '#FEF9EE',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  scheduleInfoText: {
    fontSize: 13,
    color: Colors.dark,
  },
  chipScroll: {
    flexGrow: 0,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.grey200,
    backgroundColor: Colors.white,
    marginRight: 8,
  },
  chipSelected: {
    borderColor: Colors.gold,
    backgroundColor: Colors.gold,
  },
  chipText: {
    fontSize: 14,
    color: Colors.dark,
  },
  chipTextSelected: {
    color: Colors.white,
  },
  emptyHint: {
    fontSize: 13,
    color: Colors.grey400,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.grey200,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.dark,
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.grey100,
  },
  summaryText: {
    fontSize: 13,
    color: Colors.dark,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
  },
  confirmBtn: {
    marginTop: 6,
  },
});
