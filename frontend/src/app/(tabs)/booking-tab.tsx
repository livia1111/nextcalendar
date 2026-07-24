/**
 * Tela: Meus Agendamentos (booking-tab)
 * Exibe os agendamentos do usuário em abas: Próximo · Completo · Cancelado
 * com opções de Cancelar e Pagar/Remarcar.
 */

import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircleIcon, LocationPinIcon, PlusIcon, XIcon } from '@/components/icons';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';
import { getMyBookings, cancelBooking, type Booking } from '@/services/bookingServices'; // ⚠️ confere o nome real do arquivo
import { useAuth } from '@/context/AuthContext';

const TABS = ['Próximo', 'Completo', 'Cancelado'] as const;
type BookingTab = typeof TABS[number];

export default function BookingTabScreen() {
  const { fontRegular, fontSemiBold, fontBold } = useAppFonts();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<BookingTab>('Próximo');
  const [reminders, setReminders] = useState<Record<string, boolean>>({});
  const [cancelModal, setCancelModal] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await getMyBookings(token);
        if (active) setBookings(data);
      } catch (err) {
        if (active) setError('Não foi possível carregar seus agendamentos.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [token]);

  const filtered = bookings.filter(b => {
    if (activeTab === 'Próximo') return b.status === 'upcoming';
    if (activeTab === 'Completo') return b.status === 'done';
    return b.status === 'cancelled';
  });

  function handleCancel(id: string) {
    setCancelModal(id);
  }

  async function confirmCancel() {
    if (!cancelModal) return;
    try {
      await cancelBooking(cancelModal, token);
      setBookings(prev =>
        prev.map(b => (b.id === cancelModal ? { ...b, status: 'cancelled' } : b))
      );
    } catch (err) {
      // TODO: feedback de erro pro usuário (ex: toast)
    } finally {
      setCancelModal(null);
      setCancelSuccess(true);
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { fontFamily: fontBold }]}>Meu Agendamento</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn}>
            <Text style={{ fontSize: 18 }}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Text style={{ fontSize: 18 }}>⋮</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, { fontFamily: fontSemiBold }, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={Colors.gold} style={{ marginTop: 60 }} />
        ) : error ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { fontFamily: fontRegular }]}>{error}</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { fontFamily: fontRegular }]}>
              {activeTab === 'Próximo'
                ? 'Você ainda não tem agendamentos'
                : 'Nenhum agendamento aqui.'}
            </Text>
            {activeTab === 'Próximo' && (
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => router.push('/explore')}>
                <PlusIcon size={18} color={Colors.white} />
                <Text style={[styles.newBookingText, { fontFamily: fontSemiBold }]}>
                  Fazer meu primeiro agendamento
                </Text>
              </TouchableOpacity>
            )}
            
          </View>
        ) : (
          filtered.map(booking => (
            <BookingCard
              key={booking.id}
              booking={booking}
              reminder={reminders[booking.id] ?? false}
              onReminderChange={val => setReminders(r => ({ ...r, [booking.id]: val }))}
              onCancel={() => handleCancel(booking.id)}
              onReschedule={() => router.push('/booking')}
              fontRegular={fontRegular}
              fontSemiBold={fontSemiBold}
            />
          ))
        )}
      </ScrollView>
      
      {/* Novo Agendamento */}
      <TouchableOpacity
        style={styles.newBookingButton}
        onPress={() => router.push('/explore')}>
        <PlusIcon size={18} color={Colors.white} />
        <Text style={[styles.newBookingText, { fontFamily: fontSemiBold }]}>
          Novo Agendamento
        </Text>
      </TouchableOpacity>

      {/* Tabs */}

      {/* Cancel Confirmation Modal */}
      <Modal visible={!!cancelModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setCancelModal(null)}>
              <XIcon size={20} color={Colors.grey500} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { fontFamily: fontBold }]}>Cancelar Agendamento?</Text>
            <Text style={[styles.modalBody, { fontFamily: fontRegular }]}>
              Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.
            </Text>
            <TouchableOpacity style={styles.dangerBtn} onPress={confirmCancel}>
              <Text style={[styles.dangerBtnText, { fontFamily: fontSemiBold }]}>Sim, cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.outlineBtn} onPress={() => setCancelModal(null)}>
              <Text style={[styles.outlineBtnText, { fontFamily: fontSemiBold }]}>Manter reserva</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Cancel Success Modal */}
      <Modal visible={cancelSuccess} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.successCard}>
            <CheckCircleIcon size={72} color={Colors.success} />
            <Text style={[styles.successTitle, { fontFamily: fontBold }]}>Cancelamento efetuado</Text>
            <TouchableOpacity style={styles.goldBtn} onPress={() => setCancelSuccess(false)}>
              <Text style={[styles.goldBtnText, { fontFamily: fontSemiBold }]}>Obrigado</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── BookingCard ─────────────────────────────────────────────────────────────
interface BookingCardProps {
  booking: Booking;
  reminder: boolean;
  onReminderChange: (val: boolean) => void;
  onCancel: () => void;
  onReschedule: () => void;
  fontRegular: string;
  fontSemiBold: string;
}

