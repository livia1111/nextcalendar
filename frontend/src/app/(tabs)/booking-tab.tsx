/**
 * Tela: Meus Agendamentos (booking-tab)
 *
 * Exibe os agendamentos do usuário em abas:
 * Próximo · Completo · Cancelado
 *
 * com opções de Cancelar e Remarcar.
 */

import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CheckCircleIcon,
  LocationPinIcon,
  PlusIcon,
  XIcon,
} from '@/components/icons';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';
import { type Booking } from '@/services/bookingServices';
import {
  getClientAppointments,
  cancelAppointment,
  type Appointment,
} from '@/services/appointmentServices';
import { getClientByUserId } from '@/services/clientServices';
import { useAuth } from '@/context/AuthContext';
import { useEstablishment } from '@/hooks/useEstablishment';

const TABS = ['Próximo', 'Completo', 'Cancelado'] as const;

type BookingTab = typeof TABS[number];

function formatAppointmentToBooking(appt: Appointment): Booking {
  const d = new Date(appt.startDateTime);

  const dateFormatted = !isNaN(d.getTime())
    ? d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }) +
      ' às ' +
      d.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : appt.startDateTime;

  /*
   * Classificação de status:
   *
   * 1. Cancelado sempre fica como 'cancelled'.
   * 2. Se a data/hora já passou, passa para 'done'.
   * 3. Se ainda é futuro, fica como 'upcoming'.
   */
  const isPast = !isNaN(d.getTime())
    ? d.getTime() <= Date.now()
    : false;

  const computedStatus: Booking['status'] =
    appt.status === 'CANCELLED'
      ? 'cancelled'
      : isPast || appt.status === 'COMPLETED'
      ? 'done'
      : 'upcoming';

  return {
    id: appt.id,
    date: dateFormatted,
    time: !isNaN(d.getTime())
      ? d.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '',
    shop: appt.professionalName || 'Profissional',
    address: 'Atendimento',
    services: appt.serviceName || 'Serviço',
    price:
      appt.servicePrice != null
        ? `R$ ${appt.servicePrice.toFixed(2)}`
        : 'R$ 0,00',
    status: computedStatus,

    // Campos extras para remarcação e controle de prazo.
    startDateTimeRaw: appt.startDateTime,
    professionalId: appt.professionalId,
    serviceId: appt.serviceId,
  };
}

