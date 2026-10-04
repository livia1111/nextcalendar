/**
 * Tela de Comanda (abrir, adicionar serviços/produtos, desconto, pagamento e finalizar).
 *
 * Rota: /comanda
 * Parâmetros (todos opcionais enquanto estiver em modo mock):
 *   - appointmentId   → abre (ou recupera) a comanda desse agendamento
 *   - establishmentId → estabelecimento do profissional logado
 *   - orderId         → se já souber o id da comanda, abre direto por ele
 *
 * Exemplo de navegação (a partir do detalhe do agendamento):
 *   router.push({ pathname: '/comanda', params: { appointmentId: appt.id, establishmentId } });
 *
 * Hoje usa dados de exemplo (USE_MOCK_COMANDA em src/constants/mock.ts).
 */

import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { Colors } from '@/constants/colors';
import { DEFAULT_ESTABLISHMENT_ID } from '@/constants/establishment';
import { USE_MOCK_COMANDA } from '@/constants/mocks';
import { useAuth } from '@/context/AuthContext';
import { useAppFonts } from '@/hooks/use-fonts';
import {
  MOCK_APPOINTMENT_ID,
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
import { getRoleHomeRoute } from '@/utils/roleHomeRoute';

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
  const appointmentId = params.appointmentId || (USE_MOCK_COMANDA ? MOCK_APPOINTMENT_ID : '');
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

  // ─── Adicionar serviço / produto ─────────────────────────────────────────
  async function openPicker(mode: OrderItemType) {
    setActionError('');
    setPickerMode(mode);
    setPickerItems([]);
    setPickerLoading(true);
    try {
      if (mode === 'SERVICE') {
        const services = await listCatalogServices(establishmentId);
        setPickerItems(
          services.map((s) => ({ id: s.id, name: s.name, price: s.price, subtitle: s.category })),
        );
      } else {
        const products = await listProducts(establishmentId);
        setPickerItems(
          products.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            subtitle: `${p.category} • Estoque: ${p.stockQuantity}`,
            disabled: p.stockQuantity <= 0,
            disabledLabel: 'Sem estoque',
          })),
        );
      }
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Não foi possível carregar a lista.'));
    } finally {
      setPickerLoading(false);
    }
  }

  async function handleConfirmItem(item: PickerItem, quantity: number) {
    if (!order || !pickerMode) return;
    const ok = await run(() =>
      addOrderItem(establishmentId, order.id, { itemType: pickerMode, itemId: item.id, quantity }),
    );
    if (ok) setPickerMode(null);
  }

  function handleRemoveItem(itemId: string) {
    if (!order) return;
    run(() => removeOrderItem(establishmentId, order.id, itemId));
  }

  // ─── Desconto e forma de pagamento ───────────────────────────────────────
  async function handleApplyDiscount() {
    if (!order) return;
    const value = discountText.trim() ? parseBRL(discountText) : 0;
    if (value > order.subtotal) {
      setDiscountError('O desconto não pode ser maior que o subtotal.');
      return;
    }
    setDiscountError('');
    await run(() => updateOrder(establishmentId, order.id, { discountAmount: value }), true);
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
    await run(() => finishOrder(establishmentId, order.id));
    setConfirmFinish(false); // se deu erro, a mensagem aparece no rodapé da tela
  }

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace((user ? getRoleHomeRoute(user.role) : '/') as any);
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

  const initials = (order.professionalName || '?').trim().charAt(0).toUpperCase();

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={goBack} activeOpacity={0.7}>
          <ChevronLeftIcon size={20} color={Colors.goldDark} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: fontSemiBold }]}>Comanda</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}>
        {/* Profissional / cliente / status */}
        <View style={styles.personRow}>
          {order.professionalPhotoUrl ? (
            <Image source={{ uri: order.professionalPhotoUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={[styles.avatarInitial, { fontFamily: fontBold }]}>{initials}</Text>
            </View>
          )}
          <View style={styles.personInfo}>
            <Text style={[styles.clientName, { fontFamily: fontSemiBold }]} numberOfLines={1}>
              {order.clientName || 'Cliente avulso'}
            </Text>
            <Text style={[styles.professionalName, { fontFamily: fontRegular }]} numberOfLines={1}>
              Atendimento com {order.professionalName}
            </Text>
          </View>
          <View style={[styles.statusBadge, isClosed ? styles.statusClosed : styles.statusOpen]}>
            <Text
              style={[
                styles.statusText,
                { fontFamily: fontSemiBold, color: isClosed ? '#1E64B4' : '#1B873F' },
              ]}>
              {isClosed ? 'Finalizada' : 'Aberta'}
            </Text>
          </View>
        </View>

        {isClosed && (
          <View style={styles.closedBanner}>
            <Text style={[styles.closedBannerText, { fontFamily: fontRegular }]}>
              Comanda finalizada em {formatDateTime(order.closedAt)}. Não é possível alterá-la.
            </Text>
          </View>
        )}

        {/* Itens */}
        <View style={styles.itemsCard}>
          {order.items.length === 0 ? (
            <Text style={[styles.emptyItems, { fontFamily: fontRegular }]}>Nenhum item na comanda.</Text>
          ) : (
            order.items.map((item, index) => (
              <View key={item.id} style={[styles.itemRow, index > 0 && styles.itemRowBorder]}>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { fontFamily: fontRegular }]} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={[styles.itemMeta, { fontFamily: fontRegular }]}>
                    {item.itemType === 'SERVICE' ? 'Serviço' : 'Produto'}
                    {item.quantity > 1 ? ` • ${item.quantity}x ${formatBRL(item.unitPrice)}` : ''}
                  </Text>
                </View>
                <Text style={[styles.itemPrice, { fontFamily: fontBold }]}>{formatBRL(item.subtotal)}</Text>
                {!isClosed && (
                  <TouchableOpacity
                    style={styles.trashBtn}
                    disabled={busy}
                    activeOpacity={0.6}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={() => handleRemoveItem(item.id)}>
                    <TrashIcon size={17} color={Colors.grey400} />
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>

        {!isClosed && (
          <View style={styles.addRow}>
            <TouchableOpacity
              style={styles.addBtn}
              activeOpacity={0.8}
              disabled={busy}
              onPress={() => openPicker('SERVICE')}>
              <Text style={[styles.addBtnText, { fontFamily: fontSemiBold }]}>+ Adicionar Serviços</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addBtn}
              activeOpacity={0.8}
              disabled={busy}
              onPress={() => openPicker('PRODUCT')}>
              <Text style={[styles.addBtnText, { fontFamily: fontSemiBold }]}>+ Adicionar Produtos</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Desconto */}
        <View style={styles.discountCard}>
          <Text style={[styles.cardLabel, { fontFamily: fontSemiBold }]}>Desconto</Text>
          {isClosed ? (
            <Text style={[styles.discountValue, { fontFamily: fontSemiBold }]}>
              {order.discountAmount > 0 ? `-${formatBRL(order.discountAmount)}` : formatBRL(0)}
            </Text>
          ) : (
            <View style={styles.discountInputRow}>
              <View style={styles.discountInputWrap}>
                <Text style={[styles.currencyPrefix, { fontFamily: fontSemiBold }]}>R$</Text>
                <TextInput
                  style={[styles.discountInput, { fontFamily: fontRegular }]}
                  value={discountText}
                  onChangeText={(t) => {
                    setDiscountText(maskBRL(t));
                    setDiscountError('');
                  }}
                  placeholder="0,00"
                  placeholderTextColor={Colors.grey400}
                  keyboardType="number-pad"
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
            <Text style={[styles.totalLineValue, { fontFamily: fontRegular }]}>{formatBRL(order.subtotal)}</Text>
          </View>
          {order.discountAmount > 0 && (
            <View style={styles.totalLine}>
              <Text style={[styles.totalLineLabel, { fontFamily: fontRegular }]}>Desconto</Text>
              <Text style={[styles.totalLineValue, { fontFamily: fontRegular, color: Colors.error }]}>
                -{formatBRL(order.discountAmount)}
              </Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.totalMain}>
            <Text style={[styles.totalTitle, { fontFamily: fontBold }]}>TOTAL</Text>
            <Text style={[styles.totalValue, { fontFamily: fontBold }]}>{formatBRL(order.totalAmount)}</Text>
          </View>
        </View>

        {/* Forma de pagamento */}
        <View style={styles.paymentBox}>
          <Text style={[styles.paymentTitle, { fontFamily: fontSemiBold }]}>Forma de Pagamento</Text>
          {isClosed ? (
            <Text style={[styles.paymentClosed, { fontFamily: fontSemiBold }]}>{paymentLabel(order.paymentMethod)}</Text>
          ) : (
            <View style={styles.paymentGrid}>
              {PAYMENT_OPTIONS.map((opt) => {
                const active = order.paymentMethod === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.paymentChip, active && styles.paymentChipActive]}
                    activeOpacity={0.8}
                    disabled={busy}
                    onPress={() => handleSelectPayment(opt.value)}>
                    <Text
                      style={[
                        styles.paymentChipText,
                        { fontFamily: fontSemiBold },
                        active && styles.paymentChipTextActive,
                      ]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Rodapé fixo */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        {actionError && !pickerMode ? (
          <Text style={[styles.errorInline, { fontFamily: fontRegular, textAlign: 'center' }]}>{actionError}</Text>
        ) : null}
        {isClosed ? (
          <TouchableOpacity style={styles.finishBtn} activeOpacity={0.85} onPress={goBack}>
            <Text style={[styles.finishBtnText, { fontFamily: fontBold }]}>Voltar</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.finishBtn, busy && { opacity: 0.6 }]}
            activeOpacity={0.85}
            disabled={busy}
            onPress={handlePressFinish}>
            {busy ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={[styles.finishBtnText, { fontFamily: fontBold }]}>Finalizar Comanda</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Seletor de serviço / produto */}
      <ItemPickerModal
        visible={pickerMode !== null}
        title={pickerMode === 'PRODUCT' ? 'Adicionar Produto' : 'Adicionar Serviço'}
        searchPlaceholder={pickerMode === 'PRODUCT' ? 'Buscar produto' : 'Buscar serviço'}
        emptyText={
          pickerMode === 'PRODUCT'
            ? 'Nenhum produto cadastrado. O gestor pode cadastrar em Produtos.'
            : 'Nenhum serviço cadastrado.'
        }
        items={pickerItems}
        loading={pickerLoading}
        submitting={busy}
        error={pickerMode ? actionError : ''}
        onClose={() => setPickerMode(null)}
        onConfirm={handleConfirmItem}
      />

      {/* Confirmação de finalização */}
      <Modal visible={confirmFinish} transparent animationType="fade" onRequestClose={() => setConfirmFinish(false)}>
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