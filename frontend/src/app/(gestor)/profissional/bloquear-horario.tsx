import { isAxiosError } from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
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

import { ChevronLeftIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';
import { useEstablishment } from '@/hooks/useEstablishment';
import { createBlockedTime } from '@/services/blockedTimesServices';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const WEEK_DAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

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

/** Gera array de horários de HH:00 a HH:30 entre 06:00 e 22:30 */
function buildTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 6; h <= 22; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 23) slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
}

const TIME_SLOTS = buildTimeSlots();

// ─── Componente ───────────────────────────────────────────────────────────────

export default function BloquearHorarioScreen() {
  const { fontRegular, fontSemiBold } = useAppFonts();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const params = useLocalSearchParams<{ professionalId: string; professionalName: string }>();
  const { establishmentId } = useEstablishment();

  // ── Calendário ─────────────────────────────────────────────────────────────
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // ── Horários ───────────────────────────────────────────────────────────────
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);

  // ── Motivo ─────────────────────────────────────────────────────────────────
  const [reason, setReason] = useState('');

  // ── Submissão ──────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const calendar = buildCalendar(year, month);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
    setStartTime(null);
    setEndTime(null);
    setErrorMsg(null);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
    setStartTime(null);
    setEndTime(null);
    setErrorMsg(null);
  }

  // Slots de fim válidos: apenas os posteriores ao início selecionado
  const validEndSlots = startTime
    ? TIME_SLOTS.filter(t => t > startTime)
    : TIME_SLOTS;

  const canConfirm =
    !!establishmentId &&
    !!params.professionalId &&
    !!selectedDay &&
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
      await createBlockedTime(establishmentId!, params.professionalId, {
        startDateTime,
        endDateTime,
        reason: reason.trim() || undefined,
      });
      router.back();
    } catch (err) {
      if (isAxiosError(err)) {
        const status = err.response?.status;
        const message = err.response?.data?.message ?? err.response?.data;
        if (status === 400) {
          if (typeof message === 'string' && message.toLowerCase().includes('agendamento')) {
            setErrorMsg(
              'Já existe um agendamento neste horário. Cancele ou reagende o cliente antes de bloquear.'
            );
          } else if (typeof message === 'string' && message.toLowerCase().includes('bloqueio')) {
            setErrorMsg('Já existe um bloqueio cadastrado neste intervalo de horário.');
          } else if (typeof message === 'string' && message.toLowerCase().includes('início')) {
            setErrorMsg('O horário de início deve ser anterior ao horário de término.');
          } else {
            setErrorMsg(
              typeof message === 'string' ? message : 'Não foi possível criar o bloqueio.'
            );
          }
        } else if (status === 404) {
          setErrorMsg('Profissional ou estabelecimento não encontrado.');
        } else if (status === 422) {
          setErrorMsg('Preencha corretamente os campos de data e horário.');
        } else {
          setErrorMsg('Erro inesperado. Tente novamente.');
        }
      } else {
        setErrorMsg('Erro inesperado. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeftIcon size={22} />
        </TouchableOpacity>
        <Text style={[styles.title, { fontFamily: fontSemiBold }]}>
          Bloquear horário
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profissional (informativo) ──────────────────────────────────── */}
        {params.professionalName ? (
          <View style={styles.profBadge}>
            <Text style={[styles.profBadgeText, { fontFamily: fontRegular }]}>
              ✂️{' '}
              <Text style={{ fontFamily: fontSemiBold }}>{params.professionalName}</Text>
            </Text>
          </View>
        ) : null}

        {/* ── Calendário ─────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.label, { fontFamily: fontSemiBold }]}>Data</Text>
          <View style={styles.calendarCard}>
            {/* Navegação de mês */}
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={prevMonth} style={styles.monthNavBtn}>
                <ChevronLeftIcon size={18} />
              </TouchableOpacity>
              <Text style={[styles.monthLabel, { fontFamily: fontSemiBold }]}>
                {MONTHS[month]} {year}
              </Text>
              <TouchableOpacity
                onPress={nextMonth}
                style={[styles.monthNavBtn, { transform: [{ rotate: '180deg' }] }]}
              >
                <ChevronLeftIcon size={18} />
              </TouchableOpacity>
            </View>

            {/* Dias da semana */}
            <View style={styles.weekRow}>
              {WEEK_DAYS.map(d => (
                <Text key={d} style={[styles.weekDay, { fontFamily: fontSemiBold }]}>
                  {d}
                </Text>
              ))}
            </View>

            {/* Grade de dias */}
            <View style={styles.daysGrid}>
              {calendar.map((day, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.dayCell,
                    day === selectedDay && styles.dayCellSelected,
                    !day && styles.dayCellEmpty,
                  ]}
                  disabled={!day}
                  onPress={() => {
                    if (day) {
                      setSelectedDay(day);
                      setStartTime(null);
                      setEndTime(null);
                      setErrorMsg(null);
                    }
                  }}
                >
                  {day ? (
                    <Text
                      style={[
                        styles.dayText,
                        { fontFamily: fontRegular },
                        day === selectedDay && styles.dayTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* ── Hora de Início ─────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.label, { fontFamily: fontSemiBold }]}>Hora de início</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {TIME_SLOTS.map(slot => (
              <TouchableOpacity
                key={`start-${slot}`}
                style={[styles.chip, startTime === slot && styles.chipSelected]}
                onPress={() => {
                  setStartTime(slot);
                  // Limpa fim se ficou inválido
                  if (endTime && endTime <= slot) setEndTime(null);
                  setErrorMsg(null);
                }}
              >
                <Text
                  style={[
                    styles.chipText,
                    { fontFamily: fontRegular },
                    startTime === slot && styles.chipTextSelected,
                  ]}
                >
                  {slot}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Hora de Término ────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.label, { fontFamily: fontSemiBold }]}>Hora de término</Text>
          {!startTime ? (
            <Text style={[styles.emptyHint, { fontFamily: fontRegular }]}>
              Selecione a hora de início primeiro.
            </Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {validEndSlots.map(slot => (
                <TouchableOpacity
                  key={`end-${slot}`}
                  style={[styles.chip, endTime === slot && styles.chipSelected]}
                  onPress={() => {
                    setEndTime(slot);
                    setErrorMsg(null);
                  }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { fontFamily: fontRegular },
                      endTime === slot && styles.chipTextSelected,
                    ]}
                  >
                    {slot}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* ── Motivo (opcional) ──────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.label, { fontFamily: fontSemiBold }]}>
            Motivo <Text style={[styles.optional, { fontFamily: fontRegular }]}>(opcional)</Text>
          </Text>
          <TextInput
            style={[styles.input, { fontFamily: fontRegular }]}
            placeholder="Ex: folga, imprevisto, férias..."
            placeholderTextColor={Colors.grey400}
            value={reason}
            onChangeText={setReason}
            maxLength={200}
            returnKeyType="done"
          />
        </View>

        {/* ── Resumo da seleção ─────────────────────────────────────────── */}
        {(selectedDay || startTime || endTime) && (
          <View style={styles.summaryCard}>
            {selectedDay ? (
              <Text style={[styles.summaryText, { fontFamily: fontRegular }]}>
                📅{' '}
                <Text style={{ fontFamily: fontSemiBold }}>
                  {String(selectedDay).padStart(2, '0')}/{String(month + 1).padStart(2, '0')}/{year}
                </Text>
              </Text>
            ) : null}
            {startTime ? (
              <Text style={[styles.summaryText, { fontFamily: fontRegular }]}>
                🕐 Início:{' '}
                <Text style={{ fontFamily: fontSemiBold }}>{startTime}</Text>
              </Text>
            ) : null}
            {endTime ? (
              <Text style={[styles.summaryText, { fontFamily: fontRegular }]}>
                🕐 Término:{' '}
                <Text style={{ fontFamily: fontSemiBold }}>{endTime}</Text>
              </Text>
            ) : null}
            {reason.trim() ? (
              <Text style={[styles.summaryText, { fontFamily: fontRegular }]}>
                📝 <Text style={{ fontFamily: fontSemiBold }}>{reason.trim()}</Text>
              </Text>
            ) : null}
          </View>
        )}

        {/* ── Erro ─────────────────────────────────────────────────────── */}
        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={[styles.errorText, { fontFamily: fontRegular }]}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* ── Botão confirmar ───────────────────────────────────────────── */}
        <Button
          label="Confirmar bloqueio"
          onPress={handleConfirm}
          disabled={!canConfirm}
          loading={loading}
          style={styles.confirmBtn}
        />
      </ScrollView>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grey100,
    backgroundColor: Colors.surface,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, color: Colors.dark, flex: 1, textAlign: 'center' },

  scroll: { padding: 16, gap: 20 },

  profBadge: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.grey100,
  },
  profBadgeText: { fontSize: 14, color: Colors.dark },

  section: { gap: 10 },
  label: { fontSize: 14, color: Colors.grey500, letterSpacing: 0.3 },
  optional: { fontSize: 12, color: Colors.grey400 },
  emptyHint: { fontSize: 13, color: Colors.grey400, fontStyle: 'italic' },

  // Calendário (mesmo visual de buscar-horario.tsx)
  calendarCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.grey100,
  },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthNavBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { color: Colors.dark, fontSize: 15 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around' },
  weekDay: { width: 36, textAlign: 'center', color: Colors.grey400, fontSize: 11 },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
  },
  dayCellSelected: { backgroundColor: Colors.gold },
  dayCellEmpty: { opacity: 0 },
  dayText: { color: Colors.dark, fontSize: 14 },
  dayTextSelected: { color: Colors.white, fontWeight: '700' },

  // Chips de horário (mesmo visual de buscar-horario.tsx)
  chipScroll: { flexGrow: 0 },
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
  chipText: { fontSize: 14, color: Colors.dark },
  chipTextSelected: { color: Colors.white },

  // Campo de motivo
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

  // Resumo
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.grey100,
  },
  summaryText: { fontSize: 14, color: Colors.dark },

  // Erros
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: { fontSize: 14, color: Colors.error },

  confirmBtn: { marginTop: 4 },
});
