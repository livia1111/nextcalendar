/**
 * Tela de Comanda (abrir, adicionar serviços/produtos, desconto, pagamento e finalizar).
 */

import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ChevronLeftIcon } from '@/components/icons';
import { TrashIcon } from '@/components/comanda/ComandaIcons';
import { ItemPickerModal, type PickerItem } from '@/components/comanda/ItemPickerModal';
import { PhotoCaptureModal } from '@/components/profissional/PhotoCaptureModal';
import { Colors } from '@/constants/colors';
import { DEFAULT_ESTABLISHMENT_ID } from '@/constants/establishment';
import { useAuth } from '@/context/AuthContext';
import { useAppFonts } from '@/hooks/use-fonts';
import {
  addOrderItem,
  finishOrder,
  getOrder,
  listCatalogServices,
  openOrder,
  removeOrderItem,
  updateOrder,
  type Order,
  type OrderItemType,
  type PaymentMethod,
} from '@/services/comandaServices';
import { listProducts } from '@/services/produtoServices';
import { getApiErrorMessage } from '@/utils/apiError';
import { formatBRL, maskBRL, numberToBRLMask, parseBRL } from '@/utils/money';

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Dinheiro' },
  { value: 'PIX', label: 'PIX' },
  { value: 'CREDIT_CARD', label: 'Cartão de Crédito' },
  { value: 'DEBIT_CARD', label: 'Cartão de Débito' },
];

