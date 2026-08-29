import React, { useState, useEffect, useCallback } from 'react';
import { criarServico, listarServicos, atualizarServico, excluirServico, ServiceResponse } from '../services/serviceServices';
import { ESTABLISHMENT_ID } from '../services/api';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Servico {
  id: string;
  nome: string;
  preco: string;
  comissao: number;
  duracao: string;
}

type Tela = 'lista' | 'criar' | 'editar';

const OPCOES_DURACAO = ['15 min', '20 min', '30 min', '45 min', '60 min', '90 min'];

// ─── Converte ServiceResponse do backend → Servico local ─────────────────────
function toServico(s: ServiceResponse): Servico {
  return {
    id:       s.id,
    nome:     s.name,
    preco:    String(s.price).replace('.', ','),
    comissao: 0, // campo não retornado pelo backend ainda
    duracao:  `${s.duration} min`,
  };
}

// ─── Componente principal ──────────────────────────────────────────────────────

export default function ServicosScreen() {
  const [tela, setTela]                 = useState<Tela>('lista');
  const [servicos, setServicos]         = useState<Servico[]>([]);
  const [servicoSelecionado, setServicoSelecionado] = useState<Servico | null>(null);

  // Campos do formulário
  const [formNome, setFormNome]         = useState('');
  const [formPreco, setFormPreco]       = useState('');
  const [formComissao, setFormComissao] = useState('');
  const [formDuracao, setFormDuracao]   = useState('');

  // Dropdowns
  const [dropdownNomeAberto, setDropdownNomeAberto]       = useState(false);
  const [dropdownDuracaoAberto, setDropdownDuracaoAberto] = useState(false);

  // Loading e erro
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista]   = useState<string | null>(null);
  const [salvando, setSalvando]     = useState(false);

  // Simula permissão: admin pode editar comissão
  const isAdmin = false;

  // ─── Carregar serviços do backend ──────────────────────────────────────────
  const carregarServicos = useCallback(async () => {
    try {
      setCarregando(true);
      setErroLista(null);
      const lista = await listarServicos(ESTABLISHMENT_ID);
      setServicos(lista.map(toServico));
    } catch (e: any) {
      setErroLista(e.message ?? 'Erro ao carregar serviços.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregarServicos(); }, [carregarServicos]);

  // ── Abrir edição ──
  function abrirEdicao(servico: Servico) {
    setServicoSelecionado(servico);
    setFormNome(servico.nome);
    setFormPreco(servico.preco);
    setFormComissao(String(servico.comissao));
    setFormDuracao(servico.duracao);
    setDropdownNomeAberto(false);
    setDropdownDuracaoAberto(false);
    setTela('editar');
  }

  // ── Abrir criação ──
  function abrirCriacao() {
    setServicoSelecionado(null);
    setFormNome('');
    setFormPreco('');
    setFormComissao('');
    setFormDuracao('');
    setDropdownNomeAberto(false);
    setDropdownDuracaoAberto(false);
    setTela('criar');
  }

  // ── Salvar (cria ou atualiza) ──
  async function salvar() {
    if (!formNome || !formPreco || !formDuracao) {
      Alert.alert('Atenção', 'Preencha Nome, Preço e Duração.');
      return;
    }

    const duracaoMin = parseInt(formDuracao, 10) || 0;
    const precoNum   = parseFloat(formPreco.replace(',', '.')) || 0;

    try {
      setSalvando(true);

      if (tela === 'editar' && servicoSelecionado) {
        // ── Edição: chama o backend (PUT) e recarrega a lista ──
        await atualizarServico(ESTABLISHMENT_ID, servicoSelecionado.id, {
          name:     formNome,
          price:    precoNum,
          duration: duracaoMin,
        });
      } else {
        // ── Criação: chama o backend (POST) ──
        await criarServico(ESTABLISHMENT_ID, {
          name:     formNome,
          price:    precoNum,
          duration: duracaoMin,
          category: formNome,
        });
      }

      // Recarrega a lista diretamente do banco
      await carregarServicos();
      setTela('lista');
    } catch (erro: any) {
      Alert.alert('Erro ao salvar serviço', erro.message ?? 'Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  // ── Excluir ──
  function excluir() {
    if (!servicoSelecionado) return;
    Alert.alert(
      'Excluir serviço',
      `Deseja excluir "${servicoSelecionado.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              setSalvando(true);
              await excluirServico(ESTABLISHMENT_ID, servicoSelecionado.id);
              await carregarServicos();
              setTela('lista');
            } catch (erro: any) {
              Alert.alert('Erro ao excluir serviço', erro.message ?? 'Tente novamente.');
            } finally {
              setSalvando(false);
            }
          },
        },
      ],
    );
  }

  // ─── Tela: Lista ─────────────────────────────────────────────────────────────

  if (tela === 'lista') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerIconeBtn}>
            <Text style={styles.headerIcone}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitulo}>Serviços e Comissão</Text>
          <TouchableOpacity style={styles.headerIconeBtn}>
            <Text style={styles.headerIcone}>⋮</Text>
          </TouchableOpacity>
        </View>

        {/* Banner informativo */}
        <View style={styles.bannerInfo}>
          <View style={styles.bannerIconeCirculo}>
            <Text style={styles.bannerIconeTexto}>i</Text>
          </View>
          <Text style={styles.bannerTexto}>Gerencie seus serviços.</Text>
        </View>

        {/* Lista */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.secaoTitulo}>Serviços oferecidos</Text>

          {/* Carregando */}
          {carregando && (
            <Text style={styles.textoInfo}>Carregando serviços...</Text>
          )}

          {/* Erro */}
          {!carregando && erroLista && (
            <View style={styles.erroContainer}>
              <Text style={styles.erroTexto}>{erroLista}</Text>
              <TouchableOpacity style={styles.btnRetentar} onPress={carregarServicos}>
                <Text style={styles.btnRetentarTexto}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Lista vazia */}
          {!carregando && !erroLista && servicos.length === 0 && (
            <Text style={styles.textoInfo}>Nenhum serviço cadastrado ainda.</Text>
          )}

          {/* Itens */}
          {servicos.map(servico => (
            <TouchableOpacity
              key={servico.id}
              style={styles.itemServico}
              onPress={() => abrirEdicao(servico)}
              activeOpacity={0.75}
            >
              <Text style={styles.itemNome}>{servico.nome}</Text>
              <View style={styles.itemDireita}>
                <Text style={styles.itemPreco}>R$ {servico.preco}</Text>
                <Text style={styles.itemSeta}>›</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Rodapé */}
        <View style={styles.rodape}>
          <TouchableOpacity style={styles.btnPrincipal} onPress={abrirCriacao} activeOpacity={0.85}>
            <Text style={styles.btnPrincipalTexto}>Adicionar serviço</Text>
          </TouchableOpacity>
        </View>

        <BottomNav telaAtiva="servicos" />
      </SafeAreaView>
    );
  }

  // ─── Tela: Criar / Editar ────────────────────────────────────────────────────

  const isEditar = tela === 'editar';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconeBtn} onPress={() => setTela('lista')}>
          <Text style={styles.headerIcone}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>{isEditar ? 'Editar serviço' : 'Criar serviço'}</Text>
        <TouchableOpacity style={styles.headerIconeBtn}>
          <Text style={styles.headerIcone}>⋮</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Nome do serviço */}
        <Text style={styles.label}>Nome do serviço</Text>
        <TextInput
          style={styles.inputSimples}
          value={formNome}
          onChangeText={setFormNome}
          placeholder="Ex: Corte Masculino, Barba..."
          placeholderTextColor="#BBBBBB"
          autoCapitalize="words"
          maxLength={120}
        />

        {/* Preço */}
        <Text style={styles.label}>Preço</Text>
        <View style={styles.inputWrapper}>
          <Text style={styles.inputPrefixo}>R$</Text>
          <TextInput
            style={styles.inputComPrefixo}
            value={formPreco}
            onChangeText={setFormPreco}
            placeholder="0,00"
            placeholderTextColor="#BBBBBB"
            keyboardType="numeric"
          />
        </View>

        {/* Comissão */}
        <Text style={styles.label}>Comissão (%)</Text>
        <TextInput
          style={[styles.inputSimples, !isAdmin && styles.inputDesabilitado]}
          value={formComissao ? `${formComissao}%` : ''}
          onChangeText={v => setFormComissao(v.replace('%', '').trim())}
          placeholder="0%"
          placeholderTextColor="#CCCCCC"
          keyboardType="numeric"
          editable={isAdmin}
        />
        {!isAdmin && (
          <Text style={styles.textoRestricao}>Comissão editável apenas pelo administrador</Text>
        )}

        {/* Duração */}
        <Text style={styles.label}>Duração</Text>
        <TouchableOpacity
          style={[styles.inputDropdown, dropdownDuracaoAberto && styles.inputDropdownAberto]}
          onPress={() => {
            setDropdownDuracaoAberto(p => !p);
            setDropdownNomeAberto(false);
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.inputDropdownTexto, !formDuracao && styles.placeholderTexto]}>
            {formDuracao || 'Selecione a duração...'}
          </Text>
          <Text style={styles.dropdownSeta}>{dropdownDuracaoAberto ? '∧' : '∨'}</Text>
        </TouchableOpacity>
        {dropdownDuracaoAberto && (
          <View style={styles.dropdownMenu}>
            {OPCOES_DURACAO.map(op => (
              <TouchableOpacity
                key={op}
                style={styles.dropdownItem}
                onPress={() => { setFormDuracao(op); setDropdownDuracaoAberto(false); }}
              >
                <Text style={styles.dropdownItemTexto}>{op}</Text>
                {formDuracao === op && <Text style={styles.dropdownCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Excluir (só na edição) */}
        {isEditar && (
          <TouchableOpacity style={styles.btnExcluir} onPress={excluir} activeOpacity={0.85} disabled={salvando}>
            <Text style={styles.btnExcluirTexto}>Excluir serviço</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Rodapé */}
      <View style={styles.rodape}>
        <TouchableOpacity
          style={[styles.btnPrincipal, salvando && styles.btnPrincipalDesabilitado]}
          onPress={salvar}
          activeOpacity={0.85}
          disabled={salvando}
        >
          <Text style={styles.btnPrincipalTexto}>
            {salvando ? 'Salvando...' : isEditar ? 'Salvar alterações' : 'Criar serviço'}
          </Text>
        </TouchableOpacity>
      </View>

      <BottomNav telaAtiva="servicos" />
    </SafeAreaView>
  );
}

// ─── Bottom Navigation ────────────────────────────────────────────────────────

function BottomNav({ telaAtiva }: { telaAtiva: string }) {
  const itens = [
    { chave: 'home',      icone: '⌂',  label: 'Home' },
    { chave: 'historico', icone: '☰',  label: 'Histórico' },
    { chave: 'servicos',  icone: '✂',  label: '',      central: true },
    { chave: 'mensagens', icone: '✉',  label: 'Mensagens' },
    { chave: 'conta',     icone: '♟',  label: 'Conta' },
  ];

  return (
    <View style={styles.bottomNav}>
      {itens.map(item => (
        <TouchableOpacity key={item.chave} style={styles.bottomNavItem} activeOpacity={0.7}>
          {item.central ? (
            <View style={styles.bottomNavCentral}>
              <Text style={styles.bottomNavCentralIcone}>{item.icone}</Text>
            </View>
          ) : (
            <>
              <Text style={[styles.bottomNavIcone, telaAtiva === item.chave && styles.bottomNavAtivo]}>
                {item.icone}
              </Text>
              <Text style={[styles.bottomNavLabel, telaAtiva === item.chave && styles.bottomNavAtivoLabel]}>
                {item.label}
              </Text>
            </>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F5',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEA',
  },
  headerIconeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcone: {
    fontSize: 20,
    color: '#1A1A1A',
  },
  headerTitulo: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
    textAlign: 'center',
  },

  // Banner info
  bannerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBF0D5',
    borderWidth: 1,
    borderColor: '#E8CF8A',
    borderRadius: 10,
    margin: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  bannerIconeCirculo: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#B8922A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerIconeTexto: {
    fontSize: 12,
    color: '#B8922A',
    fontWeight: 'bold',
  },
  bannerTexto: {
    color: '#7A6010',
    fontSize: 13,
    flex: 1,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  formContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
  },

  // Seção
  secaoTitulo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 14,
    marginTop: 4,
  },

  // Item lista
  itemServico: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EBEBEA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  itemNome: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  itemDireita: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemBadge: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 36,
    alignItems: 'center',
  },
  itemBadgeTexto: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  itemPorcento: {
    fontSize: 14,
    color: '#555555',
    fontWeight: '500',
  },
  itemSeta: {
    fontSize: 22,
    color: '#BBBBBB',
    marginLeft: 4,
  },
  itemPreco: {
    fontSize: 13,
    color: '#555555',
    fontWeight: '500',
    marginRight: 6,
  },

  // Estados da lista
  textoInfo: {
    textAlign: 'center',
    color: '#AAAAAA',
    fontSize: 14,
    marginTop: 40,
  },
  erroContainer: {
    alignItems: 'center',
    marginTop: 40,
    gap: 12,
  },
  erroTexto: {
    color: '#CC4444',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  btnRetentar: {
    backgroundColor: '#FBF0D5',
    borderWidth: 1,
    borderColor: '#D9B76A',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  btnRetentarTexto: {
    color: '#B8922A',
    fontWeight: '600',
    fontSize: 13,
  },

  // Rodapé
  rodape: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F7F7F5',
  },
  btnPrincipal: {
    backgroundColor: '#D9B76A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#C4963A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  btnPrincipalTexto: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  btnPrincipalDesabilitado: {
    opacity: 0.6,
  },

  // Formulário
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    marginTop: 18,
  },

  inputSimples: {
    backgroundColor: '#FFFFFF',
    color: '#1A1A1A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#DDDDDA',
  },
  inputDesabilitado: {
    backgroundColor: '#F4F4F1',
    color: '#BBBBBB',
    borderColor: '#E4E4E0',
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDDDDA',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  inputPrefixo: {
    fontSize: 14,
    color: '#555555',
    marginRight: 6,
    fontWeight: '500',
  },
  inputComPrefixo: {
    flex: 1,
    color: '#1A1A1A',
    fontSize: 14,
    padding: 0,
  },

  inputDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDDDDA',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  inputDropdownAberto: {
    borderColor: '#D9B76A',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  inputDropdownTexto: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  placeholderTexto: {
    color: '#BBBBBB',
  },
  dropdownSeta: {
    fontSize: 14,
    color: '#888888',
  },

  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#D9B76A',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: '#F2F2EE',
  },
  dropdownItemTexto: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  dropdownCheck: {
    color: '#D9B76A',
    fontWeight: 'bold',
    fontSize: 14,
  },

  textoRestricao: {
    fontSize: 11,
    color: '#AAAAAA',
    marginTop: 6,
    marginLeft: 2,
  },

  btnExcluir: {
    marginTop: 30,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFCCCC',
  },
  btnExcluirTexto: {
    color: '#CC4444',
    fontSize: 14,
    fontWeight: '600',
  },

  // Bottom Nav
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEA',
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
  },
  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  bottomNavIcone: {
    fontSize: 20,
    color: '#AAAAAA',
    marginBottom: 2,
  },
  bottomNavAtivo: {
    color: '#D9B76A',
  },
  bottomNavLabel: {
    fontSize: 10,
    color: '#AAAAAA',
  },
  bottomNavAtivoLabel: {
    color: '#D9B76A',
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
