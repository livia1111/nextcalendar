import React, { useState, useEffect, useCallback } from 'react';
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
  Switch,
  Alert,
} from 'react-native';
import {
  listarProfissionais,
  buscarProfissional,
  criarProfissional,
  atualizarProfissional,
  excluirProfissional,
  ProfessionalMin,
  ProfessionalDetails,
} from '../services/profissionaisService';
import { ESTABLISHMENT_ID } from '../services/api';

type Tela = 'lista' | 'criar' | 'editar';

export default function UsuariosScreen() {
  const [tela, setTela] = useState<Tela>('lista');
  const [profissionais, setProfissionais] = useState<ProfessionalMin[]>([]);
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [busca, setBusca] = useState('');

  // Campos do formulário
  const [formNome, setFormNome] = useState('');
  const [formApelido, setFormApelido] = useState('');
  const [formCpf, setFormCpf] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formSenha, setFormSenha] = useState('');
  const [formTelefone, setFormTelefone] = useState('');
  const [formComissao, setFormComissao] = useState('');
  const [formAtivo, setFormAtivo] = useState(true);

  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  // ─── Carregar profissionais do backend ─────────────────────────────────────
  const carregarProfissionais = useCallback(async () => {
    try {
      setCarregando(true);
      setErroLista(null);
      const lista = await listarProfissionais(ESTABLISHMENT_ID);
      setProfissionais(lista);
    } catch (e: any) {
      setErroLista(e.message ?? 'Erro ao carregar profissionais.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregarProfissionais(); }, [carregarProfissionais]);

  const profissionaisFiltrados = profissionais.filter(p =>
    p.name.toLowerCase().includes(busca.toLowerCase()),
  );

  function limparForm() {
    setFormNome(''); setFormApelido(''); setFormCpf(''); setFormEmail('');
    setFormSenha(''); setFormTelefone(''); setFormComissao(''); setFormAtivo(true);
  }

  function abrirCriacao() {
    setSelecionadoId(null);
    limparForm();
    setTela('criar');
  }

  // ── Abrir edição: busca os detalhes completos no backend ──
  async function abrirEdicao(prof: ProfessionalMin) {
    try {
      setSalvando(true);
      const detalhes: ProfessionalDetails = await buscarProfissional(ESTABLISHMENT_ID, prof.id);
      setSelecionadoId(prof.id);
      setFormNome(detalhes.name);
      setFormApelido(detalhes.nickname ?? '');
      setFormCpf(detalhes.cpf);
      setFormEmail(detalhes.email);
      setFormSenha('');
      setFormTelefone(detalhes.phone);
      setFormComissao(detalhes.commission != null ? String(detalhes.commission) : '');
      setFormAtivo(detalhes.active);
      setTela('editar');
    } catch (e: any) {
      Alert.alert('Erro', e.message ?? 'Não foi possível carregar o profissional.');
    } finally {
      setSalvando(false);
    }
  }

  // ── Salvar (cria ou atualiza) ──
  async function salvar() {
    if (!formNome || !formTelefone || !formEmail) {
      Alert.alert('Atenção', 'Preencha Nome, E-mail e Telefone.');
      return;
    }
    if (tela === 'criar' && (!formCpf || !formSenha)) {
      Alert.alert('Atenção', 'CPF e Senha são obrigatórios para um novo profissional.');
      return;
    }

    try {
      setSalvando(true);
      const comissaoNum = formComissao ? Number(formComissao.replace(',', '.')) : undefined;

      if (tela === 'editar' && selecionadoId) {
        await atualizarProfissional(ESTABLISHMENT_ID, selecionadoId, {
          name: formNome,
          nickname: formApelido || undefined,
          email: formEmail,
          phone: formTelefone,
          commission: comissaoNum,
          active: formAtivo,
        });
      } else {
        await criarProfissional(ESTABLISHMENT_ID, {
          name: formNome,
          nickname: formApelido || undefined,
          cpf: formCpf,
          email: formEmail,
          password: formSenha,
          phone: formTelefone,
          commission: comissaoNum,
        });
      }

      await carregarProfissionais();
      setTela('lista');
    } catch (e: any) {
      Alert.alert('Erro ao salvar profissional', e.message ?? 'Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  // ── Excluir ──
  function excluir() {
    if (!selecionadoId) return;
    Alert.alert(
      'Excluir profissional',
      `Deseja excluir "${formNome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              setSalvando(true);
              await excluirProfissional(ESTABLISHMENT_ID, selecionadoId);
              await carregarProfissionais();
              setTela('lista');
            } catch (e: any) {
              Alert.alert('Erro ao excluir', e.message ?? 'Tente novamente.');
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
        <StatusBar barStyle="dark-content" backgroundColor="#F5F5F0" />

        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitulo}>Usuários</Text>
            <Text style={styles.headerSubtitulo}>Gerenciar profissionais</Text>
          </View>
          <TouchableOpacity style={styles.btnAdicionar} onPress={abrirCriacao}>
            <Text style={styles.btnAdicionarTexto}>+ Adicionar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buscaContainer}>
          <Text style={styles.buscaIcone}>🔍</Text>
          <TextInput
            style={styles.buscaInput}
            placeholder="Buscar profissional..."
            placeholderTextColor="#AAAAAA"
            value={busca}
            onChangeText={setBusca}
          />
        </View>

        <Text style={styles.contador}>
          Exibindo {profissionaisFiltrados.length} de {profissionais.length} profissionais
        </Text>

        <ScrollView contentContainerStyle={styles.lista} showsVerticalScrollIndicator={false}>
          {carregando && <Text style={styles.textoInfo}>Carregando...</Text>}

          {!carregando && erroLista && (
            <View style={styles.erroContainer}>
              <Text style={styles.erroTexto}>{erroLista}</Text>
              <TouchableOpacity style={styles.btnRetentar} onPress={carregarProfissionais}>
                <Text style={styles.btnRetentarTexto}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          )}

          {!carregando && !erroLista && profissionaisFiltrados.length === 0 && (
            <Text style={styles.textoInfo}>Nenhum profissional cadastrado ainda.</Text>
          )}

          {profissionaisFiltrados.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => abrirEdicao(item)}
              activeOpacity={0.75}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarLetra}>{item.name[0]}</Text>
              </View>
              <View style={styles.cardDados}>
                <Text style={styles.cardNome}>{item.name}</Text>
                <Text style={styles.cardTelefone}>{item.phone}</Text>
              </View>
              <Text style={styles.itemSeta}>›</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Tela: Criar / Editar ────────────────────────────────────────────────────

  const isEditar = tela === 'editar';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F0" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => setTela('lista')}>
          <Text style={styles.headerVoltar}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>{isEditar ? 'Editar profissional' : 'Novo profissional'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Nome completo *</Text>
        <TextInput style={styles.inputCampo} value={formNome} onChangeText={setFormNome} placeholderTextColor="#AAAAAA" />

        <Text style={styles.label}>Apelido</Text>
        <TextInput style={styles.inputCampo} value={formApelido} onChangeText={setFormApelido} placeholderTextColor="#AAAAAA" />

        <Text style={styles.label}>CPF {isEditar ? '' : '*'}</Text>
        <TextInput
          style={[styles.inputCampo, isEditar && styles.inputDesabilitado]}
          value={formCpf}
          onChangeText={setFormCpf}
          editable={!isEditar}
          keyboardType="numeric"
          placeholder="Somente números"
          placeholderTextColor="#AAAAAA"
        />

        <Text style={styles.label}>E-mail *</Text>
        <TextInput
          style={styles.inputCampo}
          value={formEmail}
          onChangeText={setFormEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor="#AAAAAA"
        />

        {!isEditar && (
          <>
            <Text style={styles.label}>Senha *</Text>
            <TextInput
              style={styles.inputCampo}
              value={formSenha}
              onChangeText={setFormSenha}
              secureTextEntry
              placeholderTextColor="#AAAAAA"
            />
          </>
        )}

        <Text style={styles.label}>Telefone *</Text>
        <TextInput
          style={styles.inputCampo}
          value={formTelefone}
          onChangeText={setFormTelefone}
          keyboardType="phone-pad"
          placeholderTextColor="#AAAAAA"
        />

        <Text style={styles.label}>Comissão (%)</Text>
        <TextInput
          style={styles.inputCampo}
          value={formComissao}
          onChangeText={setFormComissao}
          keyboardType="numeric"
          placeholderTextColor="#AAAAAA"
        />

        {isEditar && (
          <View style={styles.linhaAtivo}>
            <Text style={styles.label}>Profissional ativo</Text>
            <Switch value={formAtivo} onValueChange={setFormAtivo} />
          </View>
        )}

        {isEditar && (
          <TouchableOpacity style={styles.btnExcluir} onPress={excluir} activeOpacity={0.85} disabled={salvando}>
            <Text style={styles.btnExcluirTexto}>Excluir profissional</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <View style={styles.rodape}>
        <TouchableOpacity style={styles.btnSalvar} onPress={salvar} disabled={salvando}>
          <Text style={styles.btnSalvarTexto}>
            {salvando ? 'Salvando...' : isEditar ? 'Salvar alterações' : 'Criar profissional'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F0', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#EEEEEA' },
  headerVoltar: { fontSize: 20, color: '#1A1A1A' },
  headerTitulo: { color: '#1A1A1A', fontSize: 17, fontWeight: '700' },
  headerSubtitulo: { color: '#888888', fontSize: 12, marginTop: 2 },
  btnAdicionar: { backgroundColor: '#D9B76A', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  btnAdicionarTexto: { color: '#1A1A1A', fontWeight: 'bold', fontSize: 13 },
  buscaContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', margin: 16, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#E8E8E0' },
  buscaIcone: { fontSize: 15, marginRight: 8 },
  buscaInput: { flex: 1, color: '#1A1A1A', fontSize: 14, padding: 0 },
  contador: { color: '#AAAAAA', fontSize: 12, paddingHorizontal: 16, marginBottom: 8 },
  lista: { paddingHorizontal: 16, paddingBottom: 24 },
  textoInfo: { textAlign: 'center', color: '#AAAAAA', fontSize: 14, marginTop: 40 },
  erroContainer: { alignItems: 'center', marginTop: 40, gap: 12 },
  erroTexto: { color: '#CC4444', fontSize: 13, textAlign: 'center', paddingHorizontal: 20 },
  btnRetentar: { backgroundColor: '#FBF0D5', borderWidth: 1, borderColor: '#D9B76A', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  btnRetentarTexto: { color: '#B8922A', fontWeight: '600', fontSize: 13 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#EDEDEA' },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FBF0D5', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#D9B76A', marginRight: 12 },
  avatarLetra: { color: '#B8922A', fontWeight: 'bold', fontSize: 16 },
  cardDados: { flex: 1 },
  cardNome: { color: '#1A1A1A', fontWeight: '600', fontSize: 14 },
  cardTelefone: { color: '#AAAAAA', fontSize: 12, marginTop: 2 },
  itemSeta: { fontSize: 22, color: '#BBBBBB' },
  formContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  label: { color: '#444444', fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  inputCampo: { backgroundColor: '#FFFFFF', color: '#1A1A1A', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, borderWidth: 1, borderColor: '#E8E8E0' },
  inputDesabilitado: { backgroundColor: '#F0F0EC', color: '#AAAAAA' },
  linhaAtivo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  btnExcluir: { marginTop: 30, borderRadius: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: '#FFF5F5', borderWidth: 1, borderColor: '#FFCCCC' },
  btnExcluirTexto: { color: '#CC4444', fontSize: 14, fontWeight: '600' },
  rodape: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#F5F5F0' },
  btnSalvar: { backgroundColor: '#D9B76A', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnSalvarTexto: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
