import { useCallback, useEffect, useState } from 'react';
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
import { AddProfessionalModal } from '@/components/admin/AddProfessionalModal';
import { ServiceSelector } from '@/components/admin/ServiceSelector';
import { AddServiceModal } from '@/components/admin/AddServiceModal';

import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { getEstablishmentByOwner } from '@/services/establishmentServices';
import {
  createProfessional,
  type ProfessionalCreateInput,
} from '@/services/professionalServices';
import {
  getServices,
  createService,
  type ServiceResponse,
  type ServiceCreatePayload,
} from '@/services/serviceServices';
import {
  getAgendaByDate,
  type AgendaSlot,
  blockSlot,
} from '@/services/agendaServices';
import { useProfessional } from '@/hooks/useProfessionals';

export default function EmpresaHomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, token, signOut } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estabelecimento
  const [establishmentId, setEstablishmentId] = useState<string>('');
  const [establishmentName, setEstablishmentName] = useState<string>('Minha Barbearia');

  // Profissionais — dados reais vindos do hook (busca no backend)
  const {
    professionals,
    loading: loadingProfessionals,
    error: errorProfessionals,
    mode,
    setMode,
  } = useProfessional(establishmentId);

  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(null);

  // Serviços — dados reais vindos do backend
  const [services, setServices] = useState<ServiceResponse[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [errorServices, setErrorServices] = useState(false);
  const [serviceModalVisible, setServiceModalVisible] = useState(false);

  // Agenda / Timeline
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [slots, setSlots] = useState<AgendaSlot[]>([]);

  // Modal Novo Profissional
  const [modalVisible, setModalVisible] = useState(false);

  // ─── Carregar dados iniciais (estabelecimento) ─────────────────────────────
  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const est = await getEstablishmentByOwner(user.id);
      setEstablishmentId(est.id);
      setEstablishmentName(est.name || 'Minha Barbearia');
    } catch {
      // mantém fallback; o hook receberá establishmentId vazio e não fará chamadas
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  async function loadAgenda(dateStr: string, profId: string | null) {
    try {
      const data = await getAgendaByDate(dateStr, profId || undefined, token);
      setSlots(data);
    } catch {
      setSlots([]);
    }
  }

  async function loadServices(estId: string) {
    setLoadingServices(true);
    setErrorServices(false);
    try {
      const page = await getServices(estId);
      setServices(page.content);
    } catch {
      setErrorServices(true);
    } finally {
      setLoadingServices(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Recarrega agenda quando muda profissional ou data (só depois de ter o estab.)
  useEffect(() => {
    if (!loading && establishmentId) {
      loadAgenda(selectedDate, selectedProfessionalId);
    }
  }, [selectedDate, selectedProfessionalId, loading, establishmentId]);

  // Carrega os serviços assim que o estabelecimento estiver disponível
  useEffect(() => {
    if (!loading && establishmentId) {
      loadServices(establishmentId);
    }
  }, [loading, establishmentId]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  // ─── Navegação de data ───────────────────────────────────────────────────
  function handleDateChange(deltaDays: number) {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + deltaDays);
    setSelectedDate(date.toISOString().split('T')[0]);
  }

  // ─── Criar Profissional ───────────────────────────────────────────────────
  async function handleCreateProfessional(input: ProfessionalCreateInput) {
    const targetEstId = establishmentId || user?.id || '';
    if (!targetEstId) {
      Alert.alert('Erro', 'Estabelecimento não encontrado. Tente novamente.');
      return;
    }
    try {
      await createProfessional(targetEstId, input);
      Alert.alert('Sucesso', `Profissional ${input.name} cadastrado com sucesso!`);
      // O hook buscará a lista atualizada automaticamente (re-fetch por side-effect)
      setMode('all'); // força re-fetch
      setTimeout(() => setMode('active'), 100);
    } catch {
      Alert.alert('Erro', 'Não foi possível cadastrar o profissional. Tente novamente.');
    }
  }

  // ─── Criar Serviço ──────────────────────────────────────────────────────────
  async function handleCreateService(input: ServiceCreatePayload) {
    const targetEstId = establishmentId || user?.id || '';
    if (!targetEstId) {
      Alert.alert('Erro', 'Estabelecimento não encontrado. Tente novamente.');
      return;
    }
    try {
      await createService(targetEstId, input);
      Alert.alert('Sucesso', `Serviço ${input.name} cadastrado com sucesso!`);
      await loadServices(targetEstId);
    } catch {
      Alert.alert('Erro', 'Não foi possível cadastrar o serviço. Tente novamente.');
    }
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

  // Loading enquanto busca o estabelecimento
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
          { paddingBottom: insets.bottom + 40 },
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

        {/* Barra de Profissionais — dados reais do backend */}
        <ProfessionalSelector
          professionals={professionals}
          selectedId={selectedProfessionalId}
          onSelect={setSelectedProfessionalId}
          onAddPress={() => setModalVisible(true)}
          isLoading={loadingProfessionals}
          hasError={!!errorProfessionals}
        />

        {/* Catálogo de Serviços — dados reais do backend */}
        <ServiceSelector
          services={services}
          onAddPress={() => setServiceModalVisible(true)}
          isLoading={loadingServices}
          hasError={errorServices}
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

      {/* Modal de Cadastro de Profissional */}
      <AddProfessionalModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleCreateProfessional}
      />

      {/* Modal de Cadastro de Serviço */}
      <AddServiceModal
        visible={serviceModalVisible}
        onClose={() => setServiceModalVisible(false)}
        onSubmit={handleCreateService}
      />
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