export default function BookingTabScreen() {
  const { fontRegular, fontSemiBold, fontBold } = useAppFonts();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  /*
   * Tenant atual.
   *
   * Mantido conforme a implementação atual do projeto.
   */
  const establishmentId  = 'dd7460ab-eca5-41b1-a9d6-86fb4661bc97';

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] =
    useState<BookingTab>('Próximo');

  const [reminders, setReminders] =
    useState<Record<string, boolean>>({});

  /*
   * ID do agendamento que está aguardando confirmação.
   */
  const [cancelModal, setCancelModal] =
    useState<string | null>(null);

  /*
   * Modal de sucesso.
   */
  const [cancelSuccess, setCancelSuccess] =
    useState(false);

  /*
   * Impede múltiplos cliques enquanto a API está processando.
   */
  const [isCancelling, setIsCancelling] =
    useState(false);

  /*
   * Valor usado para executar a animação do sucesso.
   */
  const [cancelAnimation] =
    useState(new Animated.Value(0));

  /**
   * Carrega os agendamentos do cliente.
   *
   * Essa função é chamada:
   * - quando a tela entra em foco;
   * - quando o usuário volta para a booking-tab;
   * - depois de outras operações que retornam para esta tela.
   */
  const loadBookings = useCallback(async () => {
    if (!user?.id) {
      setBookings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const client = await getClientByUserId(user.id);

      if (client?.id) {
        const data = await getClientAppointments(
          establishmentId,
          client.id
        );

        setBookings(
          data.map(formatAppointmentToBooking)
        );
      } else {
        setBookings([]);
      }
    } catch (err) {
      console.error(
        '[BOOKING TAB] Erro ao carregar agendamentos:',
        err
      );

      setError(
        'Não foi possível carregar seus agendamentos.'
      );
    } finally {
      setLoading(false);
    }
  }, [user?.id, establishmentId]);

  /**
   * Sempre que a booking-tab recebe foco,
   * consulta novamente o backend.
   *
   * Isso garante que alterações feitas em outras telas
   * sejam refletidas quando o usuário voltar para cá.
   */
  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [loadBookings])
  );

  /**
   * Filtragem das abas.
   *
   * Próximo:
   * somente agendamentos futuros.
   *
   * Completo:
   * agendamentos não cancelados cujo horário já passou
   * ou que foram concluídos.
   *
   * Cancelado:
   * somente CANCELLED.
   */
  const filtered = bookings.filter((b) => {
    if (b.status === 'cancelled') {
      return activeTab === 'Cancelado';
    }

    if (activeTab === 'Cancelado') {
      return false;
    }

    const isFuture = b.startDateTimeRaw
      ? new Date(b.startDateTimeRaw).getTime() >
        Date.now()
      : b.status === 'upcoming';

    if (activeTab === 'Próximo') {
      return isFuture;
    }

    if (activeTab === 'Completo') {
      return !isFuture;
    }

    return false;
  });

  /**
   * Abre o modal de confirmação.
   */
  function handleCancel(id: string) {
    setCancelModal(id);
  }

  /**
   * Confirma o cancelamento.
   *
   * Fluxo:
   *
   * 1. Chama o backend.
   * 2. Aguarda confirmação.
   * 3. Remove imediatamente da lista local.
   * 4. Abre o modal de sucesso.
   * 5. Executa a animação.
   *
   * Se o backend falhar:
   * - o agendamento NÃO é removido;
   * - o modal de sucesso NÃO aparece.
   */
  async function confirmCancel() {
    if (!cancelModal || isCancelling) {
      return;
    }

    const idToCancel = cancelModal;

    try {
      setIsCancelling(true);

      /*
       * Primeiro confirma no backend.
       */
      await cancelAppointment(
        establishmentId,
        idToCancel
      );

      /*
       * Backend confirmou o cancelamento.
       *
       * Remove imediatamente da lista local.
       */
      setBookings((prev) =>
        prev.filter((b) => b.id !== idToCancel)
      );

      /*
       * Remove também qualquer lembrete associado
       * ao agendamento cancelado.
       */
      setReminders((prev) => {
        const next = { ...prev };
        delete next[idToCancel];
        return next;
      });

      /*
       * Finaliza estado de loading.
       */
      setIsCancelling(false);

      /*
       * Fecha o modal de confirmação.
       */
      setCancelModal(null);

      /*
       * Reseta a animação antes de começar.
       */
      cancelAnimation.setValue(0);

      /*
       * Abre o modal de sucesso.
       */
      setCancelSuccess(true);

      /*
       * Executa a animação:
       *
       * começa pequeno e cresce até o tamanho normal,
       * dando o efeito de confirmação.
       */
      Animated.timing(cancelAnimation, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(
          Easing.back(1.5)
        ),
        useNativeDriver: true,
      }).start();
    } catch (err) {
      console.error(
        '[BOOKING TAB] Erro ao cancelar agendamento:',
        err
      );

      setIsCancelling(false);

      /*
       * O agendamento permanece na lista.
       */
      setCancelModal(null);
    }
  }

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text
          style={[
            styles.title,
            {
              fontFamily: fontBold,
            },
          ]}
        >
          Meu Agendamento
        </Text>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn}>
            <Text style={{ fontSize: 18 }}>
              🔍
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn}>
            <Text style={{ fontSize: 18 }}>
              ⋮
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab &&
                styles.tabActive,
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                {
                  fontFamily: fontSemiBold,
                },
                activeTab === tab &&
                  styles.tabTextActive,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <ScrollView
        contentContainerStyle={[
          styles.list,
          {
            paddingBottom:
              insets.bottom + 90,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator
            color={Colors.gold}
            style={{
              marginTop: 60,
            }}
          />
        ) : error ? (
          <View style={styles.empty}>
            <Text
              style={[
                styles.emptyText,
                {
                  fontFamily: fontRegular,
                },
              ]}
            >
              {error}
            </Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text
              style={[
                styles.emptyText,
                {
                  fontFamily: fontRegular,
                },
              ]}
            >
              {activeTab === 'Próximo'
                ? 'Você ainda não tem agendamentos'
                : 'Nenhum agendamento aqui.'}
            </Text>
          </View>
        ) : (
          filtered.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              reminder={
                reminders[booking.id] ??
                false
              }
              onReminderChange={(val) =>
                setReminders((r) => ({
                  ...r,
                  [booking.id]: val,
                }))
              }
              onCancel={() =>
                handleCancel(booking.id)
              }
              onReschedule={() =>
                router.push({
                  pathname:
                    '../scheduling/buscar-horario',
                  params: {
                    mode: 'reschedule',
                    appointmentId:
                      booking.id,
                    establishmentId:
                      establishmentId,
                    professionalId:
                      booking.professionalId ??
                      '',
                    serviceId:
                      booking.serviceId ??
                      '',
                    startDateTime:
                      booking.startDateTimeRaw ??
                      '',
                  },
                })
              }
              fontRegular={fontRegular}
              fontSemiBold={fontSemiBold}
            />
          ))
        )}
      </ScrollView>

      {/* Novo Agendamento */}
      <TouchableOpacity
        style={styles.newBookingButton}
        onPress={() =>
          router.push(
            '../scheduling/buscar-horario'
          )
        }
      >
        <PlusIcon
          size={18}
          color={Colors.white}
        />

        <Text
          style={[
            styles.newBookingText,
            {
              fontFamily: fontSemiBold,
            },
          ]}
        >
          Novo Agendamento
        </Text>
      </TouchableOpacity>

      {/* ========================================================= */}
      {/* MODAL DE CONFIRMAÇÃO DO CANCELAMENTO */}
      {/* ========================================================= */}

      <Modal
        visible={!!cancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isCancelling) {
            setCancelModal(null);
          }
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => {
                if (!isCancelling) {
                  setCancelModal(null);
                }
              }}
              disabled={isCancelling}
            >
              <XIcon
                size={20}
                color={Colors.grey500}
              />
            </TouchableOpacity>

            <Text
              style={[
                styles.modalTitle,
                {
                  fontFamily: fontBold,
                },
              ]}
            >
              Cancelar Agendamento?
            </Text>

            <Text
              style={[
                styles.modalBody,
                {
                  fontFamily: fontRegular,
                },
              ]}
            >
              Tem certeza que deseja cancelar
              este agendamento? Esta ação não
              pode ser desfeita.
            </Text>

            {/* Confirmar cancelamento */}
            <TouchableOpacity
              style={[
                styles.dangerBtn,
                isCancelling &&
                  styles.dangerBtnDisabled,
              ]}
              onPress={confirmCancel}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <ActivityIndicator
                  color={Colors.white}
                />
              ) : (
                <Text
                  style={[
                    styles.dangerBtnText,
                    {
                      fontFamily:
                        fontSemiBold,
                    },
                  ]}
                >
                  Sim, cancelar
                </Text>
              )}
            </TouchableOpacity>

            {/* Manter reserva */}
            <TouchableOpacity
              style={styles.outlineBtn}
              onPress={() =>
                setCancelModal(null)
              }
              disabled={isCancelling}
            >
              <Text
                style={[
                  styles.outlineBtnText,
                  {
                    fontFamily:
                      fontSemiBold,
                  },
                ]}
              >
                Manter reserva
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL DE SUCESSO DO CANCELAMENTO */}
      {/* ========================================================= */}

      <Modal
        visible={cancelSuccess}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setCancelSuccess(false)
        }
      >
        <View style={styles.overlay}>
          <View style={styles.successCard}>
            {/* Ícone animado */}
            <Animated.View
              style={{
                transform: [
                  {
                    scale:
                      cancelAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [
                          0.4,
                          1,
                        ],
                      }),
                  },
                ],
                opacity:
                  cancelAnimation,
              }}
            >
              <View
                style={
                  styles.successIconCircle
                }
              >
                <CheckCircleIcon
                  size={72}
                  color={Colors.success}
                />
              </View>
            </Animated.View>

            {/* Texto animado */}
            <Animated.View
              style={{
                opacity:
                  cancelAnimation,
                transform: [
                  {
                    translateY:
                      cancelAnimation.interpolate(
                        {
                          inputRange: [
                            0,
                            1,
                          ],
                          outputRange: [
                            15,
                            0,
                          ],
                        }
                      ),
                  },
                ],
              }}
            >
              <Text
                style={[
                  styles.successTitle,
                  {
                    fontFamily: fontBold,
                  },
                ]}
              >
                Cancelamento efetuado
                com sucesso!
              </Text>
            </Animated.View>

            {/* Continuar */}
            <TouchableOpacity
              style={styles.goldBtn}
              onPress={() =>
                setCancelSuccess(false)
              }
            >
              <Text
                style={[
                  styles.goldBtnText,
                  {
                    fontFamily:
                      fontSemiBold,
                  },
                ]}
              >
                Continuar
              </Text>
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
  /**
   * Só é permitido remarcar ou cancelar quando
   * faltam MAIS de 2 horas para o horário.
   *
   * Exatamente 2 horas ou menos:
   * operação bloqueada.
   *
   * Se não houver startDateTimeRaw ou se o horário
   * já passou, também bloqueia por segurança.
   */
  const canReschedule =
    !!booking.startDateTimeRaw &&
    new Date(
      booking.startDateTimeRaw
    ).getTime() -
      Date.now() >
      2 * 60 * 60 * 1000;

  const canCancel =
    !!booking.startDateTimeRaw &&
    new Date(
      booking.startDateTimeRaw
    ).getTime() -
      Date.now() >
      2 * 60 * 60 * 1000;

  return (
    <View style={cardStyles.card}>
      {/* Próximo */}
      {booking.status === 'upcoming' && (
        <View style={cardStyles.topRow}>
          <Text
            style={[
              cardStyles.dateText,
              {
                fontFamily:
                  fontSemiBold,
              },
            ]}
          >
            {booking.date}
          </Text>

          <View
            style={
              cardStyles.reminderRow
            }
          >
            <Text
              style={[
                cardStyles.reminderLabel,
                {
                  fontFamily:
                    fontRegular,
                },
              ]}
            >
              Lembrar
            </Text>

            <Switch
              value={reminder}
              onValueChange={
                onReminderChange
              }
              trackColor={{
                false:
                  Colors.grey100,
                true: Colors.gold,
              }}
              thumbColor={Colors.white}
              style={{
                transform: [
                  {
                    scaleX: 0.8,
                  },
                  {
                    scaleY: 0.8,
                  },
                ],
              }}
            />
          </View>
        </View>
      )}

      {/* Completo / Cancelado */}
      {booking.status !== 'upcoming' && (
        <View
          style={
            cardStyles.statusBadgeRow
          }
        >
          <Text
            style={[
              cardStyles.dateText,
              {
                fontFamily:
                  fontSemiBold,
              },
            ]}
          >
            {booking.date}
          </Text>

          <View
            style={[
              cardStyles.statusBadge,
              {
                backgroundColor:
                  booking.status ===
                  'done'
                    ? '#E6F9EF'
                    : '#FDECEA',
              },
            ]}
          >
            <Text
              style={[
                cardStyles.statusText,
                {
                  fontFamily:
                    fontSemiBold,
                  color:
                    booking.status ===
                    'done'
                      ? Colors.success
                      : Colors.error,
                },
              ]}
            >
              {booking.status ===
              'done'
                ? 'Concluído'
                : 'Cancelado'}
            </Text>
          </View>
        </View>
      )}

      {/* Profissional */}
      <View style={cardStyles.shopRow}>
        <View
          style={
            cardStyles.shopAvatar
          }
        >
          <Text
            style={{
              fontSize: 18,
            }}
          >
            ✂️
          </Text>
        </View>

        <View
          style={cardStyles.shopInfo}
        >
          <Text
            style={[
              cardStyles.shopName,
              {
                fontFamily:
                  fontSemiBold,
              },
            ]}
          >
            {booking.shop}
          </Text>

          <View
            style={cardStyles.addrRow}
          >
            <LocationPinIcon
              size={12}
            />

            <Text
              style={[
                cardStyles.addrText,
                {
                  fontFamily:
                    fontRegular,
                },
              ]}
              numberOfLines={1}
            >
              {booking.address}
            </Text>
          </View>
        </View>

        <Text
          style={[
            cardStyles.price,
            {
              fontFamily:
                fontSemiBold,
            },
          ]}
        >
          {booking.price}
        </Text>
      </View>

      {/* Serviço */}
      <View
        style={
          cardStyles.servicesBox
        }
      >
        <Text
          style={[
            cardStyles.servicesLabel,
            {
              fontFamily:
                fontSemiBold,
            },
          ]}
        >
          Serviços:
        </Text>

        <Text
          style={[
            cardStyles.servicesText,
            {
              fontFamily:
                fontRegular,
            },
          ]}
        >
          {booking.services}
        </Text>
      </View>

      {/* Ações */}
      {booking.status === 'upcoming' && (
        <View style={cardStyles.actions}>
          {/* Cancelar */}
          <TouchableOpacity
            style={[
              cardStyles.cancelBtn,
              !canCancel &&
                cardStyles.cancelBtnDisabled,
            ]}
            onPress={
              canCancel
                ? onCancel
                : undefined
            }
            disabled={!canCancel}
          >
            <Text
              style={[
                cardStyles.cancelText,
                {
                  fontFamily:
                    fontSemiBold,
                },
              ]}
            >
              Cancelar
            </Text>

            {!canCancel && (
              <Text
                style={[
                  cardStyles.cancelHint,
                  {
                    fontFamily:
                      fontRegular,
                  },
                ]}
              >
                Prazo encerrado
              </Text>
            )}
          </TouchableOpacity>

          {/* Remarcar */}
          <TouchableOpacity
            style={[
              cardStyles.payBtn,
              !canReschedule &&
                cardStyles.payBtnDisabled,
            ]}
            onPress={
              canReschedule
                ? onReschedule
                : undefined
            }
            disabled={!canReschedule}
          >
            <Text
              style={[
                cardStyles.payText,
                {
                  fontFamily:
                    fontSemiBold,
                },
              ]}
            >
              Remarcar
            </Text>

            {!canReschedule && (
              <Text
                style={[
                  cardStyles.payHint,
                  {
                    fontFamily:
                      fontRegular,
                  },
                ]}
              >
                Prazo encerrado
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.white,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  title: {
    color: Colors.dark,
    fontSize: 22,
  },

  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },

  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  newBookingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      Colors.gold,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },

  newBookingText: {
    color: Colors.white,
    fontSize: 14,
  },

  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      Colors.gold,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },

  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor:
      Colors.grey100,
    paddingHorizontal: 20,
  },

  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2.5,
    borderBottomColor:
      'transparent',
  },

  tabActive: {
    borderBottomColor:
      Colors.gold,
  },

  tabText: {
    fontSize: 14,
    color: Colors.grey400,
  },

  tabTextActive: {
    color: Colors.gold,
  },

  list: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },

  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 20,
  },

  emptyText: {
    color: Colors.grey400,
    fontSize: 15,
  },

  overlay: {
    flex: 1,
    backgroundColor:
      'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  modalCard: {
    backgroundColor:
      Colors.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    gap: 14,
    alignItems: 'center',
  },

  modalClose: {
    alignSelf: 'flex-end',
    padding: 4,
  },

  modalTitle: {
    color: Colors.dark,
    fontSize: 18,
    textAlign: 'center',
  },

  modalBody: {
    color: Colors.grey500,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },

  dangerBtn: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    backgroundColor:
      Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },

  dangerBtnDisabled: {
    opacity: 0.7,
  },

  dangerBtnText: {
    color: Colors.white,
    fontSize: 15,
  },

  outlineBtn: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor:
      Colors.grey200,
    alignItems: 'center',
    justifyContent: 'center',
  },

  outlineBtnText: {
    color: Colors.grey500,
    fontSize: 15,
  },

  successCard: {
    backgroundColor:
      Colors.white,
    borderRadius: 20,
    padding: 32,
    width: '100%',
    alignItems: 'center',
    gap: 20,
  },

  successIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      '#E6F9EF',
  },

  successTitle: {
    color: Colors.dark,
    fontSize: 20,
    textAlign: 'center',
  },

  goldBtn: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    backgroundColor:
      Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },

  goldBtnText: {
    color: Colors.white,
    fontSize: 15,
  },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor:
      Colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },

  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },

  dateText: {
    color: Colors.dark,
    fontSize: 13,
  },

  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  reminderLabel: {
    color: Colors.grey400,
    fontSize: 12,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },

  statusText: {
    fontSize: 12,
  },

  shopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  shopAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor:
      Colors.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  shopInfo: {
    flex: 1,
    gap: 3,
  },

  shopName: {
    color: Colors.dark,
    fontSize: 15,
  },

  addrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },

  addrText: {
    color: Colors.grey400,
    fontSize: 12,
    flex: 1,
  },

  price: {
    color: Colors.gold,
    fontSize: 15,
  },

  servicesBox: {
    backgroundColor:
      Colors.white,
    borderRadius: 10,
    padding: 12,
    gap: 3,
  },

  servicesLabel: {
    color: Colors.dark,
    fontSize: 12,
  },

  servicesText: {
    color: Colors.grey500,
    fontSize: 13,
    lineHeight: 19,
  },

  actions: {
    flexDirection: 'row',
    gap: 10,
  },

  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor:
      Colors.grey200,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelBtnDisabled: {
    opacity: 0.4,
  },

  cancelText: {
    color: Colors.grey500,
    fontSize: 13,
  },

  cancelHint: {
    color: Colors.grey500,
    fontSize: 10,
    marginTop: 2,
    opacity: 0.9,
  },

  payBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor:
      Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },

  payBtnDisabled: {
    opacity: 0.4,
  },

  payText: {
    color: Colors.white,
    fontSize: 13,
  },

  payHint: {
    color: Colors.white,
    fontSize: 10,
    marginTop: 2,
    opacity: 0.9,
  },
});