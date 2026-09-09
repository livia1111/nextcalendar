import { isAxiosError } from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckCircleIcon, ChevronLeftIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';
import { useEstablishment } from '@/hooks/useEstablishment';

import {
  getAvailableSlots,
  rescheduleAppointment,
  type AvailableSlotsResponse,
} from '@/services/appointmentServices';

import {
  getActiveProfessionals,
  type ProfessionalMin,
} from '@/services/professionalServices';

import {
  listarServicos,
  type ServiceResponse,
} from '@/services/serviceServices';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const WEEK_DAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

function buildCalendar(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = Array(firstDay).fill(null);

  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  return cells;
}

/**
 * Formata a data selecionada como "YYYY-MM-DD" para a API.
 */
function toDateString(
  year: number,
  month: number,
  day: number
): string {
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');

  return `${year}-${mm}-${dd}`;
}

/**
 * Combina a data "YYYY-MM-DD" com um slot retornado pelo backend.
 *
 * O backend pode retornar "HH:mm" ou um ISO 8601 completo.
 */
function buildStartDateTime(
  dateStr: string,
  slot: string
): string {
  // Slot já é ISO completo
  if (slot.includes('T') || slot.includes('Z')) {
    return slot;
  }

  // Extrai apenas HH:mm caso venha HH:mm:ss ou HH:mm
  const timePart = slot.slice(0, 5);

  return `${dateStr}T${timePart}:00`;
}

/**
 * Verifica se um dia do calendário é anterior à data de hoje
 * (apenas para remarcação).
 */
function isPastDay(
  isReschedule: boolean,
  year: number,
  month: number,
  day: number
): boolean {
  if (!isReschedule) return false;

  const now = new Date();

  const selectedDate = new Date(
    year,
    month,
    day
  );

  const todayDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  return selectedDate < todayDate;
}

/**
 * Verifica se um determinado horário em um dia é
 * anterior ou igual a agora (apenas para remarcação).
 */
function isPastDateTime(
  isReschedule: boolean,
  year: number,
  month: number,
  day: number,
  slot: string
): boolean {
  if (!isReschedule) return false;

  const dateStr = toDateString(
    year,
    month,
    day
  );

  const startDateTime = buildStartDateTime(
    dateStr,
    slot
  );

  return new Date(startDateTime).getTime() <= Date.now();
}

/**
 * Formata uma data/hora ISO para exibição em pt-BR.
 */
