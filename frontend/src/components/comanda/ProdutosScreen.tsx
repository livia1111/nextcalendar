/**
 * Componente unificado de Produtos (Gestor e Profissional).
 * - Gestor: CRUD completo (criar, editar, excluir, estoque).
 * - Profissional: Somente leitura (busca e catálogo).
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
import { useAuth } from '@/context/AuthContext';
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
  const { user } = useAuth();
  const isManager = user?.role === 'MANAGER';

  const { establishmentId: loggedEstablishmentId } = useEstablishment();
  const establishmentId = loggedEstablishmentId || DEFAULT_ESTABLISHMENT_ID;

  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [feedback, setFeedback] = useState('');

  // modal: undefined = fechado | null = novo | produto = edição (apenas gestor)
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
    if (!isManager) return;
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
    if (!isManager) return;
    await deleteProduct(establishmentId, productId);
    setFeedback('Produto excluído.');
    await load();
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q),
    );
  }, [products, query]);

  function goBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(isManager ? '/(gestor)/perfil' : '/(profissional)/perfil');
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack} activeOpacity={0.7}>
          <ChevronLeftIcon size={20} color={Colors.goldDark} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: fontSemiBold }]}>
          {isManager ? 'Gestão de Produtos' : 'Produtos do Estabelecimento'}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.gold} />}>
        <Text style={[styles.subtitle, { fontFamily: fontRegular }]}>
          {isManager
            ? 'Cadastre e gerencie os produtos vendidos no estabelecimento. Eles ficam disponíveis para adicionar nas comandas.'
            : 'Consulte os produtos disponíveis para adicionar nas comandas dos seus atendimentos.'}
        </Text>

        {feedback ? (
          <View style={styles.feedbackBox}>
            <Text style={[styles.feedbackText, { fontFamily: fontSemiBold }]}>{feedback}</Text>
          </View>
        ) : null}

        {/* Botão Novo Produto apenas visível para Gestor */}
        {isManager && (
          <TouchableOpacity style={styles.newBtn} activeOpacity={0.85} onPress={() => setFormTarget(null)}>
            <PlusIcon size={18} color={Colors.white} />
            <Text style={[styles.newBtnText, { fontFamily: fontSemiBold }]}>Novo Produto</Text>
          </TouchableOpacity>
        )}

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
              {products.length === 0
                ? isManager
                  ? 'Toque em "Novo Produto" para cadastrar o primeiro.'
                  : 'Nenhum produto disponível no momento.'
                : 'Tente outro termo de busca.'}
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
                  activeOpacity={isManager ? 0.75 : 1}
                  onPress={() => {
                    if (isManager) setFormTarget(p);
                  }}>
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

      {/* Modal só abre para Gestor */}
      {isManager && (
        <ProductFormModal
          visible={formTarget !== undefined}
          product={formTarget ?? null}
          onClose={() => setFormTarget(undefined)}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },

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
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, color: Colors.dark },

  content: { padding: 20, gap: 14 },
  subtitle: { fontSize: 13, color: Colors.grey500, lineHeight: 18 },

  feedbackBox: {
    backgroundColor: '#E8F8EE',
    borderWidth: 1,
    borderColor: '#C2ECCF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  feedbackText: { color: '#1B873F', fontSize: 13 },

  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.gold,
  },
  newBtnText: { color: Colors.white, fontSize: 15 },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.grey100,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.dark, padding: 0 },

  stateBox: { paddingVertical: 48, alignItems: 'center', justifyContent: 'center', gap: 8 },
  stateTitle: { fontSize: 16, color: Colors.dark, marginTop: 4 },
  stateText: { fontSize: 13, color: Colors.grey500, textAlign: 'center', maxWidth: 260 },
  retryText: { fontSize: 13, color: Colors.goldDark, marginTop: 4 },

  list: { gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.grey100,
    backgroundColor: Colors.white,
  },
  cardInfo: { flex: 1, gap: 6 },
  cardName: { fontSize: 15, color: Colors.dark },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryChip: {
    backgroundColor: '#FEF9EE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDEFD0',
  },
  categoryText: { fontSize: 11, color: Colors.goldDark },
  stockText: { fontSize: 11, color: Colors.grey500 },
  cardPrice: { fontSize: 15, color: Colors.dark },
});
