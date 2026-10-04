import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';
import { useAuth } from '@/context/AuthContext';
import { useMyProfessionalProfile } from '@/hooks/useMyProfessionalProfile';
import {
  getMyAppointments,
  type Appointment,
  type AppointmentStatus,
} from '@/services/appointmentServices';
import { listBlockedTimes, type BlockedTime } from '@/services/blockedTimesServices';
import { listWorkingHours, type WorkingHours } from '@/services/workingHoursServices';

import { ProfissionalHeader } from '@/components/profissional/ProfissionalHeader';
import { AppointmentDetailModal } from '@/components/profissional/AppointmentDetailModal';
import { RescheduleModal } from '@/components/profissional/RescheduleModal';
import { CreateAppointmentModal } from '@/components/profissional/CreateAppointmentModal';
import { ArrowRightIcon, ChevronLeftIcon, ClockIcon } from '@/components/icons';

// ─── Helpers de Data ─────────────────────────────────────────────────────────

const DAY_NAMES = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const SHORT_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDateString(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function getStartAndEndOfWeek(dateStr: string): { start: string; end: string; days: Date[] } {
  const d = parseDateString(dateStr);
  const day = d.getDay();
  // Semana começando na segunda-feira
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(monday);
    nextDay.setDate(monday.getDate() + i);
    days.push(nextDay);
  }

  return {
    start: toDateString(days[0]),
    end: toDateString(days[6]),
    days,
  };
}

