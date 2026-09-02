import { isAxiosError } from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeftIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';
import { useEstablishment } from '@/hooks/useEstablishment';
import {
  getAvailableSlots,
  type AvailableSlotsResponse,
} from '@/services/appointmentServices';
import { getActiveProfessionals, type ProfessionalMin } from '@/services/professionalServices';
import { listarServicos, type ServiceResponse } from '@/services/serviceServices';

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

/** Formata a data selecionada como "YYYY-MM-DD" para a API. */
function toDateString(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

/**
 * Combina a data "YYYY-MM-DD" com um slot retornado pelo backend.
 * O backend pode retornar "HH:mm" ou um ISO 8601 completo.
 */
function buildStartDateTime(dateStr: string, slot: string): string {
  // Slot já é ISO completo
  if (slot.includes('T') || slot.includes('Z')) return slot;
  // Extrai apenas HH:mm caso venha HH:mm:ss ou HH:mm
  const timePart = slot.slice(0, 5);
  return `${dateStr}T${timePart}:00`;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function BuscarHorarioScreen() {
  const { fontRegular, fontSemiBold } = useAppFonts();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Parâmetros de rota opcionais (pré-seleção)
  const params = useLocalSearchParams<{ professionalId?: string; serviceId?: string }>();

  // Establishment do gestor logado
  //const { establishmentId, loading: loadingEst } = useEstablishment();

  // TODO: TEMPORÁRIO — hardcode pra testar o fluxo do cliente antes de existir
// a tela de seleção de estabelecimento. Reverter para useEstablishment()
// (ou o hook certo do lado do cliente) quando esse fluxo existir.
const establishmentId = '96bd4e68-051c-4815-96be-0f7c1c596518	'; // seu establishmentId de teste
const loadingEst = false;

  // ── Listas de opções ───────────────────────────────────────────────────────
  const [professionals, setProfessionals] = useState<ProfessionalMin[]>([]);
  const [services, setServices] = useState<ServiceResponse[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);

  // ── Seleções do formulário ─────────────────────────────────────────────────
  const [selectedProfId, setSelectedProfId] = useState<string>(params.professionalId ?? '');
  const [selectedServiceId, setSelectedServiceId] = useState<string>(params.serviceId ?? '');

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // ── Resultado da busca ─────────────────────────────────────────────────────
  const [slotsResult, setSlotsResult] = useState<AvailableSlotsResponse | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  // ─── Carrega listas ao montar (quando o establishmentId já estiver pronto) ──
  useEffect(() => {
    if (!establishmentId) return;

    async function loadLists() {
      setLoadingLists(true);
      try {
        const [profs, svcs] = await Promise.all([
          getActiveProfessionals(establishmentId, 0, 100),
          listarServicos(establishmentId),
        ]);
        setProfessionals(profs.content);
        setServices(svcs);
      } catch {
        // Silencia — o usuário verá dropdowns vazios
      } finally {
        setLoadingLists(false);
      }
    }

    loadLists();
  }, [establishmentId]);

  // ─── Calendário ────────────────────────────────────────────────────────────
  const calendar = buildCalendar(year, month);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
    resetResults();
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
    resetResults();
  }

  function resetResults() {
    setSlotsResult(null);
    setErrorMsg(null);
    setSearched(false);
  }

  // ─── Busca ─────────────────────────────────────────────────────────────────
  const canSearch =
    !!selectedProfId && !!selectedServiceId && !!selectedDay && !!establishmentId;

  async function handleSearch() {
    if (!canSearch) return;
    setLoadingSlots(true);
    setErrorMsg(null);
    setSlotsResult(null);
    setSearched(true);

    try {
      const dateStr = toDateString(year, month, selectedDay!);
      const result = await getAvailableSlots(
        establishmentId,
        selectedProfId,
        selectedServiceId,
        dateStr
      );
      setSlotsResult(result);
    } catch (err) {
      if (isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 400) {
          setErrorMsg('Este profissional não atende nesse dia da semana.');
        } else if (status === 404) {
          setErrorMsg('Não foi possível encontrar esse profissional ou serviço.');
        } else {
          setErrorMsg('Não foi possível buscar horários, tente novamente.');
        }
      } else {
        setErrorMsg('Não foi possível buscar horários, tente novamente.');
      }
    } finally {
      setLoadingSlots(false);
    }
  }

  // ─── Navegação para confirmação ────────────────────────────────────────────
function handleSlotPress(slot: string) {
  if (!slotsResult || !selectedDay) return;
  const dateStr = toDateString(year, month, selectedDay);
  const startDateTime = buildStartDateTime(dateStr, slot);
  router.push({
    pathname: './booking',
    params: {
      establishmentId,
      professionalId: selectedProfId,
      serviceId: selectedServiceId,
      startDateTime,
      serviceName: selectedServiceName,
      professionalName: selectedProfName,
      price: slotsResult.price > 0 ? String(slotsResult.price) : undefined,
    },
  });
}

  // ─── Loading inicial ───────────────────────────────────────────────────────
  if (loadingEst || loadingLists) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={Colors.gold} size="large" />
      </View>
    );
  }

  const selectedProfName = professionals.find(p => p.id === selectedProfId)?.name ?? '';
  const selectedServiceName = services.find(s => s.id === selectedServiceId)?.name ?? '';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeftIcon size={22} />
        </TouchableOpacity>
        <Text style={[styles.title, { fontFamily: fontSemiBold }]}>
          Pesquisa Avançada de Horário
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>

        {/* ── Seletor de Serviço ─────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.label, { fontFamily: fontSemiBold }]}>Serviço</Text>
          {services.length === 0 ? (
            <Text style={[styles.emptyHint, { fontFamily: fontRegular }]}>
              Nenhum serviço cadastrado.
            </Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {services.map(svc => (
                <TouchableOpacity
                  key={svc.id}
                  style={[
                    styles.chip,
                    selectedServiceId === svc.id && styles.chipSelected,
                  ]}
                  onPress={() => {
                    setSelectedServiceId(svc.id);
                    resetResults();
                  }}>
                  <Text
                    style={[
                      styles.chipText,
                      { fontFamily: fontRegular },
                      selectedServiceId === svc.id && styles.chipTextSelected,
                    ]}>
                    {svc.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* ── Seletor de Profissional ────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.label, { fontFamily: fontSemiBold }]}>Profissional</Text>
          {professionals.length === 0 ? (
            <Text style={[styles.emptyHint, { fontFamily: fontRegular }]}>
              Nenhum profissional ativo.
            </Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {professionals.map(prof => (
                <TouchableOpacity
                  key={prof.id}
                  style={[
                    styles.chip,
                    selectedProfId === prof.id && styles.chipSelected,
                  ]}
                  onPress={() => {
                    setSelectedProfId(prof.id);
                    resetResults();
                  }}>
                  <Text
                    style={[
                      styles.chipText,
                      { fontFamily: fontRegular },
                      selectedProfId === prof.id && styles.chipTextSelected,
                    ]}>
                    {prof.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* ── Calendário ────────────────────────────────────────────────── */}
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
                style={[styles.monthNavBtn, { transform: [{ rotate: '180deg' }] }]}>
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
                      resetResults();
                    }
                  }}>
                  {day ? (
                    <Text
                      style={[
                        styles.dayText,
                        { fontFamily: fontRegular },
                        day === selectedDay && styles.dayTextSelected,
                      ]}>
                      {day}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* ── Resumo da seleção ──────────────────────────────────────────── */}
        {(selectedServiceName || selectedProfName || selectedDay) && (
          <View style={styles.summaryCard}>
            {selectedServiceName ? (
              <Text style={[styles.summaryText, { fontFamily: fontRegular }]}>
                📋 <Text style={{ fontFamily: fontSemiBold }}>{selectedServiceName}</Text>
              </Text>
            ) : null}
            {selectedProfName ? (
              <Text style={[styles.summaryText, { fontFamily: fontRegular }]}>
                ✂️ <Text style={{ fontFamily: fontSemiBold }}>{selectedProfName}</Text>
              </Text>
            ) : null}
            {selectedDay ? (
              <Text style={[styles.summaryText, { fontFamily: fontRegular }]}>
                📅 <Text style={{ fontFamily: fontSemiBold }}>
                  {String(selectedDay).padStart(2, '0')}/{String(month + 1).padStart(2, '0')}/{year}
                </Text>
              </Text>
            ) : null}
          </View>
        )}

        {/* ── Botão Buscar ───────────────────────────────────────────────── */}
        <Button
          label="Buscar horários"
          onPress={handleSearch}
          disabled={!canSearch}
          loading={loadingSlots}
          style={styles.searchBtn}
        />

        {/* ── Resultado ─────────────────────────────────────────────────── */}
        {searched && !loadingSlots && (
          <View style={styles.section}>
            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={[styles.errorText, { fontFamily: fontRegular }]}>
                  {errorMsg}
                </Text>
              </View>
            ) : slotsResult && slotsResult.slots.length === 0 ? (
              <Text style={[styles.emptyHint, { fontFamily: fontRegular }]}>
                Nenhum horário disponível para essa data.
              </Text>
            ) : slotsResult ? (
              <>
                <Text style={[styles.label, { fontFamily: fontSemiBold }]}>
                  Horários disponíveis
                </Text>
                {slotsResult.durationMinutes > 0 && (
                  <Text style={[styles.subHint, { fontFamily: fontRegular }]}>
                    Duração: {slotsResult.durationMinutes} min
                    {slotsResult.price > 0
                      ? `  ·  R$ ${slotsResult.price.toFixed(2)}`
                      : ''}
                  </Text>
                )}
                <View style={styles.slotsGrid}>
                  {slotsResult.slots.map(slot => (
                    <TouchableOpacity
                      key={slot}
                      style={styles.slotChip}
                      onPress={() => handleSlotPress(slot)}>
                      <Text style={[styles.slotText, { fontFamily: fontSemiBold }]}>
                        {/* Exibe só HH:mm, seja o slot "HH:mm" ou ISO completo */}
                        {slot.includes('T')
                          ? slot.slice(11, 16)
                          : slot.slice(0, 5)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : null}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  centered: { alignItems: 'center', justifyContent: 'center' },

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

  section: { gap: 10 },
  label: { fontSize: 14, color: Colors.grey500, letterSpacing: 0.3 },
  emptyHint: { fontSize: 13, color: Colors.grey400, fontStyle: 'italic' },
  subHint: { fontSize: 13, color: Colors.grey400 },

  // Chips horizontais (serviço / profissional)
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

  // Calendário (mesmo visual de booking.tsx)
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

  // Card de resumo
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.grey100,
  },
  summaryText: { fontSize: 14, color: Colors.dark },

  searchBtn: { marginTop: 4 },

  // Erros
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: { fontSize: 14, color: Colors.error },

  // Grid de slots disponíveis (mesmo visual do picker de horário de booking.tsx)
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slotChip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotText: { color: Colors.white, fontSize: 14 },

  white: { backgroundColor: Colors.white },
});