function formatDateTimePtBr(
  dateTimeStr?: string
): string {
  if (!dateTimeStr) return '';

  const d = new Date(dateTimeStr);

  if (isNaN(d.getTime())) {
    return dateTimeStr;
  }

  const dateFormatted = d.toLocaleDateString(
    'pt-BR',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }
  );

  const timeFormatted = d.toLocaleTimeString(
    'pt-BR',
    {
      hour: '2-digit',
      minute: '2-digit',
    }
  );

  return `${dateFormatted} às ${timeFormatted}`;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function BuscarHorarioScreen() {
  const { fontRegular, fontSemiBold } =
    useAppFonts();

  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Parâmetros de rota opcionais
  // (pré-seleção / remarcação)
  const params =
    useLocalSearchParams<{
      professionalId?: string;
      serviceId?: string;
      mode?: string;
      appointmentId?: string;
      establishmentId?: string;
      startDateTime?: string;
    }>();

  /**
   * true quando a tela foi aberta
   * pelo fluxo de remarcação.
   */
  const isReschedule =
    params.mode === 'reschedule';

  // Establishment do gestor logado
  // const {
  //   establishmentId,
  //   loading: loadingEst
  // } = useEstablishment();

  // TODO: TEMPORÁRIO — hardcode pra testar
  // o fluxo do cliente antes de existir
  // a tela de seleção de estabelecimento.
  //
  // Reverter para useEstablishment()
  // quando esse fluxo existir.
  const  establishmentId = 'dd7460ab-eca5-41b1-a9d6-86fb4661bc97'

  const loadingEst = false;

  // ── Listas de opções ───────────────────────────────────────────────────────

  const [professionals, setProfessionals] =
    useState<ProfessionalMin[]>([]);

  const [services, setServices] =
    useState<ServiceResponse[]>([]);

  const [loadingLists, setLoadingLists] =
    useState(true);

  // ── Seleções do formulário ─────────────────────────────────────────────────

  const [selectedProfId, setSelectedProfId] =
    useState<string>(
      params.professionalId ?? ''
    );

  const [selectedServiceId, setSelectedServiceId] =
    useState<string>(
      params.serviceId ?? ''
    );

  useEffect(() => {
    if (params.professionalId) {
      setSelectedProfId(
        params.professionalId
      );
    }

    if (params.serviceId) {
      setSelectedServiceId(
        params.serviceId
      );
    }
  }, [
    params.professionalId,
    params.serviceId,
  ]);

  const today = new Date();

  const [year, setYear] = useState(
    today.getFullYear()
  );

  const [month, setMonth] = useState(
    today.getMonth()
  );

  const [selectedDay, setSelectedDay] =
    useState<number | null>(null);

  // ── Resultado da busca ─────────────────────────────────────────────────────

  const [slotsResult, setSlotsResult] =
    useState<AvailableSlotsResponse | null>(
      null
    );

  const [loadingSlots, setLoadingSlots] =
    useState(false);

  const [errorMsg, setErrorMsg] =
    useState<string | null>(null);

  const [searched, setSearched] =
    useState(false);

  // ── Estado da remarcação ───────────────────────────────────────────────────

  const [
    isSubmittingReschedule,
    setIsSubmittingReschedule,
  ] = useState(false);

  /**
   * Controla o modal exibido depois que
   * o backend confirma a remarcação.
   */
  const [
    showRescheduleSuccessModal,
    setShowRescheduleSuccessModal,
  ] = useState(false);

  /**
   * Guarda o novo horário escolhido.
   */
  const [
    rescheduleSuccessNewDateTime,
    setRescheduleSuccessNewDateTime,
  ] = useState('');

  /**
   * Controla a segunda etapa do modal.
   *
   * false:
   * "Confirmar alteração?"
   *
   * true:
   * "Agendamento confirmado!"
   */
  const [
    showConfirmationSuccess,
    setShowConfirmationSuccess,
  ] = useState(false);

  /**
   * Animação do ícone de sucesso.
   */
  const successIconScale =
    useRef(new Animated.Value(0.5)).current;

  const successIconOpacity =
    useRef(new Animated.Value(0)).current;

  // ─── Carrega listas ao montar ──────────────────────────────────────────────

  useEffect(() => {
    if (!establishmentId) return;

    async function loadLists() {
      setLoadingLists(true);

      try {
        const [profs, svcs] =
          await Promise.all([
            getActiveProfessionals(
              establishmentId,
              0,
              100
            ),
            listarServicos(establishmentId),
          ]);

        setProfessionals(profs.content);
        setServices(svcs);
      } catch {
        // Silencia — o usuário verá
        // dropdowns vazios
      } finally {
        setLoadingLists(false);
      }
    }

    loadLists();
  }, [establishmentId]);

  // ─── Calendário ────────────────────────────────────────────────────────────

  const calendar = buildCalendar(
    year,
    month
  );

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear(y => y - 1);
    } else {
      setMonth(m => m - 1);
    }

    setSelectedDay(null);
    resetResults();
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear(y => y + 1);
    } else {
      setMonth(m => m + 1);
    }

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
    !!selectedProfId &&
    !!selectedServiceId &&
    !!selectedDay &&
    !!establishmentId;

  async function handleSearch() {
    if (!canSearch) return;

    setLoadingSlots(true);
    setErrorMsg(null);
    setSlotsResult(null);
    setSearched(true);

    try {
      const dateStr = toDateString(
        year,
        month,
        selectedDay!
      );

      const result =
        await getAvailableSlots(
          establishmentId,
          selectedProfId,
          selectedServiceId,
          dateStr
        );

      setSlotsResult(result);
    } catch (err) {
      if (isAxiosError(err)) {
        const status =
          err.response?.status;

        if (status === 400) {
          setErrorMsg(
            'Este profissional não atende nesse dia da semana.'
          );
        } else if (status === 404) {
          setErrorMsg(
            'Não foi possível encontrar esse profissional ou serviço.'
          );
        } else {
          setErrorMsg(
            'Não foi possível buscar horários, tente novamente.'
          );
        }
      } else {
        setErrorMsg(
          'Não foi possível buscar horários, tente novamente.'
        );
      }
    } finally {
      setLoadingSlots(false);
    }
  }

  // ─── Clique no horário ─────────────────────────────────────────────────────

  async function handleSlotPress(
    slot: string
  ) {
    if (!slotsResult || !selectedDay) {
      return;
    }

    const dateStr = toDateString(
      year,
      month,
      selectedDay
    );

    const startDateTime =
      buildStartDateTime(
        dateStr,
        slot
      );

    // ── Modo remarcação ──────────────────────────────────────────────────────

    if (isReschedule) {
      // Não permitir remarcar para
      // horário que já passou
      if (
        new Date(
          startDateTime
        ).getTime() <= Date.now()
      ) {
        Alert.alert(
          'Horário inválido',
          'Não é possível remarcar para um horário que já passou.'
        );

        return;
      }

      // Evita múltiplos cliques
      // simultâneos
      if (isSubmittingReschedule) {
        return;
      }

      const apptId =
        params.appointmentId ?? '';

      const estId =
        params.establishmentId ??
        establishmentId;

      if (!apptId) {
        Alert.alert(
          'Erro',
          'Não foi possível identificar o agendamento que será remarcado.'
        );

        return;
      }

      try {
        setIsSubmittingReschedule(true);

        console.log(
          '[RESCHEDULE] appointmentId:',
          apptId
        );

        console.log(
          '[RESCHEDULE] establishmentId:',
          estId
        );

        console.log(
          '[RESCHEDULE] professionalId:',
          params.professionalId
        );

        console.log(
          '[RESCHEDULE] serviceId:',
          params.serviceId
        );

        console.log(
          '[RESCHEDULE] startDateTime:',
          startDateTime
        );

        await rescheduleAppointment(
          estId,
          apptId,
          {
            newStartDateTime:
              startDateTime,
          }
        );

        /**
         * O backend já confirmou a alteração.
         *
         * Porém, não saímos da tela imediatamente.
         *
         * Primeiro mostramos o modal de confirmação.
         */
        setRescheduleSuccessNewDateTime(
          startDateTime
        );

        setShowConfirmationSuccess(
          false
        );

        // Reset da animação
        successIconScale.setValue(0.5);
        successIconOpacity.setValue(0);

        setShowRescheduleSuccessModal(
          true
        );
      } catch (err) {
        console.error(
          '[RESCHEDULE] erro:',
          err
        );

        if (
          isAxiosError(err) &&
          err.response?.status === 400
        ) {
          Alert.alert(
            'Horário indisponível',
            'Não foi possível remarcar para este horário. Ele pode ter ficado indisponível.'
          );
        } else {
          Alert.alert(
            'Erro',
            'Não foi possível remarcar o agendamento. Tente novamente.'
          );
        }
      } finally {
        setIsSubmittingReschedule(false);
      }

      return;
    }

    // ── Modo normal ──────────────────────────────────────────────────────────
    // Mantém o fluxo existente.

    router.push({
      pathname: './booking',

      params: {
        establishmentId,
        professionalId:
          selectedProfId,
        serviceId:
          selectedServiceId,
        startDateTime,
        serviceName:
          selectedServiceName,
        professionalName:
          selectedProfName,
        price:
          slotsResult.price > 0
            ? String(
                slotsResult.price
              )
            : undefined,
      },
    });
  }

  // ─── Confirmação final do modal ────────────────────────────────────────────

  function handleConfirmSuccess() {
    // Evita repetir a animação
    if (showConfirmationSuccess) {
      return;
    }

    /**
     * Primeiro muda o conteúdo do modal
     * para a mensagem de sucesso.
     */
    setShowConfirmationSuccess(true);

    /**
     * Reinicia os valores da animação.
     */
    successIconScale.setValue(0.5);
    successIconOpacity.setValue(0);

    /**
     * Animação:
     *
     * - opacidade: 0 → 1
     * - escala: 0.5 → 1
     *
     * As duas acontecem juntas.
     */
    Animated.parallel([
      Animated.timing(
        successIconOpacity,
        {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }
      ),

      Animated.spring(
        successIconScale,
        {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }
      ),
    ]).start();

    /**
     * Depois que o usuário vê a confirmação,
     * fecha o modal e volta para os agendamentos.
     */
    setTimeout(() => {
      setShowRescheduleSuccessModal(
        false
      );

      setShowConfirmationSuccess(
        false
      );

      router.back();
    }, 1800);
  }

  // ─── Loading inicial ───────────────────────────────────────────────────────

  if (loadingEst || loadingLists) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
        ]}>
        <ActivityIndicator
          color={Colors.gold}
          size="large"
        />
      </View>
    );
  }

  const selectedProfName =
    professionals.find(
      p => p.id === selectedProfId
    )?.name ?? '';

  const selectedServiceName =
    services.find(
      s => s.id === selectedServiceId
    )?.name ?? '';

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
        },
      ]}>

      {/* Header */}

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            router.back()
          }
          style={styles.backBtn}>
          <ChevronLeftIcon size={22} />
        </TouchableOpacity>

        <Text
          style={[
            styles.title,
            {
              fontFamily:
                fontSemiBold,
            },
          ]}>
          {isReschedule
            ? 'Remarcar Agendamento'
            : 'Pesquisa Avançada de Horário'}
        </Text>

        <View
          style={styles.backBtn}
        />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingBottom:
              insets.bottom + 24,
          },
        ]}
        showsVerticalScrollIndicator={
          false
        }>

        {/* ── Seletor de Serviço ─────────────────────────────────────────── */}

        <View style={styles.section}>
          <Text
            style={[
              styles.label,
              {
                fontFamily:
                  fontSemiBold,
              },
            ]}>
            Serviço
          </Text>

          {isReschedule ? (
            <View
              style={styles.lockedChip}>
              <Text
                style={[
                  styles.lockedChipText,
                  {
                    fontFamily:
                      fontSemiBold,
                  },
                ]}>
                {selectedServiceName ||
                  'Serviço do agendamento'}
              </Text>

              <Text
                style={[
                  styles.lockedHint,
                  {
                    fontFamily:
                      fontRegular,
                  },
                ]}>
                Não editável neste fluxo
              </Text>
            </View>
          ) : services.length === 0 ? (
            <Text
              style={[
                styles.emptyHint,
                {
                  fontFamily:
                    fontRegular,
                },
              ]}>
              Nenhum serviço cadastrado.
            </Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              style={
                styles.chipScroll
              }>
              {services.map(
                svc => (
                  <TouchableOpacity
                    key={svc.id}
                    style={[
                      styles.chip,
                      selectedServiceId ===
                        svc.id &&
                        styles.chipSelected,
                    ]}
                    onPress={() => {
                      setSelectedServiceId(
                        svc.id
                      );

                      resetResults();
                    }}>
                    <Text
                      style={[
                        styles.chipText,
                        {
                          fontFamily:
                            fontRegular,
                        },
                        selectedServiceId ===
                          svc.id &&
                          styles.chipTextSelected,
                      ]}>
                      {svc.name}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </ScrollView>
          )}
        </View>

        {/* ── Seletor de Profissional ────────────────────────────────────── */}

        <View style={styles.section}>
          <Text
            style={[
              styles.label,
              {
                fontFamily:
                  fontSemiBold,
              },
            ]}>
            Profissional
          </Text>

          {isReschedule ? (
            <View
              style={styles.lockedChip}>
              <Text
                style={[
                  styles.lockedChipText,
                  {
                    fontFamily:
                      fontSemiBold,
                  },
                ]}>
                {selectedProfName ||
                  'Profissional do agendamento'}
              </Text>

              <Text
                style={[
                  styles.lockedHint,
                  {
                    fontFamily:
                      fontRegular,
                  },
                ]}>
                Não editável neste fluxo
              </Text>
            </View>
          ) : professionals.length ===
            0 ? (
            <Text
              style={[
                styles.emptyHint,
                {
                  fontFamily:
                    fontRegular,
                },
              ]}>
              Nenhum profissional ativo.
            </Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              style={
                styles.chipScroll
              }>
              {professionals.map(
                prof => (
                  <TouchableOpacity
                    key={prof.id}
                    style={[
                      styles.chip,
                      selectedProfId ===
                        prof.id &&
                        styles.chipSelected,
                    ]}
                    onPress={() => {
                      setSelectedProfId(
                        prof.id
                      );

                      resetResults();
                    }}>
                    <Text
                      style={[
                        styles.chipText,
                        {
                          fontFamily:
                            fontRegular,
                        },
                        selectedProfId ===
                          prof.id &&
                          styles.chipTextSelected,
                      ]}>
                      {prof.name}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </ScrollView>
          )}
        </View>

        {/* ── Calendário ────────────────────────────────────────────────── */}

        <View style={styles.section}>
          <Text
            style={[
              styles.label,
              {
                fontFamily:
                  fontSemiBold,
              },
            ]}>
            Data
          </Text>

          <View
            style={
              styles.calendarCard
            }>

            {/* Navegação de mês */}

            <View
              style={styles.monthNav}>
              <TouchableOpacity
                onPress={prevMonth}
                style={
                  styles.monthNavBtn
                }>
                <ChevronLeftIcon
                  size={18}
                />
              </TouchableOpacity>

              <Text
                style={[
                  styles.monthLabel,
                  {
                    fontFamily:
                      fontSemiBold,
                  },
                ]}>
                {MONTHS[month]} {year}
              </Text>

              <TouchableOpacity
                onPress={nextMonth}
                style={[
                  styles.monthNavBtn,
                  {
                    transform: [
                      {
                        rotate: '180deg',
                      },
                    ],
                  },
                ]}>
                <ChevronLeftIcon
                  size={18}
                />
              </TouchableOpacity>
            </View>

            {/* Dias da semana */}

            <View
              style={styles.weekRow}>
              {WEEK_DAYS.map(
                d => (
                  <Text
                    key={d}
                    style={[
                      styles.weekDay,
                      {
                        fontFamily:
                          fontSemiBold,
                      },
                    ]}>
                    {d}
                  </Text>
                )
              )}
            </View>

            {/* Grade de dias */}

            <View
              style={styles.daysGrid}>
              {calendar.map(
                (day, idx) => {
                  const dayPast = day
                    ? isPastDay(
                        isReschedule,
                        year,
                        month,
                        day
                      )
                    : false;

                  const disabled =
                    !day || dayPast;

                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.dayCell,
                        day ===
                          selectedDay &&
                          styles.dayCellSelected,
                        !day &&
                          styles.dayCellEmpty,
                        dayPast &&
                          styles.dayCellDisabled,
                      ]}
                      disabled={
                        disabled
                      }
                      onPress={() => {
                        if (
                          day &&
                          !dayPast
                        ) {
                          setSelectedDay(
                            day
                          );

                          resetResults();
                        }
                      }}>
                      {day ? (
                        <Text
                          style={[
                            styles.dayText,
                            {
                              fontFamily:
                                fontRegular,
                            },
                            day ===
                              selectedDay &&
                              styles.dayTextSelected,
                            dayPast &&
                              styles.dayTextDisabled,
                          ]}>
                          {day}
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                  );
                }
              )}
            </View>
          </View>
        </View>

        {/* ── Resumo da seleção ──────────────────────────────────────────── */}

        {(selectedServiceName ||
          selectedProfName ||
          selectedDay) && (
          <View
            style={
              styles.summaryCard
            }>

            {selectedServiceName ? (
              <Text
                style={[
                  styles.summaryText,
                  {
                    fontFamily:
                      fontRegular,
                  },
                ]}>
                📋{' '}
                <Text
                  style={{
                    fontFamily:
                      fontSemiBold,
                  }}>
                  {
                    selectedServiceName
                  }
                </Text>
              </Text>
            ) : null}

            {selectedProfName ? (
              <Text
                style={[
                  styles.summaryText,
                  {
                    fontFamily:
                      fontRegular,
                  },
                ]}>
                ✂️{' '}
                <Text
                  style={{
                    fontFamily:
                      fontSemiBold,
                  }}>
                  {selectedProfName}
                </Text>
              </Text>
            ) : null}

            {selectedDay ? (
              <Text
                style={[
                  styles.summaryText,
                  {
                    fontFamily:
                      fontRegular,
                  },
                ]}>
                📅{' '}
                <Text
                  style={{
                    fontFamily:
                      fontSemiBold,
                  }}>
                  {String(
                    selectedDay
                  ).padStart(2, '0')}
                  /
                  {String(
                    month + 1
                  ).padStart(2, '0')}
                  /
                  {year}
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
          style={
            styles.searchBtn
          }
        />

        {/* ── Resultado ─────────────────────────────────────────────────── */}

        {searched &&
          !loadingSlots && (
            <View
              style={
                styles.section
              }>

              {errorMsg ? (
                <View
                  style={
                    styles.errorBox
                  }>
                  <Text
                    style={[
                      styles.errorText,
                      {
                        fontFamily:
                          fontRegular,
                      },
                    ]}>
                    {errorMsg}
                  </Text>
                </View>
              ) : slotsResult &&
                slotsResult.slots.length ===
                  0 ? (
                <Text
                  style={[
                    styles.emptyHint,
                    {
                      fontFamily:
                        fontRegular,
                    },
                  ]}>
                  Nenhum horário disponível para essa data.
                </Text>
              ) : slotsResult ? (
                <>
                  <Text
                    style={[
                      styles.label,
                      {
                        fontFamily:
                          fontSemiBold,
                      },
                    ]}>
                    Horários disponíveis
                  </Text>

                  {slotsResult.durationMinutes >
                    0 && (
                    <Text
                      style={[
                        styles.subHint,
                        {
                          fontFamily:
                            fontRegular,
                        },
                      ]}>
                      Duração:{' '}
                      {
                        slotsResult.durationMinutes
                      } min
                      {slotsResult.price >
                      0
                        ? `  ·  R$ ${slotsResult.price.toFixed(
                            2
                          )}`
                        : ''}
                    </Text>
                  )}

                  <View
                    style={
                      styles.slotsGrid
                    }>
                    {slotsResult.slots.map(
                      slot => {
                        const slotPast =
                          selectedDay
                            ? isPastDateTime(
                                isReschedule,
                                year,
                                month,
                                selectedDay,
                                slot
                              )
                            : false;

                        return (
                          <TouchableOpacity
                            key={slot}
                            style={[
                              styles.slotChip,
                              slotPast &&
                                styles.slotChipDisabled,
                            ]}
                            disabled={
                              slotPast ||
                              isSubmittingReschedule
                            }
                            onPress={() => {
                              if (
                                !slotPast
                              ) {
                                handleSlotPress(
                                  slot
                                );
                              }
                            }}>
                            <Text
                              style={[
                                styles.slotText,
                                {
                                  fontFamily:
                                    fontSemiBold,
                                },
                              ]}>
                              {slot.includes(
                                'T'
                              )
                                ? slot.slice(
                                    11,
                                    16
                                  )
                                : slot.slice(
                                    0,
                                    5
                                  )}
                            </Text>
                          </TouchableOpacity>
                        );
                      }
                    )}
                  </View>
                </>
              ) : null}

            </View>
          )}

      </ScrollView>

      {/* ────────────────────────────────────────────────────────────────────
          MODAL DE REMARCAÇÃO
          ──────────────────────────────────────────────────────────────────── */}

      <Modal
        visible={
          showRescheduleSuccessModal
        }
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          // Não permite fechar pelo botão
          // voltar do Android.
        }}>

        <View
          style={
            styles.successModalOverlay
          }>

          <View
            style={
              styles.successModalCard
            }>

            {!showConfirmationSuccess ? (
              <>
                {/* Ícone inicial */}

                <View
                  style={
                    styles.confirmIconCircle
                  }>
                  <CheckCircleIcon
                    size={42}
                  />
                </View>

                {/* Título de confirmação */}

                <Text
                  style={[
                    styles.successModalTitle,
                    {
                      fontFamily:
                        fontSemiBold,
                    },
                  ]}>
                  Confirmar alteração?
                </Text>

                {/* Texto */}

                <Text
                  style={[
                    styles.confirmDescription,
                    {
                      fontFamily:
                        fontRegular,
                    },
                  ]}>
                  Deseja realmente alterar o
                  horário deste agendamento?
                </Text>

                {/* Horário anterior */}

                <View
                  style={
                    styles.successTimeBox
                  }>
                  <Text
                    style={[
                      styles.successTimeLabel,
                      {
                        fontFamily:
                          fontSemiBold,
                      },
                    ]}>
                    Horário anterior
                  </Text>

                  <Text
                    style={[
                      styles.successTimeValue,
                      {
                        fontFamily:
                          fontRegular,
                      },
                    ]}>
                    {formatDateTimePtBr(
                      params.startDateTime
                    ) ||
                      'Não informado'}
                  </Text>
                </View>

                {/* Novo horário */}

                <View
                  style={
                    styles.successTimeBox
                  }>
                  <Text
                    style={[
                      styles.successTimeLabel,
                      {
                        fontFamily:
                          fontSemiBold,
                      },
                    ]}>
                    Novo horário
                  </Text>

                  <Text
                    style={[
                      styles.successTimeValue,
                      {
                        fontFamily:
                          fontRegular,
                      },
                    ]}>
                    {formatDateTimePtBr(
                      rescheduleSuccessNewDateTime
                    )}
                  </Text>
                </View>

                {/* Confirmar */}

                <TouchableOpacity
                  style={
                    styles.successConfirmButton
                  }
                  activeOpacity={0.8}
                  onPress={
                    handleConfirmSuccess
                  }>

                  <Text
                    style={[
                      styles.successConfirmText,
                      {
                        fontFamily:
                          fontSemiBold,
                      },
                    ]}>
                    Confirmar
                  </Text>

                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* ── ANIMAÇÃO DE SUCESSO ── */}

                <Animated.View
                  style={[
                    styles.successIconCircle,
                    {
                      opacity:
                        successIconOpacity,

                      transform: [
                        {
                          scale:
                            successIconScale,
                        },
                      ],
                    },
                  ]}>
                  <CheckCircleIcon
                    size={42}
                  />
                </Animated.View>

                {/* Título */}

                <Text
                  style={[
                    styles.successModalTitle,
                    {
                      fontFamily:
                        fontSemiBold,
                    },
                  ]}>
                  Agendamento confirmado!
                </Text>

                {/* Mensagem */}

                <Text
                  style={[
                    styles.successDescription,
                    {
                      fontFamily:
                        fontRegular,
                    },
                  ]}>
                  Seu horário foi alterado
                  com sucesso.
                </Text>
              </>
            )}

          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      Colors.surface,
  },

  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor:
      Colors.grey100,
    backgroundColor:
      Colors.surface,
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
    gap: 20,
  },

  section: {
    gap: 10,
  },

  label: {
    fontSize: 14,
    color: Colors.grey500,
    letterSpacing: 0.3,
  },

  emptyHint: {
    fontSize: 13,
    color: Colors.grey400,
    fontStyle: 'italic',
  },

  subHint: {
    fontSize: 13,
    color: Colors.grey400,
  },

  // Chips horizontais

  chipScroll: {
    flexGrow: 0,
  },

  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor:
      Colors.grey200,
    backgroundColor:
      Colors.white,
    marginRight: 8,
  },

  chipSelected: {
    borderColor:
      Colors.gold,
    backgroundColor:
      Colors.gold,
  },

  chipText: {
    fontSize: 14,
    color: Colors.dark,
  },

  chipTextSelected: {
    color: Colors.white,
  },

  // Calendário

  calendarCard: {
    backgroundColor:
      Colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor:
      Colors.grey100,
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
    backgroundColor:
      Colors.gold,
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

  dayCellDisabled: {
    opacity: 0.25,
  },

  dayTextDisabled: {
    color: Colors.grey300,
  },

  // Card de resumo

  summaryCard: {
    backgroundColor:
      Colors.white,
    borderRadius: 12,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor:
      Colors.grey100,
  },

  summaryText: {
    fontSize: 14,
    color: Colors.dark,
  },

  searchBtn: {
    marginTop: 4,
  },

  // Erros

  errorBox: {
    backgroundColor:
      '#FEF2F2',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor:
      '#FECACA',
  },

  errorText: {
    fontSize: 14,
    color: Colors.error,
  },

  // Grid de slots disponíveis

  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  slotChip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor:
      Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },

  slotChipDisabled: {
    opacity: 0.35,
    backgroundColor:
      Colors.grey300,
  },

  slotText: {
    color: Colors.white,
    fontSize: 14,
  },

  // Chip travado
  // (modo remarcação)

  lockedChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor:
      Colors.grey200,
    backgroundColor:
      Colors.grey100,
    alignSelf: 'flex-start',
    gap: 2,
  },

  lockedChipText: {
    fontSize: 14,
    color: Colors.dark,
  },

  lockedHint: {
    fontSize: 11,
    color: Colors.grey400,
    fontStyle: 'italic',
  },

  // ────────────────────────────────────────────────────────────────────────
  // Modal
  // ────────────────────────────────────────────────────────────────────────

  successModalOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  successModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor:
      Colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },

  // Ícone da confirmação inicial

  confirmIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor:
      Colors.grey100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  // Ícone animado de sucesso

  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor:
      Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  successModalTitle: {
    fontSize: 19,
    color: Colors.dark,
    textAlign: 'center',
    marginBottom: 12,
  },

  confirmDescription: {
    fontSize: 14,
    color: Colors.grey500,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },

  successDescription: {
    fontSize: 14,
    color: Colors.grey500,
    textAlign: 'center',
    lineHeight: 20,
  },

  successTimeBox: {
    width: '100%',
    backgroundColor:
      Colors.grey100,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },

  successTimeLabel: {
    fontSize: 12,
    color: Colors.grey500,
    marginBottom: 4,
  },

  successTimeValue: {
    fontSize: 15,
    color: Colors.dark,
  },

  successConfirmButton: {
    width: '100%',
    marginTop: 10,
    backgroundColor:
      Colors.gold,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  successConfirmText: {
    fontSize: 15,
    color: Colors.white,
  },

  white: {
    backgroundColor:
      Colors.white,
  },
});