function paymentLabel(method: PaymentMethod | null): string {
  return PAYMENT_OPTIONS.find((o) => o.value === method)?.label ?? '—';
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function ComandaScreen() {
  const { fontRegular, fontSemiBold, fontBold } = useAppFonts();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ appointmentId?: string; establishmentId?: string; orderId?: string }>();

  const establishmentId = params.establishmentId || DEFAULT_ESTABLISHMENT_ID;
  const appointmentId = params.appointmentId || '';
  const orderIdParam = params.orderId;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const [discountText, setDiscountText] = useState('');
  const [discountError, setDiscountError] = useState('');

  const [pickerMode, setPickerMode] = useState<OrderItemType | null>(null);
  const [pickerItems, setPickerItems] = useState<PickerItem[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);

  const isClosed = order?.status === 'CLOSED';

  // ─── Carregar / abrir a comanda ──────────────────────────────────────────
  const applyOrder = useCallback((o: Order, syncDiscount = false) => {
    setOrder(o);
    if (syncDiscount) setDiscountText(o.discountAmount > 0 ? numberToBRLMask(o.discountAmount) : '');
  }, []);

  const loadOrder = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      let result: Order;
      if (orderIdParam) result = await getOrder(establishmentId, orderIdParam);
      else if (appointmentId) result = await openOrder(establishmentId, appointmentId);
      else throw new Error('Agendamento não informado.');
      applyOrder(result, true);
    } catch (err) {
      setLoadError(getApiErrorMessage(err, 'Não foi possível abrir a comanda.'));
    } finally {
      setLoading(false);
    }
  }, [establishmentId, appointmentId, orderIdParam, applyOrder]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  // ─── Helper: executa uma ação que devolve a comanda atualizada ───────────
  async function run(action: () => Promise<Order>, syncDiscount = false): Promise<boolean> {
    setBusy(true);
    setActionError('');
    try {
      applyOrder(await action(), syncDiscount);
      return true;
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Não foi possível concluir a ação.'));
      return false;
    } finally {
      setBusy(false);
    }
  }

  // ─── Ações de itens ──────────────────────────────────────────────────────
  async function handleOpenPicker(mode: OrderItemType) {
    if (isClosed) return;
    setPickerMode(mode);
    setPickerLoading(true);
    try {
      if (mode === 'SERVICE') {
        const services = await listCatalogServices(establishmentId);
        setPickerItems(
          services.map((s) => ({ id: s.id, name: s.name, price: s.price, category: s.category })),
        );
      } else {
        const products = await listProducts(establishmentId);
        setPickerItems(
          products.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            category: p.category,
            subtitle: p.stockQuantity != null ? `Estoque: ${p.stockQuantity}` : undefined,
          })),
        );
      }
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Não foi possível carregar a lista.'));
      setPickerMode(null);
    } finally {
      setPickerLoading(false);
    }
  }

  function handleSelectItem(item: PickerItem, quantity: number) {
    if (!order || !pickerMode || isClosed) return;
    const mode = pickerMode;
    setPickerMode(null);
    run(() =>
      addOrderItem(establishmentId, order.id, {
        itemType: mode,
        itemId: item.id,
        quantity,
      }),
    );
  }

  function handleRemoveItem(itemId: string) {
    if (!order || isClosed) return;
    run(() => removeOrderItem(establishmentId, order.id, itemId));
  }

  // ─── Desconto ────────────────────────────────────────────────────────────
  function handleChangeDiscount(text: string) {
    setDiscountText(maskBRL(text));
    setDiscountError('');
  }

  function handleApplyDiscount() {
    if (!order || isClosed) return;
    const amount = parseBRL(discountText);
    if (amount > order.subtotal) {
      setDiscountError(`Desconto não pode ser maior que o subtotal (${formatBRL(order.subtotal)})`);
      return;
    }
    setDiscountError('');
    run(() => updateOrder(establishmentId, order.id, { discountAmount: amount }));
  }

  function handleSelectPayment(method: PaymentMethod) {
    if (!order || isClosed || order.paymentMethod === method) return;
    run(() => updateOrder(establishmentId, order.id, { paymentMethod: method }));
  }

  // ─── Finalizar ───────────────────────────────────────────────────────────
  function handlePressFinish() {
    if (!order) return;
    if (order.items.length === 0) {
      setActionError('Adicione ao menos um item antes de finalizar a comanda.');
      return;
    }
    if (!order.paymentMethod) {
      setActionError('Selecione a forma de pagamento antes de finalizar a comanda.');
      return;
    }
    setActionError('');
    setConfirmFinish(true);
  }

  async function handleConfirmFinish() {
    if (!order) return;
    setConfirmFinish(false);
    const success = await run(() => finishOrder(establishmentId, order.id));
    if (success) {
      Alert.alert(
        'Atendimento Finalizado!',
        'A comanda foi encerrada com sucesso. Deseja registrar a ficha técnica e fotos do cliente agora?',
        [
          {
            text: 'Mais tarde',
            style: 'cancel',
            onPress: () => goBack(),
          },
          {
            text: 'Ir para Ficha & Fotos',
            onPress: () => {
              const targetRoute = user?.role === 'MANAGER' ? '/(gestor)/atendimento' : '/(profissional)/atendimento';
              router.replace({
                pathname: targetRoute as any,
                params: { appointmentId: order.appointmentId, establishmentId },
              });
            },
          },
        ]
      );
    }
  }

  function goBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(user?.role === 'MANAGER' ? '/(gestor)/homeEmpresa' : '/(profissional)/home');
    }
  }

  // ─── Estados de carregamento / erro ──────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator size="large" color={Colors.gold} />
      </View>
    );
  }

  if (loadError || !order) {
    return (
      <View style={[styles.centerScreen, { padding: 24, gap: 12 }]}>
        <Text style={[styles.errorText, { fontFamily: fontRegular }]}>
          {loadError || 'Comanda não encontrada.'}
        </Text>
        <TouchableOpacity onPress={loadOrder} activeOpacity={0.7}>
          <Text style={[styles.linkText, { fontFamily: fontSemiBold }]}>Tentar novamente</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goBack} activeOpacity={0.7}>
          <Text style={[styles.linkText, { fontFamily: fontSemiBold, color: Colors.grey500 }]}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={goBack} activeOpacity={0.7}>
          <ChevronLeftIcon size={20} color={Colors.goldDark} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: fontSemiBold }]}>
          Comanda {isClosed ? '• Concluída' : ''}
        </Text>
        <TouchableOpacity
          style={styles.headerPhotoBtn}
          activeOpacity={0.8}
          onPress={() => setShowPhotoCapture(true)}>
          <Text style={[styles.headerPhotoBtnText, { fontFamily: fontSemiBold }]}>📸 Foto</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}>
        {/* Identificação do Atendimento */}
        <View style={styles.personRow}>
          {order.professionalPhotoUrl ? (
            <Image source={{ uri: order.professionalPhotoUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={[styles.avatarInitial, { fontFamily: fontBold }]}>
                {order.professionalName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.personInfo}>
            <Text style={[styles.clientName, { fontFamily: fontBold }]}>{order.clientName}</Text>
            <Text style={[styles.professionalName, { fontFamily: fontRegular }]}>
              Atendido por {order.professionalName}
            </Text>
          </View>
          <View style={[styles.statusBadge, isClosed ? styles.statusClosed : styles.statusOpen]}>
            <Text
              style={[
                styles.statusText,
                { fontFamily: fontSemiBold, color: isClosed ? '#1E64B4' : '#1B873F' },
              ]}>
              {isClosed ? 'Fechada' : 'Aberta'}
            </Text>
          </View>
        </View>

        {isClosed && (
          <View style={styles.closedBanner}>
            <Text style={[styles.closedBannerText, { fontFamily: fontRegular }]}>
              Esta comanda foi finalizada em {formatDateTime(order.closedAt)} e não pode mais ser
              alterada.
            </Text>
          </View>
        )}

        {/* Itens da Comanda */}
        <View style={styles.itemsCard}>
          {order.items.length === 0 ? (
            <Text style={[styles.emptyItems, { fontFamily: fontRegular }]}>Nenhum item na comanda.</Text>
          ) : (
            order.items.map((item, idx) => (
              <View
                key={item.id}
                style={[styles.itemRow, idx > 0 && styles.itemRowBorder]}>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { fontFamily: fontSemiBold }]}>{item.name}</Text>
                  <Text style={[styles.itemMeta, { fontFamily: fontRegular }]}>
                    {item.itemType === 'SERVICE' ? 'Serviço' : 'Produto'} • {item.quantity}x{' '}
                    {formatBRL(item.unitPrice)}
                  </Text>
                </View>
                <Text style={[styles.itemPrice, { fontFamily: fontSemiBold }]}>
                  {formatBRL(item.subtotal)}
                </Text>
                {!isClosed && (
                  <TouchableOpacity
                    style={styles.trashBtn}
                    onPress={() => handleRemoveItem(item.id)}
                    activeOpacity={0.7}
                    disabled={busy}>
                    <TrashIcon size={18} color={Colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>

        {/* Botões de Adicionar (apenas se aberta) */}
        {!isClosed && (
          <View style={styles.addRow}>
            <TouchableOpacity
              style={styles.addBtn}
              activeOpacity={0.8}
              disabled={busy}
              onPress={() => handleOpenPicker('SERVICE')}>
              <Text style={[styles.addBtnText, { fontFamily: fontSemiBold }]}>+ Adicionar Serviço</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addBtn}
              activeOpacity={0.8}
              disabled={busy}
              onPress={() => handleOpenPicker('PRODUCT')}>
              <Text style={[styles.addBtnText, { fontFamily: fontSemiBold }]}>+ Adicionar Produto</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Desconto */}
        <View style={styles.discountCard}>
          <Text style={[styles.cardLabel, { fontFamily: fontSemiBold }]}>Desconto</Text>
          {isClosed ? (
            <Text style={[styles.discountValue, { fontFamily: fontSemiBold }]}>
              {order.discountAmount > 0 ? `- ${formatBRL(order.discountAmount)}` : 'Nenhum'}
            </Text>
          ) : (
            <View style={styles.discountInputRow}>
              <View style={styles.discountInputWrap}>
                <Text style={[styles.currencyPrefix, { fontFamily: fontRegular }]}>R$</Text>
                <TextInput
                  style={[styles.discountInput, { fontFamily: fontRegular }]}
                  placeholder="0,00"
                  placeholderTextColor={Colors.grey400}
                  keyboardType="numeric"
                  value={discountText}
                  onChangeText={handleChangeDiscount}
                  editable={!busy}
                />
              </View>
              <TouchableOpacity
                style={styles.applyBtn}
                activeOpacity={0.85}
                disabled={busy}
                onPress={handleApplyDiscount}>
                <Text style={[styles.applyBtnText, { fontFamily: fontSemiBold }]}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          )}
          {discountError ? (
            <Text style={[styles.errorInline, { fontFamily: fontRegular }]}>{discountError}</Text>
          ) : null}
        </View>

        {/* Totais */}
        <View style={styles.totalsBox}>
          <View style={styles.totalLine}>
            <Text style={[styles.totalLineLabel, { fontFamily: fontRegular }]}>Subtotal</Text>
            <Text style={[styles.totalLineValue, { fontFamily: fontRegular }]}>
              {formatBRL(order.subtotal)}
            </Text>
          </View>
          {order.discountAmount > 0 && (
            <View style={styles.totalLine}>
              <Text style={[styles.totalLineLabel, { fontFamily: fontRegular }]}>Desconto</Text>
              <Text style={[styles.totalLineValue, { fontFamily: fontRegular, color: Colors.error }]}>
                - {formatBRL(order.discountAmount)}
              </Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.totalMain}>
            <Text style={[styles.totalTitle, { fontFamily: fontBold }]}>Total</Text>
            <Text style={[styles.totalValue, { fontFamily: fontBold }]}>
              {formatBRL(order.totalAmount)}
            </Text>
          </View>
        </View>

        {/* Forma de Pagamento */}
        <View style={styles.paymentBox}>
          <Text style={[styles.paymentTitle, { fontFamily: fontSemiBold }]}>Forma de Pagamento</Text>
          {isClosed ? (
            <Text style={[styles.paymentClosed, { fontFamily: fontRegular }]}>
              {paymentLabel(order.paymentMethod)}
            </Text>
          ) : (
            <View style={styles.paymentGrid}>
              {PAYMENT_OPTIONS.map((opt) => {
                const selected = order.paymentMethod === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.paymentChip, selected && styles.paymentChipActive]}
                    activeOpacity={0.8}
                    disabled={busy}
                    onPress={() => handleSelectPayment(opt.value)}>
                    <Text
                      style={[
                        styles.paymentChipText,
                        { fontFamily: selected ? fontSemiBold : fontRegular },
                        selected && styles.paymentChipTextActive,
                      ]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {actionError ? (
          <Text style={[styles.errorInline, { fontFamily: fontRegular, textAlign: 'center' }]}>
            {actionError}
          </Text>
        ) : null}
      </ScrollView>

      {/* Botão de Finalizar no rodapé */}
      {!isClosed && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={styles.finishBtn}
            activeOpacity={0.85}
            disabled={busy}
            onPress={handlePressFinish}>
            {busy ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={[styles.finishBtnText, { fontFamily: fontBold }]}>Finalizar Comanda</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Modal Seletor de Itens */}
      <ItemPickerModal
        visible={pickerMode !== null}
        title={pickerMode === 'SERVICE' ? 'Adicionar Serviço' : 'Adicionar Produto'}
        searchPlaceholder={pickerMode === 'SERVICE' ? 'Buscar serviço...' : 'Buscar produto...'}
        emptyText={pickerMode === 'SERVICE' ? 'Nenhum serviço encontrado.' : 'Nenhum produto encontrado.'}
        items={pickerItems}
        loading={pickerLoading}
        onClose={() => setPickerMode(null)}
        onConfirm={handleSelectItem}
      />

      {/* Modal de Confirmação de Finalização */}
      <Modal visible={confirmFinish} transparent animationType="fade">
        <View style={styles.dialogOverlay}>
          <View style={styles.dialog}>
            <Text style={[styles.dialogTitle, { fontFamily: fontSemiBold }]}>Finalizar comanda?</Text>
            <Text style={[styles.dialogText, { fontFamily: fontRegular }]}>
              Total de {formatBRL(order.totalAmount)} em {paymentLabel(order.paymentMethod)}. Depois de finalizada, a
              comanda não poderá ser alterada.
            </Text>
            <View style={styles.dialogRow}>
              <TouchableOpacity
                style={[styles.dialogBtn, styles.dialogCancel]}
                activeOpacity={0.8}
                disabled={busy}
                onPress={() => setConfirmFinish(false)}>
                <Text style={[styles.dialogCancelText, { fontFamily: fontSemiBold }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dialogBtn, styles.dialogConfirm]}
                activeOpacity={0.85}
                disabled={busy}
                onPress={handleConfirmFinish}>
                {busy ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={[styles.dialogConfirmText, { fontFamily: fontSemiBold }]}>Finalizar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Modal Captura de Foto */}
      {order ? (
        <PhotoCaptureModal
          visible={showPhotoCapture}
          appointmentId={order.appointmentId}
          onClose={() => setShowPhotoCapture(false)}
          onPhotoSaved={() => {
            Alert.alert('Foto Registrada!', 'A foto foi anexada com sucesso a este atendimento.');
          }}
        />
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  centerScreen: { flex: 1, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: Colors.error, fontSize: 14, textAlign: 'center' },
  errorInline: { color: Colors.error, fontSize: 13, marginTop: 4 },
  linkText: { color: Colors.goldDark, fontSize: 14 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grey100,
    backgroundColor: Colors.white,
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, color: Colors.dark },
  headerPhotoBtn: {
    backgroundColor: 'rgba(202, 160, 82, 0.14)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  headerPhotoBtnText: {
    color: Colors.goldDark,
    fontSize: 12,
  },

  content: { padding: 20, gap: 14 },

  personRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: Colors.gold },
  avatarFallback: { backgroundColor: '#FEF9EE', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 22, color: Colors.goldDark },
  personInfo: { flex: 1, gap: 2 },
  clientName: { fontSize: 16, color: Colors.dark },
  professionalName: { fontSize: 13, color: Colors.grey500 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  statusOpen: { backgroundColor: '#E8F8EE', borderColor: '#C2ECCF' },
  statusClosed: { backgroundColor: '#EDF4FC', borderColor: '#BFDBFE' },
  statusText: { fontSize: 12 },

  closedBanner: {
    backgroundColor: '#EDF4FC',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 12,
  },
  closedBannerText: { fontSize: 13, color: '#1E64B4' },

  itemsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.grey100,
    paddingHorizontal: 14,
  },
  emptyItems: { fontSize: 14, color: Colors.grey400, textAlign: 'center', paddingVertical: 20 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14 },
  itemRowBorder: { borderTopWidth: 1, borderTopColor: Colors.grey100 },
  itemInfo: { flex: 1, gap: 2 },
  itemName: { fontSize: 14, color: Colors.dark },
  itemMeta: { fontSize: 11, color: Colors.grey400 },
  itemPrice: { fontSize: 14, color: Colors.gold },
  trashBtn: { paddingLeft: 4 },

  addRow: { flexDirection: 'row', gap: 10 },
  addBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  addBtnText: { fontSize: 12, color: Colors.goldDark },

  discountCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.grey100,
    padding: 14,
    gap: 10,
  },
  cardLabel: { fontSize: 14, color: Colors.dark },
  discountValue: { fontSize: 15, color: Colors.error },
  discountInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  discountInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.grey100,
    backgroundColor: Colors.white,
  },
  currencyPrefix: { fontSize: 14, color: Colors.grey500 },
  discountInput: { flex: 1, fontSize: 15, color: Colors.dark, padding: 0 },
  applyBtn: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: { fontSize: 14, color: Colors.white },

  totalsBox: { gap: 8, paddingTop: 6 },
  totalLine: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLineLabel: { fontSize: 13, color: Colors.grey500 },
  totalLineValue: { fontSize: 13, color: Colors.grey500 },
  divider: { height: 1, backgroundColor: Colors.grey100, marginVertical: 4 },
  totalMain: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalTitle: { fontSize: 28, color: Colors.dark },
  totalValue: { fontSize: 22, color: Colors.goldDark },

  paymentBox: { gap: 10 },
  paymentTitle: { fontSize: 13, color: Colors.grey500 },
  paymentClosed: { fontSize: 15, color: Colors.dark },
  paymentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  paymentChip: {
    width: '48%',
    flexGrow: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.grey100,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentChipActive: { borderColor: Colors.gold, backgroundColor: '#FFFCF5', borderWidth: 1.5 },
  paymentChipText: { fontSize: 13, color: Colors.grey500 },
  paymentChipTextActive: { color: Colors.goldDark },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.grey100,
    backgroundColor: Colors.white,
    gap: 6,
  },
  finishBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishBtnText: { fontSize: 16, color: Colors.white },

  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 13, 18, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: { width: '100%', maxWidth: 380, backgroundColor: Colors.white, borderRadius: 20, padding: 20, gap: 12 },
  dialogTitle: { fontSize: 17, color: Colors.dark },
  dialogText: { fontSize: 14, color: Colors.grey500, lineHeight: 20 },
  dialogRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  dialogBtn: { flex: 1, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dialogCancel: { borderWidth: 1, borderColor: Colors.grey200, backgroundColor: Colors.white },
  dialogCancelText: { fontSize: 14, color: Colors.grey500 },
  dialogConfirm: { backgroundColor: Colors.gold },
  dialogConfirmText: { fontSize: 14, color: Colors.white },
});
