/**
 * Tela Home — Visão do cliente no modelo Single-Tenant.
 *
 * Dados carregados do backend:
 *  1. Agendamentos do cliente → getMyBookings()  [bookingServices.ts]
 *  2. Serviços do tenant      → getServices()    [serviceServices.ts]
 *  3. Profissionais ativos    → useProfessional() [hooks/useProfessionals.ts]
 *
 * TODO: Quando o vínculo cliente↔tenant estiver definido,
 *       substituir `currentTenantId = user?.id` pelo tenantId real
 *       vindo do AuthContext ou de um contexto de tenant dedicado.
 */

import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';

import { BellIcon, LocationPinIcon } from '@/components/icons';
import { NextBookingCard } from '@/components/ui/NextBookingCard';
import { LoyaltyCard } from '@/components/ui/LoyaltyCard';
import { ServicesList } from '@/components/ui/ServicesList';
import { QuickBookingSection } from '@/components/ui/QuickBookingSection';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';
import { useAuth } from '@/context/AuthContext';
import { useProfessional } from '@/hooks/useProfessionals';

import { getMyBookings, type Booking } from '@/services/bookingServices';
import { getServices, type ServiceResponse } from '@/services/serviceServices';

export default function HomeScreen() {
  const { fontSemiBold } = useAppFonts();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { user, token, signOut } = useAuth();

  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Estado: Agendamentos ─────────────────────────────────────────────────
  const [nextBooking, setNextBooking] = useState<Booking | null>(null);
  const [completedBookingsCount, setCompletedBookingsCount] = useState(0);

  // ── Estado: Serviços do Tenant ───────────────────────────────────────────
  const [services, setServices] = useState<ServiceResponse[]>([]);

  // ── Estado: Profissional selecionado para agendamento rápido ─────────────
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(null);

  // TODO: substituir pelo tenantId real quando o vínculo cliente↔tenant estiver definido
  const currentTenantId = user?.id ?? '';
  // TODO: buscar o nome real do estabelecimento via API (ex: getEstablishmentByOwner)
  const tenantName = 'Estabelecimento';

  // ── Profissionais ativos do estabelecimento (dados reais do backend) ──────
  const {
    professionals,
    loading: loadingProfessionals,
  } = useProfessional(currentTenantId);

  // ── Carregamento de dados ────────────────────────────────────────────────
  async function loadHomeData() {
    // 1. Agendamentos do cliente
    try {
      const bookings = await getMyBookings(token);
      setNextBooking(bookings.find((b) => b.status === 'upcoming') ?? null);
      setCompletedBookingsCount(bookings.filter((b) => b.status === 'done').length);
    } catch {
      setNextBooking(null);
      setCompletedBookingsCount(0);
    }

    // 2. Serviços cadastrados no estabelecimento
    if (!currentTenantId) {
      setServices([]);
      return;
    }

    try {
      const page = await getServices(currentTenantId);
      setServices(page?.content ?? []);
    } catch {
      setServices([]);
    }
  }

  useEffect(() => {
    setInitialLoading(true);
    loadHomeData().finally(() => setInitialLoading(false));
  }, [token, currentTenantId]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadHomeData();
    setRefreshing(false);
  }

  function handleStartBooking() {
    router.push('/scheduling/agenda-do-profissional' as any);
  }

  // ── Render: loading inicial ──────────────────────────────────────────────
  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={[Colors.gold, Colors.goldDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerContainer, { paddingTop: insets.top + 16 }]}>
          <View style={styles.header}>
            <Text style={[styles.greeting, { fontFamily: fontSemiBold }]}>
              Olá, {user?.name?.split(' ')[0] || 'Cliente'} 👋
            </Text>
          </View>
        </LinearGradient>
        <ActivityIndicator color={Colors.gold} size="large" style={{ marginTop: 60 }} />
      </View>
    );
  }

  // ── Render: tela principal ───────────────────────────────────────────────
  return (
    <View style={styles.root}>
      {/* Header dourado com degradê */}
      <LinearGradient
        colors={[Colors.gold, Colors.goldDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerContainer, { paddingTop: insets.top + 16 }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.tenantRow}>
              <LocationPinIcon size={14} color={Colors.white} />
              <Text style={[styles.tenantName, { fontFamily: fontSemiBold }]}>
                {tenantName}
              </Text>
            </View>
            <Text style={[styles.greeting, { fontFamily: fontSemiBold }]}>
              Olá, {user?.name?.split(' ')[0] || 'Cliente'} 👋
            </Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton} accessibilityLabel="Notificações">
              <BellIcon size={20} color={Colors.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={signOut}
              accessibilityLabel="Sair da conta">
              <Text style={[styles.logoutText, { fontFamily: fontSemiBold }]}>Sair</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Conteúdo rolável */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.gold} />
        }>

        {/* 1. Próximo Agendamento (ou estado vazio) */}
        <NextBookingCard booking={nextBooking} onNewBookingPress={handleStartBooking} />

        {/* 2. Pontos de Fidelidade — calculados pelo total de atendimentos concluídos */}
        {/* TODO: definir regra de pontuação e bonificação com o time de produto */}
        <LoyaltyCard
          currentPoints={completedBookingsCount}
          targetPoints={10}
          rewardDescription="1 Corte Grátis ou Tratos VIP"
        />

        {/* 3. Agendamento Rápido — profissionais ativos vindos do backend */}
        {loadingProfessionals ? (
          <View style={styles.profLoadingBox}>
            <ActivityIndicator size="small" color={Colors.gold} />
          </View>
        ) : (
          <QuickBookingSection
            professionals={professionals}
            selectedProfessionalId={selectedProfessionalId}
            onSelectProfessional={setSelectedProfessionalId}
            onStartBooking={handleStartBooking}
          />
        )}

        {/* 4. Catálogo de Serviços do Estabelecimento */}
        <ServicesList
          services={services}
          onSelectService={() => handleStartBooking()}
        />

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.white },
  loadingContainer: { flex: 1, backgroundColor: Colors.white },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 20 },
  profLoadingBox: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
  },

  // Header
  headerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { gap: 4, flex: 1 },
  tenantRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  tenantName: { color: Colors.white, fontSize: 13, opacity: 0.85 },
  greeting: { color: Colors.white, fontSize: 20 },
  headerRight: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  iconButton: {
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: { color: Colors.white, fontSize: 12 },
});
