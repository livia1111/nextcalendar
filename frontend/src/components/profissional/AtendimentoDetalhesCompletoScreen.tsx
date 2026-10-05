import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeftIcon } from '@/components/icons';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';
import { useAuth } from '@/context/AuthContext';
import { type AttendanceItem } from '@/services/attendanceServices';
import { getAppointmentPhotos, deletePhoto, type AttendancePhoto } from '@/services/photoServices';
import { getOrder, type Order, type OrderItem } from '@/services/comandaServices';
import { PhotoGallery, type GalleryPhoto } from '@/components/profissional/PhotoGallery';
import { PhotoCaptureModal } from '@/components/profissional/PhotoCaptureModal';
import { formatBRL } from '@/utils/money';
import { API_BASE_URL } from '@/services/api';
import { getApiErrorMessage } from '@/utils/apiError';

interface AtendimentoDetalhesCompletoScreenProps {
  attendance: AttendanceItem;
  onBack: () => void;
  onViewClientHistory?: (clientId: string, clientName: string) => void;
  onEditTechnicalSheet?: () => void;
}

export function AtendimentoDetalhesCompletoScreen({
  attendance,
  onBack,
  onViewClientHistory,
  onEditTechnicalSheet,
}: AtendimentoDetalhesCompletoScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { fontRegular, fontSemiBold, fontBold } = useAppFonts();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [photos, setPhotos] = useState<AttendancePhoto[]>([]);
  const [showCaptureModal, setShowCaptureModal] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadData() {
      setLoading(true);
      try {
        const [photoList, orderData] = await Promise.all([
          getAppointmentPhotos(attendance.id).catch(() => []),
          attendance.orderId
            ? getOrder(attendance.establishmentId, attendance.orderId).catch(() => null)
            : Promise.resolve(null),
        ]);

        if (active) {
          setPhotos(photoList);
          setOrder(orderData);
        }
      } catch {
        // silent fallback
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [attendance.id, attendance.establishmentId]);

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }

  async function handleRemovePhoto(photoId: string) {
    try {
      await deletePhoto(photoId);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch (err) {
      Alert.alert('Erro', getApiErrorMessage(err, 'Não foi possível excluir a foto.'));
    }
  }

  function handlePhotoSaved(newPhoto: AttendancePhoto) {
    setPhotos((prev) => [...prev, newPhoto]);
  }

  function handleOpenComanda() {
    const route = user?.role === 'MANAGER' ? '/(gestor)/comanda' : '/(profissional)/comanda';
    router.push({
      pathname: route as any,
      params: { appointmentId: attendance.id, establishmentId: attendance.establishmentId },
    });
  }

  const galleryPhotos: GalleryPhoto[] = photos.map((p) => ({
    id: p.id,
    uri: `${API_BASE_URL}${p.photoUrl}`,
    type: p.type,
    caption: p.caption,
    takenByName: p.takenByName,
    createdAt: p.createdAt,
  }));

  const isClosed = attendance.status === 'DONE' || order?.status === 'CLOSED';

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <ChevronLeftIcon size={22} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: fontBold }]}>Detalhes do Atendimento</Text>
        <View style={styles.iconBtn} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Card Resumo */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: isClosed ? '#DEF7EC' : '#FEF3C7' },
                ]}>
                <Text
                  style={[
                    styles.statusBadgeText,
                    { color: isClosed ? '#03543F' : '#92400E', fontFamily: fontSemiBold },
                  ]}>
                  {isClosed ? 'Concluído' : 'Em andamento'}
                </Text>
              </View>
              <Text style={[styles.dateText, { fontFamily: fontRegular }]}>
                {formatDate(attendance.startDateTime)}
              </Text>
            </View>

            <Text style={[styles.serviceTitle, { fontFamily: fontBold }]}>
              {attendance.serviceName}
            </Text>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { fontFamily: fontRegular }]}>Cliente:</Text>
              <Text style={[styles.infoValue, { fontFamily: fontSemiBold }]}>
                {attendance.clientName}
              </Text>
            </View>

            {attendance.clientPhone ? (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { fontFamily: fontRegular }]}>Telefone:</Text>
                <Text style={[styles.infoValue, { fontFamily: fontRegular }]}>
                  {attendance.clientPhone}
                </Text>
              </View>
            ) : null}

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { fontFamily: fontRegular }]}>Profissional:</Text>
              <Text style={[styles.infoValue, { fontFamily: fontSemiBold, color: Colors.goldDark }]}>
                {attendance.professionalName}
              </Text>
            </View>

            {attendance.clientId && onViewClientHistory ? (
              <TouchableOpacity
                style={styles.clientHistoryBtn}
                activeOpacity={0.8}
                onPress={() => onViewClientHistory(attendance.clientId!, attendance.clientName)}>
                <Text style={[styles.clientHistoryBtnText, { fontFamily: fontSemiBold }]}>
                  Ver Histórico Completo do Cliente →
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Seção Comanda */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.sectionTitle, { fontFamily: fontSemiBold }]}>Comanda do Atendimento</Text>
              <TouchableOpacity onPress={handleOpenComanda} activeOpacity={0.8}>
                <Text style={[styles.linkAction, { fontFamily: fontSemiBold }]}>
                  {isClosed ? 'Ver Comanda' : 'Gerenciar Comanda'}
                </Text>
              </TouchableOpacity>
            </View>

            {order && order.items.length > 0 ? (
              <View style={styles.orderItemsContainer}>
                {order.items.map((item: OrderItem) => (
                  <View key={item.id} style={styles.orderItemRow}>
                    <Text style={[styles.orderItemName, { fontFamily: fontRegular }]}>
                      {item.quantity}x {item.name}
                    </Text>
                    <Text style={[styles.orderItemPrice, { fontFamily: fontSemiBold }]}>
                      {formatBRL(item.subtotal)}
                    </Text>
                  </View>
                ))}

                <View style={styles.divider} />

                {order.discountAmount > 0 ? (
                  <View style={styles.totalRow}>
                    <Text style={[styles.subtotalLabel, { fontFamily: fontRegular }]}>Desconto:</Text>
                    <Text style={[styles.discountText, { fontFamily: fontSemiBold }]}>
                      - {formatBRL(order.discountAmount)}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { fontFamily: fontBold }]}>Total:</Text>
                  <Text style={[styles.totalAmount, { fontFamily: fontBold }]}>
                    {formatBRL(order.totalAmount)}
                  </Text>
                </View>

                {order.paymentMethod ? (
                  <View style={styles.paymentMethodRow}>
                    <Text style={[styles.paymentMethodLabel, { fontFamily: fontRegular }]}>
                      Forma de pagamento:{' '}
                      <Text style={{ fontFamily: fontSemiBold }}>{order.paymentMethod}</Text>
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <Text style={[styles.emptyBoxText, { fontFamily: fontRegular }]}>
                  Total estimado: {formatBRL(attendance.totalAmount)}
                </Text>
              </View>
            )}
          </View>

          {/* Seção Fotos */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.sectionTitle, { fontFamily: fontSemiBold }]}>
                Fotos ({photos.length})
              </Text>
              <TouchableOpacity
                style={styles.addPhotoHeaderBtn}
                activeOpacity={0.8}
                onPress={() => setShowCaptureModal(true)}>
                <Text style={[styles.addPhotoHeaderBtnText, { fontFamily: fontSemiBold }]}>
                  + Fotografar
                </Text>
              </TouchableOpacity>
            </View>

            <PhotoGallery
              photos={galleryPhotos}
              onAddFromCamera={() => setShowCaptureModal(true)}
              onAddFromLibrary={() => setShowCaptureModal(true)}
              onRemove={handleRemovePhoto}
            />
          </View>

          {/* Seção Ficha Técnica */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.sectionTitle, { fontFamily: fontSemiBold }]}>
                Anotações Técnicas
              </Text>
              {onEditTechnicalSheet ? (
                <TouchableOpacity onPress={onEditTechnicalSheet} activeOpacity={0.8}>
                  <Text style={[styles.linkAction, { fontFamily: fontSemiBold }]}>Editar Ficha</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <Text style={[styles.notesText, { fontFamily: fontRegular }]}>
              {attendance.notes || 'Nenhuma anotação técnica registrada para este atendimento.'}
            </Text>
          </View>
        </ScrollView>
      )}

      {/* Modal para tirar foto / galeria */}
      <PhotoCaptureModal
        visible={showCaptureModal}
        appointmentId={attendance.id}
        onClose={() => setShowCaptureModal(false)}
        onPhotoSaved={handlePhotoSaved}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grey100,
  },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, color: Colors.dark },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.grey100,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 15,
    color: Colors.dark,
  },
  linkAction: {
    fontSize: 13,
    color: Colors.goldDark,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 12,
  },
  dateText: {
    fontSize: 13,
    color: Colors.grey500,
  },
  serviceTitle: {
    fontSize: 18,
    color: Colors.dark,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.grey500,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.dark,
  },
  clientHistoryBtn: {
    marginTop: 6,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(202, 160, 82, 0.08)',
    borderRadius: 10,
  },
  clientHistoryBtnText: {
    fontSize: 13,
    color: Colors.goldDark,
  },
  orderItemsContainer: {
    gap: 8,
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 12,
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderItemName: {
    fontSize: 14,
    color: Colors.dark,
  },
  orderItemPrice: {
    fontSize: 14,
    color: Colors.dark,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.grey200,
    marginVertical: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtotalLabel: {
    fontSize: 13,
    color: Colors.grey500,
  },
  discountText: {
    fontSize: 13,
    color: '#DC2626',
  },
  totalLabel: {
    fontSize: 15,
    color: Colors.dark,
  },
  totalAmount: {
    fontSize: 16,
    color: Colors.goldDark,
  },
  paymentMethodRow: {
    marginTop: 4,
  },
  paymentMethodLabel: {
    fontSize: 12,
    color: Colors.grey500,
  },
  emptyBox: {
    padding: 12,
    backgroundColor: Colors.surface,
    borderRadius: 10,
  },
  emptyBoxText: {
    fontSize: 13,
    color: Colors.grey500,
  },
  addPhotoHeaderBtn: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  addPhotoHeaderBtnText: {
    color: Colors.white,
    fontSize: 12,
  },
  notesText: {
    fontSize: 14,
    color: Colors.grey500,
    lineHeight: 20,
  },
});
