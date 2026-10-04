import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { XIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';
import type { ProductPayload, ProductResponse } from '@/services/produtoServices';
import { getApiErrorMessage } from '@/utils/apiError';
import { maskBRL, numberToBRLMask, parseBRL } from '@/utils/money';

interface ProductFormModalProps {
  visible: boolean;
  /** null = cadastrar novo produto; objeto = editar. */
  product: ProductResponse | null;
  onClose: () => void;
  onSubmit: (payload: ProductPayload) => Promise<void>;
  /** Se informado e estiver editando, mostra o botão "Excluir produto". */
  onDelete?: (productId: string) => Promise<void>;
}

/** Modal de cadastro/edição de produto (mesmos campos do ProductCreateDTO/UpdateDTO). */
export function ProductFormModal({ visible, product, onClose, onSubmit, onDelete }: ProductFormModalProps) {
  const { fontSemiBold, fontRegular } = useAppFonts();
  const isEdit = !!product;

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');

  // Preenche (ou limpa) o formulário toda vez que o modal abre
  useEffect(() => {
    if (!visible) return;
    setName(product?.name ?? '');
    setCategory(product?.category ?? '');
    setPrice(product ? numberToBRLMask(product.price) : '');
    setStock(product ? String(product.stockQuantity) : '');
    setConfirmDelete(false);
    setSubmitting(false);
    setError('');
  }, [visible, product]);

  async function handleSave() {
    const priceValue = parseBRL(price);
    if (name.trim().length < 3) { setError('O nome deve ter ao menos 3 caracteres.'); return; }
    if (!category.trim()) { setError('Informe a categoria do produto.'); return; }
    if (!price.trim() || priceValue <= 0) { setError('Informe um valor válido para o produto.'); return; }
    if (stock === '') { setError('Informe a quantidade em estoque (pode ser 0).'); return; }

    setError('');
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        category: category.trim(),
        price: priceValue,
        stockQuantity: Number(stock),
      });
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Não foi possível salvar o produto.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!product || !onDelete) return;
    setSubmitting(true);
    try {
      await onDelete(product.id);
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Não foi possível excluir o produto.'));
      setConfirmDelete(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerTitleCol}>
              <Text style={[styles.title, { fontFamily: fontSemiBold }]}>
                {isEdit ? 'Editar Produto' : 'Novo Produto'}
              </Text>
              <Text style={[styles.subtitle, { fontFamily: fontRegular }]}>
                {isEdit ? 'Atualize os dados do produto' : 'Adicione um produto ao estabelecimento'}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <XIcon size={18} color={Colors.grey500} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled">
            <InputField
              label="Nome do produto *"
              placeholder="Ex: Pomada Modeladora"
              value={name}
              onChangeText={setName}
              autoCapitalize="sentences"
              maxLength={120}
            />
            <InputField
              label="Categoria *"
              placeholder="Ex: Cabelo, Barba, Finalizador"
              value={category}
              onChangeText={setCategory}
              autoCapitalize="sentences"
              maxLength={50}
            />
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <InputField
                  label="Valor (R$) *"
                  placeholder="0,00"
                  value={price}
                  onChangeText={(t) => setPrice(maskBRL(t))}
                  keyboardType="number-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <InputField
                  label="Estoque *"
                  placeholder="0"
                  value={stock}
                  onChangeText={(t) => setStock(t.replace(/\D/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            {error ? <Text style={[styles.errorText, { fontFamily: fontRegular }]}>{error}</Text> : null}

            <View style={styles.actions}>
              <Button
                label={submitting ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Cadastrar Produto'}
                onPress={handleSave}
                disabled={submitting}
              />

              {isEdit && onDelete && !confirmDelete && (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  activeOpacity={0.7}
                  disabled={submitting}
                  onPress={() => setConfirmDelete(true)}>
                  <Text style={[styles.deleteText, { fontFamily: fontSemiBold }]}>Excluir produto</Text>
                </TouchableOpacity>
              )}

              {isEdit && onDelete && confirmDelete && (
                <View style={styles.confirmBox}>
                  <Text style={[styles.confirmText, { fontFamily: fontRegular }]}>
                    Tem certeza que deseja excluir este produto?
                  </Text>
                  <View style={styles.confirmRow}>
                    <TouchableOpacity
                      style={[styles.confirmBtn, styles.confirmCancel]}
                      activeOpacity={0.8}
                      disabled={submitting}
                      onPress={() => setConfirmDelete(false)}>
                      <Text style={[styles.confirmCancelText, { fontFamily: fontSemiBold }]}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.confirmBtn, styles.confirmDelete]}
                      activeOpacity={0.8}
                      disabled={submitting}
                      onPress={handleDelete}>
                      <Text style={[styles.confirmDeleteText, { fontFamily: fontSemiBold }]}>Sim, excluir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(13, 13, 18, 0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grey100,
  },
  headerTitleCol: { gap: 4, flex: 1 },
  title: { fontSize: 18, color: Colors.dark },
  subtitle: { fontSize: 13, color: Colors.grey400 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContent: { paddingHorizontal: 24, paddingTop: 18, gap: 16, paddingBottom: 16 },
  row: { flexDirection: 'row', gap: 12 },
  errorText: { color: Colors.error, fontSize: 13, textAlign: 'center' },
  actions: { marginTop: 8, gap: 12, paddingBottom: 12 },
  deleteBtn: { alignItems: 'center', paddingVertical: 10 },
  deleteText: { color: Colors.error, fontSize: 14 },
  confirmBox: {
    backgroundColor: '#FEECEC',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  confirmText: { color: Colors.dark, fontSize: 13, textAlign: 'center' },
  confirmRow: { flexDirection: 'row', gap: 10 },
  confirmBtn: { flex: 1, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  confirmCancel: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.grey200 },
  confirmCancelText: { color: Colors.grey500, fontSize: 14 },
  confirmDelete: { backgroundColor: Colors.error },
  confirmDeleteText: { color: Colors.white, fontSize: 14 },
});