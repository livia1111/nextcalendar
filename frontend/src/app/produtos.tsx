/**
 * Tela de Produtos (cadastro, listagem, edição e exclusão).
 *
 * Rota: /produtos  (arquivo solto em src/app, igual a /empresa)
 * Hoje usa dados de exemplo (USE_MOCK_COMANDA em src/constants/mock.ts).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ChevronLeftIcon, PlusIcon, SearchIcon } from '@/components/icons';
import { ProductFormModal } from '@/components/comanda/ProductFormModal';
import { Colors } from '@/constants/colors';
import { DEFAULT_ESTABLISHMENT_ID } from '@/constants/establishment';
import { useAppFonts } from '@/hooks/use-fonts';
import { useEstablishment } from '@/hooks/useEstablishment';
import {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct,
  type ProductPayload,
  type ProductResponse,
} from '@/services/produtoServices';
import { getApiErrorMessage } from '@/utils/apiError';
import { formatBRL } from '@/utils/money';

const LOW_STOCK = 3;

export default function ProdutosScreen() {
  const { fontRegular, fontSemiBold, fontBold } = useAppFonts();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { establishmentId: loggedEstablishmentId } = useEstablishment();
  // Fallback para o estabelecimento do seed enquanto estiver em modo mock
  const establishmentId = loggedEstablishmentId || DEFAULT_ESTABLISHMENT_ID;

  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [feedback, setFeedback] = useState('');

  // modal: undefined = fechado | null = novo | produto = edição
  const [formTarget, setFormTarget] = useState<ProductResponse | null | undefined>(undefined);

  const load = useCallback(async () => {
    setLoadError('');
    try {
      setProducts(await listProducts(establishmentId));
    } catch (err) {
      setLoadError(getApiErrorMessage(err, 'Não foi possível carregar os produtos.'));
    } finally {
      setLoading(false);
    }
  }, [establishmentId]);

  useEffect(() => {
    load();
  }, [load]);

  // some o aviso de sucesso depois de alguns segundos
  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(''), 2500);
    return () => clearTimeout(t);
  }, [feedback]);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function handleSubmit(payload: ProductPayload) {
    if (formTarget) {
      await updateProduct(establishmentId, formTarget.id, payload);
      setFeedback('Produto atualizado com sucesso!');
    } else {
      await createProduct(establishmentId, payload);
      setFeedback('Produto cadastrado com sucesso!');
    }
    await load();
  }

  async function handleDelete(productId: string) {
    await deleteProduct(establishmentId, productId);
    setFeedback('Produto excluído.');
    await load();
  }

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  // Busca local (a API também tem /products/search?name=, se quiserem trocar depois)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q),
    );
  }, [products, query]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack} activeOpacity={0.7}>
          <ChevronLeftIcon size={20} color={Colors.goldDark} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: fontSemiBold }]}>Produtos</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.gold} />}>
        <Text style={[styles.subtitle, { fontFamily: fontRegular }]}>
          Cadastre os produtos vendidos no estabelecimento. Eles ficam disponíveis para adicionar nas comandas.
        </Text>

        {feedback ? (
          <View style={styles.feedbackBox}>
            <Text style={[styles.feedbackText, { fontFamily: fontSemiBold }]}>{feedback}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.newBtn} activeOpacity={0.85} onPress={() => setFormTarget(null)}>
          <PlusIcon size={18} color={Colors.white} />
          <Text style={[styles.newBtnText, { fontFamily: fontSemiBold }]}>Novo Produto</Text>
        </TouchableOpacity>

        <View style={styles.searchBox}>
          <SearchIcon size={18} />
          <TextInput
            style={[styles.searchInput, { fontFamily: fontRegular }]}
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar por nome ou categoria"
            placeholderTextColor={Colors.grey400}
            autoCorrect={false}
          />
        </View>

        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={Colors.gold} />
          </View>
        ) : loadError ? (
          <View style={styles.stateBox}>
            <Text style={[styles.stateText, { fontFamily: fontRegular, color: Colors.error }]}>{loadError}</Text>
            <TouchableOpacity onPress={() => { setLoading(true); load(); }} activeOpacity={0.7}>
              <Text style={[styles.retryText, { fontFamily: fontSemiBold }]}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={{ fontSize: 32 }}>🧴</Text>
            <Text style={[styles.stateTitle, { fontFamily: fontSemiBold }]}>
              {products.length === 0 ? 'Nenhum produto cadastrado' : 'Nenhum produto encontrado'}
            </Text>
            <Text style={[styles.stateText, { fontFamily: fontRegular }]}>
              {products.length === 0 ? 'Toque em "Novo Produto" para cadastrar o primeiro.' : 'Tente outro termo de busca.'}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filtered.map((p) => {
              const out = p.stockQuantity <= 0;
              const low = !out && p.stockQuantity <= LOW_STOCK;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={styles.card}
                  activeOpacity={0.75}
                  onPress={() => setFormTarget(p)}>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.cardName, { fontFamily: fontSemiBold }]} numberOfLines={1}>
                      {p.name}
                    </Text>
                    <View style={styles.metaRow}>
                      <View style={styles.categoryChip}>
                        <Text style={[styles.categoryText, { fontFamily: fontSemiBold }]}>{p.category}</Text>
                      </View>
                      <Text
                        style={[
                          styles.stockText,
                          { fontFamily: fontRegular },
                          out && { color: Colors.error },
                          low && { color: '#D97706' },
                        ]}>
                        {out ? 'Sem estoque' : low ? `Estoque baixo: ${p.stockQuantity}` : `Estoque: ${p.stockQuantity}`}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.cardPrice, { fontFamily: fontBold }]}>{formatBRL(p.price)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <ProductFormModal
        visible={formTarget !== undefined}
        product={formTarget ?? null}
        onClose={() => setFormTarget(undefined)}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grey100,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, color: Colors.dark },
  content: { padding: 20, gap: 14 },
  subtitle: { fontSize: 13, color: Colors.grey400 },
  feedbackBox: {
    backgroundColor: '#E8F8EE',
    borderWidth: 1,
    borderColor: '#C2ECCF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  feedbackText: { color: '#1B873F', fontSize: 13, textAlign: 'center' },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.gold,
  },
  newBtnText: { color: Colors.white, fontSize: 15 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.grey100,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.dark, padding: 0 },
  list: { gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.grey100,
  },
  cardInfo: { flex: 1, gap: 6 },
  cardName: { fontSize: 15, color: Colors.dark },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  categoryChip: {
    backgroundColor: '#FEF9EE',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  categoryText: { fontSize: 11, color: Colors.goldDark },
  stockText: { fontSize: 12, color: Colors.grey500 },
  cardPrice: { fontSize: 15, color: Colors.goldDark },
  stateBox: {
    padding: 28,
    backgroundColor: Colors.white,
    borderRadius: 16,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.grey100,
  },
  stateTitle: { fontSize: 15, color: Colors.dark, marginTop: 4 },
  stateText: { fontSize: 13, color: Colors.grey400, textAlign: 'center' },
  retryText: { fontSize: 14, color: Colors.goldDark, marginTop: 6 },
});