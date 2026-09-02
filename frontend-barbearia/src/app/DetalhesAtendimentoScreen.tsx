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

// ─── Constants ────────────────────────────────────────────────────────────────

const PHOTO_SIZE = 72;

const SERVICOS = [
  'Corte e barba',
  'Corte simples',
  'Barba',
  'Hidratação',
  'Relaxamento',
];

const FOTOS = [
  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=200&q=80',
  'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=200&q=80',
  'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=200&q=80',
  'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=200&q=80',
];

const ANOTACOES = [
  'Cliente prefere máquina 2 nas laterais.',
  'Degradê alto começando na marcação do osso.',
  'Topo com tesoura para manter volume.',
  'Alérgico a loção com alcool',
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function DetalhesAtendimentoScreen() {
  const router = useRouter();
  const [servicoSelecionado, setServico] = useState(SERVICOS[0]);
  const [dropdownAberto, setDropdown]   = useState(false);
  const [abaAtiva, setAba]              = useState<'home' | 'historico' | 'conta'>('historico');

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Text style={styles.headerIconText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes do atendimento</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Data + Título ── */}
        <View style={styles.eventRow}>
          <View style={styles.dateBlock}>
            <Text style={styles.dateDay}>15</Text>
            <Text style={styles.dateMonth}>JAN</Text>
            <Text style={styles.dateYear}>2026</Text>
          </View>
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle}>Corte com Barba</Text>
            <Text style={styles.eventSub}>Por Gabriel Siqueira</Text>
          </View>
        </View>

        {/* ── Serviço realizado ── */}
        <Text style={styles.sectionLabel}>Serviço realizado</Text>
        <TouchableOpacity
          style={[styles.dropdown, dropdownAberto && styles.dropdownAberto]}
          onPress={() => setDropdown((v) => !v)}
          activeOpacity={0.8}
        >
          <Text style={styles.dropdownText}>{servicoSelecionado}</Text>
          <Text style={styles.dropdownSeta}>{dropdownAberto ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {dropdownAberto && (
          <View style={styles.dropdownMenu}>
            {SERVICOS.map((s) => (
              <TouchableOpacity
                key={s}
                style={styles.dropdownItem}
                onPress={() => { setServico(s); setDropdown(false); }}
              >
                <Text style={styles.dropdownItemTexto}>{s}</Text>
                {s === servicoSelecionado && (
                  <Text style={styles.dropdownCheck}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Fotos do Resultado ── */}
        <Text style={styles.sectionLabel}>Fotos do Resultado</Text>
        <View style={styles.fotosRow}>
          {FOTOS.map((uri, idx) => (
            <TouchableOpacity key={idx} activeOpacity={0.85}>
              <Image source={{ uri }} style={styles.foto} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Anotações técnicas ── */}
        <Text style={styles.sectionLabel}>Anotações técnicas(privado)</Text>
        <View style={styles.anotacoesCard}>
          {ANOTACOES.map((nota, idx) => (
            <View key={idx} style={styles.anotacaoRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.anotacaoTexto}>{nota}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── Botões de Ação ── */}
      <View style={styles.acoesBtns}>
        <TouchableOpacity style={styles.btnEditar} activeOpacity={0.8}>
          <Text style={styles.btnEditarTexto}>Editar informações</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnNovo} activeOpacity={0.85}>
          <Text style={styles.btnNovoTexto}>Novo atendimento</Text>
        </TouchableOpacity>
      </View>

      {/* ── Bottom Nav ── */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.bottomNavItem}
          onPress={() => setAba('home')}
        >
          <Text style={[styles.bottomNavIcone, abaAtiva === 'home' && styles.bottomNavAtivo]}>⌂</Text>
          <Text style={[styles.bottomNavLabel, abaAtiva === 'home' && styles.bottomNavAtivoLabel]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomNavItem}
          onPress={() => setAba('historico')}
        >
          <Text style={[styles.bottomNavIcone, abaAtiva === 'historico' && styles.bottomNavAtivo]}>⊞</Text>
          <Text style={[styles.bottomNavLabel, abaAtiva === 'historico' && styles.bottomNavAtivoLabel]}>Histórico</Text>
        </TouchableOpacity>

        {/* Botão central */}
        <TouchableOpacity style={styles.bottomNavCentral}>
          <Text style={styles.bottomNavCentralIcone}>✂</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomNavItem}
          onPress={() => setAba('conta')}
        >
          <Text style={[styles.bottomNavIcone, abaAtiva === 'conta' && styles.bottomNavAtivo]}>⊙</Text>
          <Text style={[styles.bottomNavLabel, abaAtiva === 'conta' && styles.bottomNavAtivoLabel]}>Conta</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Palette ──────────────────────────────────────────────────────────────────

const GOLD      = '#D9B76A';
const GOLD_DIM  = '#B8922A';
const BG        = '#FFFFFF';
const SURFACE   = '#F7F7F5';
const NOTES_BG  = '#FBF5E0';
const TEXT_PRI  = '#1A1A1A';
const TEXT_SEC  = '#666666';
const TEXT_MUT  = '#AAAAAA';
const BORDER    = '#E8E8E0';

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
  headerIconText: {
    fontSize: 22,
    color: TEXT_PRI,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: TEXT_PRI,
    marginLeft: 8,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },

  // Data + Título
  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  dateBlock: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 36,
  },
  dateDay: {
    fontSize: 20,
    fontWeight: '800',
    color: GOLD,
    lineHeight: 22,
  },
  dateMonth: {
    fontSize: 13,
    fontWeight: '700',
    color: GOLD,
    lineHeight: 16,
  },
  dateYear: {
    fontSize: 13,
    fontWeight: '700',
    color: GOLD,
    lineHeight: 16,
  },
  eventInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRI,
    marginBottom: 2,
  },
  eventSub: {
    fontSize: 13,
    color: TEXT_SEC,
  },

  // Section label
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_PRI,
    marginBottom: 10,
  },

  // Dropdown
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 20,
  },
  dropdownAberto: {
    borderColor: GOLD,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginBottom: 0,
  },
  dropdownText: {
    fontSize: 14,
    color: TEXT_PRI,
  },
  dropdownSeta: {
    fontSize: 11,
    color: TEXT_MUT,
  },
  dropdownMenu: {
    backgroundColor: BG,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: GOLD,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
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

  // Fotos
  fotosRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  foto: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE * 1.1,
    borderRadius: 8,
    backgroundColor: SURFACE,
  },

  // Anotações
  anotacoesCard: {
    backgroundColor: NOTES_BG,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginBottom: 8,
  },
  anotacaoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bullet: {
    fontSize: 14,
    color: TEXT_PRI,
    lineHeight: 20,
  },
  anotacaoTexto: {
    flex: 1,
    fontSize: 14,
    color: TEXT_PRI,
    lineHeight: 20,
  },

  // Botões de ação
  acoesBtns: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: BG,
  },
  btnEditar: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: GOLD,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: BG,
  },
  btnEditarTexto: {
    color: GOLD_DIM,
    fontSize: 14,
    fontWeight: '600',
  },
  btnNovo: {
    flex: 1,
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#C4963A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  btnNovoTexto: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Bottom Nav
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BG,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  bottomNavIcone: {
    fontSize: 20,
    color: TEXT_MUT,
    marginBottom: 2,
  },
  bottomNavAtivo: {
    color: GOLD,
  },
  bottomNavLabel: {
    fontSize: 10,
    color: TEXT_MUT,
  },
  bottomNavAtivoLabel: {
    color: GOLD,
    fontWeight: '600',
  },
  bottomNavCentral: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  bottomNavCentralIcone: {
    fontSize: 20,
    color: '#FFFFFF',
  },
});