export default function ProfissionalHomeScreen() {
  const { fontRegular, fontSemiBold, fontBold } = useAppFonts();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const { professional, establishmentId, professionalId, loading: loadingProfile } = useMyProfessionalProfile();

  // Modo de visualização: 'day' | 'week'
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  // Data selecionada (padrão: hoje)
  const [selectedDate, setSelectedDate] = useState<string>(() => toDateString(new Date()));

  // Dados
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [weekAppointments, setWeekAppointments] = useState<Appointment[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([]);

  // Estados
  const [loadingData, setLoadingData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modais
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const [rescheduleAppt, setRescheduleAppt] = useState<Appointment | null>(null);
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);

  const [createModalVisible, setCreateModalVisible] = useState(false);

  // ─── Carregar dados da agenda ──────────────────────────────────────────────
  const loadScheduleData = useCallback(async () => {
    if (!establishmentId || !professionalId) return;

    try {
      setLoadingData(true);

      const weekBounds = getStartAndEndOfWeek(selectedDate);

      // Carrega agendamentos do dia, da semana, bloqueios e working hours
      const [dayAppts, weekAppts, blocks, whList] = await Promise.all([
        getMyAppointments({ date: selectedDate }),
        getMyAppointments({ from: weekBounds.start, to: weekBounds.end }),
        listBlockedTimes(establishmentId, professionalId),
        listWorkingHours(establishmentId, professionalId),
      ]);

      setAppointments(dayAppts);
      setWeekAppointments(weekAppts);
      setBlockedTimes(blocks);
      setWorkingHours(whList);
    } catch {
      // Falha silenciosa
    } finally {
      setLoadingData(false);
    }
  }, [establishmentId, professionalId, selectedDate]);

  useFocusEffect(
    useCallback(() => {
      loadScheduleData();
    }, [loadScheduleData])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadScheduleData();
    setRefreshing(false);
  }

  // ─── Navegação de Data ─────────────────────────────────────────────────────
  function handleDateChange(deltaDays: number) {
    const d = parseDateString(selectedDate);
    d.setDate(d.getDate() + deltaDays);
    setSelectedDate(toDateString(d));
  }

  function handleWeekChange(deltaWeeks: number) {
    const d = parseDateString(selectedDate);
    d.setDate(d.getDate() + deltaWeeks * 7);
    setSelectedDate(toDateString(d));
  }

  // ─── Informações do Expediente de Hoje ─────────────────────────────────────
  const currentDayOfWeekIndex = parseDateString(selectedDate).getDay(); // 0 = Domingo
  const dayOfWeekNamesEn = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const todayWorkingHours = workingHours.find(
    (w) => w.dayOfWeek === dayOfWeekNamesEn[currentDayOfWeekIndex] && w.active
  );

  // Bloqueios que afetam o dia selecionado
  const dayBlockedTimes = blockedTimes.filter((b) => {
    return b.startDateTime.startsWith(selectedDate) || b.endDateTime.startsWith(selectedDate);
  });

  // ─── Métricas do cabeçalho ─────────────────────────────────────────────────
  const activeAppointments = appointments.filter((a) => a.status !== 'CANCELLED');
  const DONEAppointments = appointments.filter((a) => a.status === 'DONE');
  const scheduledList = appointments
    .filter((a) => a.status === 'SCHEDULED')
    .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());

  const nextAppointmentTime = scheduledList[0]
    ? (() => {
        const d = new Date(scheduledList[0].startDateTime);
        return !isNaN(d.getTime())
          ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          : scheduledList[0].startDateTime.slice(11, 16);
      })()
    : '--:--';

  function formatTime(iso: string) {
    if (!iso) return '--:--';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso.slice(11, 16);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function formatDisplayHeaderDate(dateStr: string) {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      return `${DAY_NAMES[date.getDay()]}, ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
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
      case 'DONE':
        return { label: 'Concluído', bg: '#EDF4FC', color: '#1E64B4', border: '#BFDBFE' };
      case 'CANCELLED':
        return { label: 'Cancelado', bg: '#FEECEC', color: '#DC2626', border: '#FECACA' };
      case 'NO_SHOW':
        return { label: 'Não compareceu', bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' };
      default:
        return { label: status, bg: '#F7F8FA', color: '#9CA3AF', border: '#E5E7EB' };
    }
  }

  const weekBounds = getStartAndEndOfWeek(selectedDate);

  if (loadingProfile && !professional) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={Colors.gold} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.gold}
          />
        }>
        {/* Header do Profissional */}
        <ProfissionalHeader
          establishmentName={professional?.establishmentName || 'Minha Barbearia'}
          professionalName={professional?.nickname || professional?.name || 'Profissional'}
          totalAppointments={activeAppointments.length}
          DONEAppointments={DONEAppointments.length}
          nextAppointmentTime={nextAppointmentTime}
          onSignOut={signOut}
        />

        {/* Barra de Ações: Seletor de Visão e Botão Novo Agendamento */}
        <View style={styles.actionsBar}>
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'day' && styles.toggleBtnActive]}
              activeOpacity={0.8}
              onPress={() => setViewMode('day')}>
              <Text
                style={[
                  styles.toggleText,
                  { fontFamily: fontSemiBold },
                  viewMode === 'day' && styles.toggleTextActive,
                ]}>
                Dia
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'week' && styles.toggleBtnActive]}
              activeOpacity={0.8}
              onPress={() => setViewMode('week')}>
              <Text
                style={[
                  styles.toggleText,
                  { fontFamily: fontSemiBold },
                  viewMode === 'week' && styles.toggleTextActive,
                ]}>
                Semana
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.newApptBtn}
            activeOpacity={0.8}
            onPress={() => setCreateModalVisible(true)}>
            <Text style={[styles.newApptBtnText, { fontFamily: fontSemiBold }]}>
              + Novo Agendamento
            </Text>
          </TouchableOpacity>
        </View>

        {/* ─── VISÃO DIA ──────────────────────────────────────────────────────── */}
        {viewMode === 'day' ? (
          <View style={styles.viewContainer}>
            {/* Navegador de Dias */}
            <View style={styles.dateNavigator}>
              <TouchableOpacity
                style={styles.navArrowBtn}
                onPress={() => handleDateChange(-1)}>
                <ChevronLeftIcon size={18} color={Colors.dark} />
              </TouchableOpacity>

              <View style={styles.dateCenterCol}>
                <Text style={[styles.navDateTitle, { fontFamily: fontSemiBold }]}>
                  {formatDisplayHeaderDate(selectedDate)}
                </Text>
                <TouchableOpacity onPress={() => setSelectedDate(toDateString(new Date()))}>
                  <Text style={[styles.todayLink, { fontFamily: fontRegular }]}>
                    Ir para hoje
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.navArrowBtn, { transform: [{ rotate: '180deg' }] }]}
                onPress={() => handleDateChange(1)}>
                <ChevronLeftIcon size={18} color={Colors.dark} />
              </TouchableOpacity>
            </View>

            {/* Banner de Expediente do Dia */}
            <View style={styles.workingHoursBanner}>
              {todayWorkingHours ? (
                <Text style={[styles.workingHoursText, { fontFamily: fontRegular }]}>
                  ⏰ Expediente: <Text style={{ fontFamily: fontSemiBold }}>{todayWorkingHours.startTime.slice(0, 5)} às {todayWorkingHours.endTime.slice(0, 5)}</Text>
                  {todayWorkingHours.breakStart && todayWorkingHours.breakEnd ? (
                    <Text style={{ color: Colors.grey500 }}> • Almoço: {todayWorkingHours.breakStart.slice(0, 5)} às {todayWorkingHours.breakEnd.slice(0, 5)}</Text>
                  ) : null}
                </Text>
              ) : (
                <Text style={[styles.workingHoursOff, { fontFamily: fontRegular }]}>
                  🏖️ Dia sem expediente cadastrado (folga)
                </Text>
              )}
            </View>

            {/* Loading */}
            {loadingData && (
              <View style={styles.feedbackBox}>
                <ActivityIndicator size="small" color={Colors.gold} />
                <Text style={[styles.feedbackText, { fontFamily: fontRegular }]}>
                  Carregando agenda...
                </Text>
              </View>
            )}

            {/* Empty State */}
            {!loadingData && appointments.length === 0 && dayBlockedTimes.length === 0 && (
              <View style={styles.feedbackBox}>
                <Text style={{ fontSize: 32 }}>📅</Text>
                <Text style={[styles.emptyTitle, { fontFamily: fontSemiBold }]}>
                  Nenhum agendamento para este dia
                </Text>
                <Text style={[styles.feedbackText, { fontFamily: fontRegular }]}>
                  Toque em "+ Novo Agendamento" para marcar um cliente.
                </Text>
              </View>
            )}

            {/* Bloqueios do Dia */}
            {dayBlockedTimes.length > 0 && (
              <View style={styles.blockedSection}>
                <Text style={[styles.sectionTitle, { fontFamily: fontSemiBold }]}>
                  🔒 Horários Bloqueados ({dayBlockedTimes.length})
                </Text>
                {dayBlockedTimes.map((b) => (
                  <View key={b.id} style={styles.blockedCard}>
                    <View style={styles.blockedTimeCol}>
                      <Text style={[styles.blockedTimeText, { fontFamily: fontSemiBold }]}>
                        {formatTime(b.startDateTime)} – {formatTime(b.endDateTime)}
                      </Text>
                    </View>
                    <View style={styles.blockedInfoCol}>
                      <Text style={[styles.blockedReason, { fontFamily: fontSemiBold }]}>
                        {b.reason || 'Bloqueio de horário'}
                      </Text>
                      <Text style={[styles.blockedSub, { fontFamily: fontRegular }]}>
                        Horário indisponível para clientes
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Lista de Agendamentos */}
            {appointments.length > 0 && (
              <View style={styles.appointmentsList}>
                <Text style={[styles.sectionTitle, { fontFamily: fontSemiBold }]}>
                  Atendimentos do Dia ({appointments.length})
                </Text>

                {appointments.map((appt) => {
                  const badge = getStatusBadge(appt.status, appt.isFitIn);
                  const isCancelled = appt.status === 'CANCELLED';

                  return (
                    <TouchableOpacity
                      key={appt.id}
                      style={[styles.slotCard, isCancelled && styles.slotCancelled]}
                      activeOpacity={0.75}
                      onPress={() => {
                        setSelectedAppt(appt);
                        setDetailModalVisible(true);
                      }}>
                      {/* Coluna de Horário */}
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
                        <Text style={[styles.endTimeText, { fontFamily: fontRegular }]}>
                          até {formatTime(appt.endDateTime)}
                        </Text>
                      </View>

                      {/* Conteúdo Central */}
                      <View style={styles.slotMain}>
                        <View style={styles.serviceRow}>
                          <Text
                            style={[
                              styles.serviceName,
                              { fontFamily: fontSemiBold },
                              isCancelled && styles.textCancelled,
                            ]}
                            numberOfLines={1}>
                            {appt.serviceName}
                          </Text>
                          {appt.servicePrice != null && (
                            <Text style={[styles.priceText, { fontFamily: fontBold }]}>
                              R$ {appt.servicePrice.toFixed(2)}
                            </Text>
                          )}
                        </View>

                        <Text style={[styles.clientName, { fontFamily: fontRegular }]} numberOfLines={1}>
                          Cliente: {appt.clientName || 'Cliente avulso'}
                        </Text>

                        {/* Badges */}
                        <View style={styles.badgeRow}>
                          <View
                            style={[
                              styles.badge,
                              { backgroundColor: badge.bg, borderColor: badge.border },
                            ]}>
                            <Text style={[styles.badgeText, { color: badge.color, fontFamily: fontSemiBold }]}>
                              {badge.label}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        ) : (
          /* ─── VISÃO SEMANA ───────────────────────────────────────────────────── */
          <View style={styles.viewContainer}>
            {/* Navegador de Semanas */}
            <View style={styles.dateNavigator}>
              <TouchableOpacity
                style={styles.navArrowBtn}
                onPress={() => handleWeekChange(-1)}>
                <ChevronLeftIcon size={18} color={Colors.dark} />
              </TouchableOpacity>

              <View style={styles.dateCenterCol}>
                <Text style={[styles.navDateTitle, { fontFamily: fontSemiBold }]}>
                  Semana: {weekBounds.days[0].getDate()}/{weekBounds.days[0].getMonth() + 1} a {weekBounds.days[6].getDate()}/{weekBounds.days[6].getMonth() + 1}
                </Text>
                <TouchableOpacity onPress={() => setSelectedDate(toDateString(new Date()))}>
                  <Text style={[styles.todayLink, { fontFamily: fontRegular }]}>
                    Esta semana
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.navArrowBtn, { transform: [{ rotate: '180deg' }] }]}
                onPress={() => handleWeekChange(1)}>
                <ChevronLeftIcon size={18} color={Colors.dark} />
              </TouchableOpacity>
            </View>

            {/* Grade dos 7 Dias da Semana */}
            <View style={styles.weekGrid}>
              {weekBounds.days.map((dayDate) => {
                const dayDateStr = toDateString(dayDate);
                const isSelected = dayDateStr === selectedDate;
                const isToday = dayDateStr === toDateString(new Date());

                // Agendamentos deste dia na semana
                const dayAppts = weekAppointments.filter((a) => a.startDateTime.startsWith(dayDateStr));
                const activeCount = dayAppts.filter((a) => a.status !== 'CANCELLED').length;

                // Bloqueios deste dia
                const dayBlocksCount = blockedTimes.filter((b) => b.startDateTime.startsWith(dayDateStr)).length;

                // Horário de trabalho para este dia
                const dayOfWeekEn = dayOfWeekNamesEn[dayDate.getDay()];
                const dayWh = workingHours.find((w) => w.dayOfWeek === dayOfWeekEn && w.active);

                return (
                  <TouchableOpacity
                    key={dayDateStr}
                    style={[
                      styles.weekDayCard,
                      isSelected && styles.weekDayCardSelected,
                      isToday && styles.weekDayCardToday,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedDate(dayDateStr);
                      setViewMode('day');
                    }}>
                    <View style={styles.weekDayHeader}>
                      <View>
                        <Text style={[styles.weekDayName, { fontFamily: fontSemiBold }]}>
                          {SHORT_DAYS[dayDate.getDay()]}
                        </Text>
                        <Text style={[styles.weekDayNumber, { fontFamily: fontBold }]}>
                          {dayDate.getDate()}
                        </Text>
                      </View>

                      {isToday && (
                        <View style={styles.todayBadge}>
                          <Text style={[styles.todayBadgeText, { fontFamily: fontSemiBold }]}>Hoje</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.weekDayInfo}>
                      {dayWh ? (
                        <Text style={[styles.weekWhText, { fontFamily: fontRegular }]}>
                          ⏰ {dayWh.startTime.slice(0, 5)} - {dayWh.endTime.slice(0, 5)}
                        </Text>
                      ) : (
                        <Text style={[styles.weekWhOff, { fontFamily: fontRegular }]}>
                          Folga
                        </Text>
                      )}

                      <View style={styles.weekStatsRow}>
                        <Text style={[styles.weekApptCount, { fontFamily: fontSemiBold }]}>
                          ✂️ {activeCount} {activeCount === 1 ? 'agendamento' : 'agendamentos'}
                        </Text>
                        {dayBlocksCount > 0 && (
                          <Text style={[styles.weekBlockCount, { fontFamily: fontRegular }]}>
                            🔒 {dayBlocksCount} bloqueio
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal de Detalhes do Agendamento */}
      <AppointmentDetailModal
        visible={detailModalVisible}
        appointment={selectedAppt}
        establishmentId={establishmentId || ''}
        onClose={() => setDetailModalVisible(false)}
        onAppointmentUpdated={loadScheduleData}
        onOpenReschedule={(appt) => {
          setRescheduleAppt(appt);
          setRescheduleModalVisible(true);
        }}
      />

      {/* Modal de Remarcação */}
      <RescheduleModal
        visible={rescheduleModalVisible}
        appointment={rescheduleAppt}
        establishmentId={establishmentId || ''}
        onClose={() => setRescheduleModalVisible(false)}
        onSuccess={loadScheduleData}
      />

      {/* Modal de Novo Agendamento */}
      <CreateAppointmentModal
        visible={createModalVisible}
        establishmentId={establishmentId || ''}
        professionalId={professionalId || ''}
        defaultDate={selectedDate}
        onClose={() => setCreateModalVisible(false)}
        onSuccess={loadScheduleData}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 12,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.grey100,
  },
  toggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 9,
  },
  toggleBtnActive: {
    backgroundColor: Colors.gold,
  },
  toggleText: {
    fontSize: 13,
    color: Colors.grey500,
  },
  toggleTextActive: {
    color: Colors.white,
  },
  newApptBtn: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  newApptBtnText: {
    color: Colors.white,
    fontSize: 13,
  },
  viewContainer: {
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 16,
  },
  dateNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.grey100,
  },
  navArrowBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCenterCol: {
    alignItems: 'center',
    gap: 2,
  },
  navDateTitle: {
    fontSize: 15,
    color: Colors.dark,
  },
  todayLink: {
    fontSize: 12,
    color: Colors.goldDark,
  },
  workingHoursBanner: {
    backgroundColor: '#FEF9EE',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  workingHoursText: {
    fontSize: 13,
    color: Colors.dark,
  },
  workingHoursOff: {
    fontSize: 13,
    color: '#92400E',
  },
  feedbackBox: {
    padding: 24,
    backgroundColor: Colors.white,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.grey100,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 15,
    color: Colors.dark,
    marginTop: 4,
  },
  feedbackText: {
    fontSize: 13,
    color: Colors.grey400,
    textAlign: 'center',
  },
  blockedSection: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    color: Colors.grey500,
    letterSpacing: 0.3,
  },
  blockedCard: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.grey500,
    alignItems: 'center',
    gap: 12,
  },
  blockedTimeCol: {
    alignItems: 'center',
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: Colors.grey200,
  },
  blockedTimeText: {
    fontSize: 13,
    color: Colors.dark,
  },
  blockedInfoCol: {
    flex: 1,
    gap: 2,
  },
  blockedReason: {
    fontSize: 14,
    color: Colors.dark,
  },
  blockedSub: {
    fontSize: 12,
    color: Colors.grey400,
  },
  appointmentsList: {
    gap: 10,
  },
  slotCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.grey100,
    gap: 12,
    alignItems: 'center',
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  slotCancelled: {
    opacity: 0.6,
    backgroundColor: '#FAFAFA',
  },
  timeCol: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
    gap: 3,
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: Colors.grey100,
  },
  timeText: {
    fontSize: 15,
    color: Colors.dark,
  },
  endTimeText: {
    fontSize: 10,
    color: Colors.grey400,
  },
  slotMain: {
    flex: 1,
    gap: 4,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceName: {
    fontSize: 15,
    color: Colors.dark,
    flex: 1,
    marginRight: 6,
  },
  textCancelled: {
    textDecorationLine: 'line-through',
    color: Colors.grey400,
  },
  priceText: {
    fontSize: 14,
    color: Colors.goldDark,
  },
  clientName: {
    fontSize: 13,
    color: Colors.grey500,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
  },
  weekGrid: {
    gap: 10,
  },
  weekDayCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.grey100,
    gap: 8,
  },
  weekDayCardSelected: {
    borderColor: Colors.gold,
    backgroundColor: '#FFFCF5',
  },
  weekDayCardToday: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.gold,
  },
  weekDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weekDayName: {
    fontSize: 12,
    color: Colors.grey400,
    textTransform: 'uppercase',
  },
  weekDayNumber: {
    fontSize: 18,
    color: Colors.dark,
  },
  todayBadge: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  todayBadgeText: {
    color: Colors.white,
    fontSize: 11,
  },
  weekDayInfo: {
    gap: 4,
  },
  weekWhText: {
    fontSize: 12,
    color: Colors.grey500,
  },
  weekWhOff: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  weekStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 2,
  },
  weekApptCount: {
    fontSize: 13,
    color: Colors.dark,
  },
  weekBlockCount: {
    fontSize: 12,
    color: Colors.grey500,
  },
});