function BookingCard({
  booking,
  reminder,
  onReminderChange,
  onCancel,
  onReschedule,
  fontRegular,
  fontSemiBold,
}: BookingCardProps) {
  return (
    <View style={cardStyles.card}>
      {booking.status === 'upcoming' && (
        <View style={cardStyles.topRow}>
          <Text style={[cardStyles.dateText, { fontFamily: fontSemiBold }]}>{booking.date}</Text>
          <View style={cardStyles.reminderRow}>
            <Text style={[cardStyles.reminderLabel, { fontFamily: fontRegular }]}>Lembrar</Text>
            <Switch
              value={reminder}
              onValueChange={onReminderChange}
              trackColor={{ false: Colors.grey100, true: Colors.gold }}
              thumbColor={Colors.white}
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
          </View>
        </View>
      )}
      {booking.status !== 'upcoming' && (
        <View style={cardStyles.statusBadgeRow}>
          <Text style={[cardStyles.dateText, { fontFamily: fontSemiBold }]}>{booking.date}</Text>
          <View style={[
            cardStyles.statusBadge,
            { backgroundColor: booking.status === 'done' ? '#E6F9EF' : '#FDECEA' },
          ]}>
            <Text style={[
              cardStyles.statusText,
              { fontFamily: fontSemiBold, color: booking.status === 'done' ? Colors.success : Colors.error },
            ]}>
              {booking.status === 'done' ? 'Concluído' : 'Cancelado'}
            </Text>
          </View>
        </View>
      )}

      <View style={cardStyles.shopRow}>
        <View style={cardStyles.shopAvatar}>
          <Text style={{ fontSize: 18 }}>✂️</Text>
        </View>
        <View style={cardStyles.shopInfo}>
          <Text style={[cardStyles.shopName, { fontFamily: fontSemiBold }]}>{booking.shop}</Text>
          <View style={cardStyles.addrRow}>
            <LocationPinIcon size={12} />
            <Text style={[cardStyles.addrText, { fontFamily: fontRegular }]} numberOfLines={1}>
              {booking.address}
            </Text>
          </View>
        </View>
        <Text style={[cardStyles.price, { fontFamily: fontSemiBold }]}>{booking.price}</Text>
      </View>

      <View style={cardStyles.servicesBox}>
        <Text style={[cardStyles.servicesLabel, { fontFamily: fontSemiBold }]}>Serviços:</Text>
        <Text style={[cardStyles.servicesText, { fontFamily: fontRegular }]}>{booking.services}</Text>
      </View>

      {booking.status === 'upcoming' && (
        <View style={cardStyles.actions}>
          <TouchableOpacity style={cardStyles.cancelBtn} onPress={onCancel}>
            <Text style={[cardStyles.cancelText, { fontFamily: fontSemiBold }]}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={cardStyles.payBtn} onPress={onReschedule}>
            <Text style={[cardStyles.payText, { fontFamily: fontSemiBold }]}>Remarcar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  title: { color: Colors.dark, fontSize: 22 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  newBookingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  newBookingText: { color: Colors.white, fontSize: 14 },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.grey100, paddingHorizontal: 20 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2.5, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.gold },
  tabText: { fontSize: 14, color: Colors.grey400 },
  tabTextActive: { color: Colors.gold },
  list: { paddingHorizontal: 20, paddingTop: 16, gap: 16 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 20 },
  emptyText: { color: Colors.grey400, fontSize: 15 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: Colors.white, borderRadius: 20, padding: 24, width: '100%', gap: 14, alignItems: 'center' },
  modalClose: { alignSelf: 'flex-end', padding: 4 },
  modalTitle: { color: Colors.dark, fontSize: 18, textAlign: 'center' },
  modalBody: { color: Colors.grey500, fontSize: 14, textAlign: 'center', lineHeight: 22 },
  dangerBtn: { width: '100%', height: 50, borderRadius: 12, backgroundColor: Colors.error, alignItems: 'center', justifyContent: 'center' },
  dangerBtnText: { color: Colors.white, fontSize: 15 },
  outlineBtn: { width: '100%', height: 50, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.grey200, alignItems: 'center', justifyContent: 'center' },
  outlineBtnText: { color: Colors.grey500, fontSize: 15 },
  successCard: { backgroundColor: Colors.white, borderRadius: 20, padding: 32, width: '100%', alignItems: 'center', gap: 20 },
  successTitle: { color: Colors.dark, fontSize: 20, textAlign: 'center' },
  goldBtn: { width: '100%', height: 50, borderRadius: 12, backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center' },
  goldBtnText: { color: Colors.white, fontSize: 15 },
});

const cardStyles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 14 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBadgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateText: { color: Colors.dark, fontSize: 13 },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reminderLabel: { color: Colors.grey400, fontSize: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 12 },
  shopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  shopAvatar: { width: 48, height: 48, borderRadius: 12, backgroundColor: Colors.goldLight, alignItems: 'center', justifyContent: 'center' },
  shopInfo: { flex: 1, gap: 3 },
  shopName: { color: Colors.dark, fontSize: 15 },
  addrRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  addrText: { color: Colors.grey400, fontSize: 12, flex: 1 },
  price: { color: Colors.gold, fontSize: 15 },
  servicesBox: { backgroundColor: Colors.white, borderRadius: 10, padding: 12, gap: 3 },
  servicesLabel: { color: Colors.dark, fontSize: 12 },
  servicesText: { color: Colors.grey500, fontSize: 13, lineHeight: 19 },
  actions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, height: 44, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.grey200, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: Colors.grey500, fontSize: 13 },
  payBtn: { flex: 1, height: 44, borderRadius: 10, backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center' },
  payText: { color: Colors.white, fontSize: 13 },
});