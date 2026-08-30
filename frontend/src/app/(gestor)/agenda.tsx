import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { ProfessionalSelector } from '@/components/admin/ProfessionalSelector';
import { ProfessionalTimeline } from '@/components/admin/ProfessionalTimeline';

import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useEstablishment } from '@/hooks/useEstablishment';
import { useProfessional } from '@/hooks/useProfessionals';
import {
  getAgendaByDate,
  type AgendaSlot,
  blockSlot,
} from '@/services/agendaServices';

export default function AgendaScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, token, signOut } = useAuth();
  const { establishmentId, establishmentName, loading, reload } = useEstablishment();

  const [refreshing, setRefreshing] = useState(false);

  // Profissionais — dados reais vindos do hook (busca no backend)
  const {
    professionals,
    loading: loadingProfessionals,
    error: errorProfessionals,
  } = useProfessional(establishmentId);

  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(null);

  // Agenda / Timeline
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [slots, setSlots] = useState<AgendaSlot[]>([]);

  async function loadAgenda(dateStr: string, profId: string | null) {
    try {
      const data = await getAgendaByDate(dateStr, profId || undefined, token);
      setSlots(data);
    } catch {
      setSlots([]);
    }
  }

  // Recarrega agenda quando muda profissional ou data (só depois de ter o estab.)
  useEffect(() => {
    if (!loading && establishmentId) {
      loadAgenda(selectedDate, selectedProfessionalId);
    }
  }, [selectedDate, selectedProfessionalId, loading, establishmentId]);

  async function handleRefresh() {
    setRefreshing(true);
    await reload();
    await loadAgenda(selectedDate, selectedProfessionalId);
    setRefreshing(false);
  }

  // ─── Navegação de data ───────────────────────────────────────────────────
  function handleDateChange(deltaDays: number) {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + deltaDays);
    setSelectedDate(date.toISOString().split('T')[0]);
  }

  // ─── Criar Profissional (cadastro fica na aba Equipe) ─────────────────────
  function handleGoToEquipe() {
    router.push('/(gestor)/equipe' as any);
  }

  // ─── Ação no Slot ────────────────────────────────────────────────────────
  function handleSelectSlot(slot: AgendaSlot) {
    if (slot.status === 'confirmed') {
      Alert.alert(
        'Detalhes do Agendamento',
        `Cliente: ${slot.clientName}\nServiço: ${slot.service}\nHorário: ${slot.time}`,
        [
          { text: 'Fechar', style: 'cancel' },
          {
            text: 'Notificar WhatsApp',
            onPress: () => Alert.alert('Lembrete', 'Mensagem enviada ao cliente via WhatsApp!'),
          },
        ]
      );
    } else if (slot.status === 'free') {
      Alert.alert('Gerenciar Horário', `Horário das ${slot.time}`, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Bloquear Horário',
          style: 'destructive',
          onPress: async () => {
            await blockSlot(slot.id, token);
            setSlots((prev) =>
              prev.map((s) => (s.id === slot.id ? { ...s, status: 'blocked' } : s))
            );
          },
        },
      ]);
    } else if (slot.status === 'blocked') {
      Alert.alert('Desbloquear', `Deseja liberar o horário das ${slot.time}?`, [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Liberar',
          onPress: () => {
            setSlots((prev) =>
              prev.map((s) => (s.id === slot.id ? { ...s, status: 'free' } : s))
            );
          },
        },
      ]);
    }
  }

  // Métricas calculadas
  const totalAppointments = slots.filter(
    (s) => s.status === 'confirmed' || s.status === 'encaixe'
  ).length;
  const activeProfCount = professionals.length;
  const nextConfirmed = slots.find((s) => s.status === 'confirmed')?.time || '--:--';

  const selectedProfObj = professionals.find((p) => p.id === selectedProfessionalId);

  if (loading) {
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
        {/* Header do Gestor */}
        <AdminHeader
          establishmentName={establishmentName}
          managerName={user?.name || 'Gestor'}
          totalAppointments={totalAppointments}
          activeProfessionalsCount={activeProfCount}
          nextAppointmentTime={nextConfirmed}
          onSignOut={signOut}
        />

        {/* Barra de Profissionais — seleciona de quem ver a agenda */}
        <ProfessionalSelector
          professionals={professionals}
          selectedId={selectedProfessionalId}
          onSelect={setSelectedProfessionalId}
          onAddPress={handleGoToEquipe}
          isLoading={loadingProfessionals}
          hasError={!!errorProfessionals}
        />

        {/* Timeline da Agenda */}
        <ProfessionalTimeline
          selectedDate={selectedDate}
          professionalName={selectedProfObj?.nickname || selectedProfObj?.name}
          slots={slots}
          onDateChange={handleDateChange}
          onSelectSlot={handleSelectSlot}
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
