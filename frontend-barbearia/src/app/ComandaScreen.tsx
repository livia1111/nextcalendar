import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

// ─── Types ────────────────────────────────────────────────────────────────────

type Item = {
  id: string;
  nome: string;
  preco: number;
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const INITIAL_ITEMS: Item[] = [
  { id: '1', nome: 'Corte Degradê',     preco: 70 },
  { id: '2', nome: 'Hidratação',        preco: 30 },
  { id: '3', nome: 'Pomada Modeladora', preco: 50 },
];

const FORMAS_PAGAMENTO = [
  'Cartão de Crédito',
  'Cartão de Débito',
  'Dinheiro',
  'PIX',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// ─── Component ────────────────────────────────────────────────────────────────

export default function ComandaScreen() {
  const router = useRouter();

  const [items, setItems]           = useState<Item[]>(INITIAL_ITEMS);
  const [desconto]                  = useState<number>(15);
  const [pagamento, setPagamento]   = useState<string>(FORMAS_PAGAMENTO[0]);
  const [dropdownOpen, setDropdown] = useState(false);

  const subtotal = items.reduce((acc, i) => acc + i.preco, 0);
  const total    = Math.max(0, subtotal - desconto);

  const handleRemover = (id: string) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comanda</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Text style={styles.headerIcon}>⋮</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar ── */}
        <View style={styles.avatarRow}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: 'https://i.pravatar.cc/150?img=12' }}
              style={styles.avatar}
            />
          </View>
        </View>

        {/* ── Lista de Itens ── */}
        <View style={styles.card}>
          {items.map((item, idx) => (
            <View
              key={item.id}
              style={[
                styles.itemRow,
                idx < items.length - 1 && styles.itemRowBorder,
              ]}
            >
              <Text style={styles.itemNome}>{item.nome}</Text>
              <View style={styles.itemRight}>
                <Text style={styles.itemPreco}>{formatBRL(item.preco)}</Text>
                <TouchableOpacity
                  onPress={() => handleRemover(item.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.trashIcon}>🗑</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* ── Botões Adicionar ── */}
        <View style={styles.addRow}>
          <TouchableOpacity style={styles.addBtn}>
            <Text style={styles.addBtnText}>＋  Adicionar Serviços</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn}>
            <Text style={styles.addBtnText}>＋  Adicionar Produtos</Text>
          </TouchableOpacity>
        </View>

        {/* ── Desconto ── */}
        <View style={styles.card}>
          <View style={styles.descontoRow}>
            <Text style={styles.descontoLabel}>Aplicar Desconto</Text>
            <Text style={styles.descontoValor}>{formatBRL(desconto)}</Text>
          </View>
          <Text style={styles.descontoNegativo}>-{formatBRL(desconto)}</Text>
        </View>

        {/* ── Divisor ── */}
        <View style={styles.divider} />

        {/* ── Total ── */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalValor}>{formatBRL(total)}</Text>
        </View>

        {/* ── Forma de Pagamento ── */}
        <Text style={styles.pagamentoLabel}>Forma de Pagamento</Text>
        <TouchableOpacity
          style={[styles.dropdown, dropdownOpen && styles.dropdownAberto]}
          onPress={() => setDropdown((v) => !v)}
          activeOpacity={0.8}
        >
          <Text style={styles.dropdownText}>{pagamento}</Text>
          <Text style={styles.dropdownSeta}>{dropdownOpen ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {dropdownOpen && (
          <View style={styles.dropdownMenu}>
            {FORMAS_PAGAMENTO.map((fp) => (
              <TouchableOpacity
                key={fp}
                style={styles.dropdownItem}
                onPress={() => { setPagamento(fp); setDropdown(false); }}
              >
                <Text style={styles.dropdownItemTexto}>{fp}</Text>
                {fp === pagamento && (
                  <Text style={styles.dropdownCheck}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.finalizarBtn} activeOpacity={0.85}>
          <Text style={styles.finalizarText}>Finalizar Comanda</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Palette ──────────────────────────────────────────────────────────────────
const BG        = '#FFFFFF';
const SURFACE   = '#F7F7F5';
const SURFACE2  = '#F0F0EC';
const GOLD      = '#D9B76A';
const GOLD_DIM  = '#B8922A';
const TEXT_PRI  = '#1A1A1A';
const TEXT_SEC  = '#666666';
const TEXT_MUT  = '#AAAAAA';
const BORDER    = '#E8E8E0';
const RED       = '#CC4444';
const RED_BG    = '#FFF5F5';

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: BG,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    fontSize: 22,
    color: GOLD,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_PRI,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24 },

  // Avatar
  avatarRow: { marginBottom: 24 },
  avatarWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: GOLD,
  },
  avatar: { width: '100%', height: '100%' },

  // Card
  card: {
    backgroundColor: SURFACE,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },

  // Item row
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  itemNome: {
    fontSize: 14,
    color: TEXT_PRI,
    flex: 1,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  itemPreco: {
    fontSize: 14,
    color: GOLD,
    fontWeight: '600',
  },
  trashIcon: {
    fontSize: 16,
  },

  // Botões adicionar
  addRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  addBtn: {
    flex: 1,
    backgroundColor: SURFACE,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GOLD_DIM,
  },
  addBtnText: {
    fontSize: 12,
    color: GOLD,
    fontWeight: '600',
  },

  // Desconto
  descontoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 14,
    paddingBottom: 4,
  },
  descontoLabel: {
    fontSize: 14,
    color: TEXT_PRI,
  },
  descontoValor: {
    fontSize: 14,
    color: TEXT_SEC,
    fontWeight: '500',
  },
  descontoNegativo: {
    textAlign: 'right',
    color: RED,
    fontSize: 13,
    fontWeight: '600',
    paddingBottom: 14,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginBottom: 18,
  },

  // Total
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 28,
  },
  totalLabel: {
    fontSize: 30,
    fontWeight: '900',
    color: TEXT_PRI,
    letterSpacing: -0.5,
  },
  totalValor: {
    fontSize: 22,
    fontWeight: '700',
    color: GOLD,
  },

  // Pagamento
  pagamentoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_SEC,
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  dropdownAberto: {
    borderColor: GOLD,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dropdownText: {
    fontSize: 14,
    color: TEXT_PRI,
  },
  dropdownSeta: {
    fontSize: 11,
    color: GOLD,
  },
  dropdownMenu: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: GOLD,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    overflow: 'hidden',
    marginBottom: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  dropdownItemTexto: {
    fontSize: 14,
    color: TEXT_PRI,
  },
  dropdownCheck: {
    color: GOLD,
    fontWeight: 'bold',
    fontSize: 14,
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: BG,
    ...Platform.select({
      ios:     { paddingBottom: 28 },
      android: { paddingBottom: 16 },
      default: {},
    }),
  },
  finalizarBtn: {
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#C4963A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  finalizarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
