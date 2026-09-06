import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { ProfessionalSelector } from '@/components/admin/ProfessionalSelector';
import { ProfessionalTimeline } from '@/components/admin/ProfessionalTimeline';

import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useEstablishment } from '@/hooks/useEstablishment';
import { useProfessional } from '@/hooks/useProfessionals';
import {
  getEstablishmentAppointments,
  type Appointment,
} from '@/services/appointmentServices';

export default function HomeEmpresaScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { establishmentId, establishmentName, loading: loadingEst, reload: reloadEst } = useEstablishment();

  const [refreshing, setRefreshing] = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(true);

  // Profissionais — dados reais vindos do hook do estabelecimento
  const {
    professionals,
    loading: loadingProfessionals,
    error: errorProfessionals,
    setMode,
  } = useProfessional(establishmentId);

  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(null);

  // Data selecionada (padrão: hoje em formato YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  // Agendamentos reais do backend
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // ─── Carregar agendamentos reais do estabelecimento ──────────────────────
  const loadAppointments = useCallback(async () => {
    if (!establishmentId) {
      setAppointments([]);
      setLoadingAppointments(false);
      return;
    }

    try {
      setLoadingAppointments(true);
      const data = await getEstablishmentAppointments(
        establishmentId,
        selectedDate,
        selectedProfessionalId
      );
      setAppointments(data);
    } catch {
      setAppointments([]);
    } finally {
      setLoadingAppointments(false);
    }
  }, [establishmentId, selectedDate, selectedProfessionalId]);

  // Recarrega sempre que a tela ganha foco ou quando os filtros mudam
  useFocusEffect(
    useCallback(() => {
      if (establishmentId) {
        loadAppointments();
      }
    }, [establishmentId, loadAppointments])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await reloadEst();
    setMode('all');
    setTimeout(() => setMode('active'), 50);
    await loadAppointments();
    setRefreshing(false);
  }

  // ─── Navegação de data ───────────────────────────────────────────────────
  function handleDateChange(deltaDays: number) {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + deltaDays);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
  }

  // ─── Criar Profissional (leva para a aba Equipe) ─────────────────────────
  function handleGoToEquipe() {
    router.push('/(gestor)/equipe' as any);
  }

  // ─── Ação ao tocar num agendamento real ──────────────────────────────────
  function handleSelectAppointment(appt: Appointment) {
    const d = new Date(appt.startDateTime);
    const timeFormatted = !isNaN(d.getTime())
      ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : appt.startDateTime;

    const statusLabel =
      appt.status === 'SCHEDULED'
        ? 'Confirmado'
        : appt.status === 'COMPLETED'
        ? 'Concluído'
        : appt.status === 'CANCELLED'
        ? 'Cancelado'
        : appt.status === 'NO_SHOW'
        ? 'Não compareceu'
        : appt.status;

    Alert.alert(
      'Detalhes do Agendamento',
      `Serviço: ${appt.serviceName}\nProfissional: ${appt.professionalName}\nCliente: ${appt.clientName}\nHorário: ${timeFormatted}\nValor: R$ ${appt.servicePrice ? appt.servicePrice.toFixed(2) : '0.00'}\nStatus: ${statusLabel}${appt.isFitIn ? ' (Encaixe)' : ''}`,
      [{ text: 'Fechar', style: 'cancel' }]
    );
  }

  // ─── Métricas reais calculadas dos agendamentos ──────────────────────────
  const activeAppointments = appointments.filter((a) => a.status !== 'CANCELLED');
  const totalAppointments = activeAppointments.length;
  const activeProfCount = professionals.length;

  const nextScheduled = appointments
    .filter((a) => a.status === 'SCHEDULED')
    .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())[0];

  const nextAppointmentTime = nextScheduled
    ? (() => {
        const d = new Date(nextScheduled.startDateTime);
        return !isNaN(d.getTime())
          ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          : nextScheduled.startDateTime.slice(11, 16);
      })()
    : '--:--';

  const selectedProfObj = professionals.find((p) => p.id === selectedProfessionalId);

  if (loadingEst) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.gold} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || loadingProfessionals}
            onRefresh={handleRefresh}
            tintColor={Colors.gold}
          />
        }>
        {/* Header do Gestor com Métricas Reais */}
        <AdminHeader
          establishmentName={establishmentName}
          managerName={user?.name || 'Gestor'}
          totalAppointments={totalAppointments}
          activeProfessionalsCount={activeProfCount}
          nextAppointmentTime={nextAppointmentTime}
          onSignOut={signOut}
        />

        {/* Barra de Profissionais Reais do Estabelecimento */}
        <ProfessionalSelector
          professionals={professionals}
          selectedId={selectedProfessionalId}
          onSelect={setSelectedProfessionalId}
          onAddPress={handleGoToEquipe}
          isLoading={loadingProfessionals}
          hasError={!!errorProfessionals}
        />

        {/* Timeline da Agenda com Agendamentos Reais do Backend */}
        <ProfessionalTimeline
          selectedDate={selectedDate}
          professionalName={selectedProfObj?.nickname || selectedProfObj?.name}
          appointments={appointments}
          isLoading={loadingAppointments}
          onDateChange={handleDateChange}
          onSelectAppointment={handleSelectAppointment}
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
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    gap: 20,
  },
});
