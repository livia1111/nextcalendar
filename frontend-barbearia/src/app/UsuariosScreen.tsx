import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Papel = 'Admin' | 'Gerente' | 'Funcionário' | 'Cliente';

type Permissao = 'Ver Agendamentos' | 'Ver Pagamentos' | 'Gerenciar Usuários' | 'Relatórios';

interface Usuario {
  id: number;
  nomeCompleto: string;
  email: string;
  telefone: string;
  papel: Papel;
  permissoes: Permissao[];
}

// ─── Dados mockados ────────────────────────────────────────────────────────────

const USUARIOS_MOCK: Usuario[] = [
  { id: 1,  nomeCompleto: 'Michael Johnson',   email: 'michaeljohnson@gmail.com',   telefone: '(555) 123-4567', papel: 'Admin',        permissoes: ['Ver Agendamentos', 'Ver Pagamentos', 'Gerenciar Usuários', 'Relatórios'] },
  { id: 2,  nomeCompleto: 'Olivia Wilson',     email: 'oliviawilson@gmail.com',     telefone: '(987) 654-3210', papel: 'Admin',        permissoes: ['Ver Agendamentos', 'Ver Pagamentos'] },
  { id: 3,  nomeCompleto: 'Sarah Williams',    email: 'sarahwilliams@gmail.com',    telefone: '(444) 555-6789', papel: 'Admin',        permissoes: ['Ver Agendamentos'] },
  { id: 4,  nomeCompleto: 'David Brown',       email: 'davidbrown@gmail.com',       telefone: '(222) 333-4444', papel: 'Gerente',      permissoes: ['Ver Agendamentos', 'Ver Pagamentos'] },
  { id: 5,  nomeCompleto: 'Jessica Davis',     email: 'jessicadavis@gmail.com',     telefone: '(123) 456-7890', papel: 'Funcionário',  permissoes: ['Ver Agendamentos'] },
  { id: 6,  nomeCompleto: 'Johnathan Doe',     email: 'johnathandoe@gmail.com',     telefone: '(333) 444-5555', papel: 'Funcionário',  permissoes: ['Ver Agendamentos'] },
  { id: 7,  nomeCompleto: 'Daniel Garcia',     email: 'danielgarcia@gmail.com',     telefone: '(111) 222-3333', papel: 'Funcionário',  permissoes: ['Ver Agendamentos'] },
  { id: 8,  nomeCompleto: 'Sophia Martinez',   email: 'sophiamartinez@gmail.com',   telefone: '(777) 888-9999', papel: 'Funcionário',  permissoes: ['Ver Agendamentos', 'Ver Pagamentos'] },
  { id: 9,  nomeCompleto: 'Emily Smith',       email: 'emilysmith@gmail.com',       telefone: '(888) 999-0000', papel: 'Funcionário',  permissoes: ['Ver Agendamentos'] },
  { id: 10, nomeCompleto: 'James Rodriguez',   email: 'jamesrodriguez@gmail.com',   telefone: '(666) 777-8888', papel: 'Cliente',      permissoes: [] },
];

const TODOS_PAPEIS: Papel[] = ['Admin', 'Gerente', 'Funcionário', 'Cliente'];

const TODAS_PERMISSOES: Permissao[] = [
  'Ver Agendamentos',
  'Ver Pagamentos',
  'Gerenciar Usuários',
  'Relatórios',
];

// ─── Helpers de estilo por papel ───────────────────────────────────────────────

function corBadge(papel: Papel): { bg: string; text: string } {
  switch (papel) {
    case 'Admin':       return { bg: '#FBF0D5', text: '#B8922A' };
    case 'Gerente':     return { bg: '#EAF4FF', text: '#2563EB' };
    case 'Funcionário': return { bg: '#EAFAF1', text: '#15803D' };
    case 'Cliente':     return { bg: '#F3F4F6', text: '#6B7280' };
  }
}

// ─── Componente principal ──────────────────────────────────────────────────────

export default function UsuariosScreen() {
  const [usuarios, setUsuarios]           = useState<Usuario[]>(USUARIOS_MOCK);
  const [busca, setBusca]                 = useState('');
  const [modalVisivel, setModalVisivel]   = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null);

  // Campos do formulário de edição
  const [formNome, setFormNome]           = useState('');
  const [formEmail, setFormEmail]         = useState('');
  const [formPapel, setFormPapel]         = useState<Papel>('Cliente');
  const [formPermissoes, setFormPermissoes] = useState<Permissao[]>([]);
  const [dropdownPapelAberto, setDropdownPapelAberto] = useState(false);

  // ── Filtragem ──
  const usuariosFiltrados = usuarios.filter(u =>
    u.nomeCompleto.toLowerCase().includes(busca.toLowerCase()) ||
    u.email.toLowerCase().includes(busca.toLowerCase()),
  );

  // ── Abrir modal de edição ──
  function abrirEdicao(usuario: Usuario) {
    setUsuarioSelecionado(usuario);
    setFormNome(usuario.nomeCompleto);
    setFormEmail(usuario.email);
    setFormPapel(usuario.papel);
    setFormPermissoes([...usuario.permissoes]);
    setDropdownPapelAberto(false);
    setModalVisivel(true);
  }

  // ── Salvar edição ──
  function salvarEdicao() {
    if (!usuarioSelecionado) return;
    setUsuarios(prev =>
      prev.map(u =>
        u.id === usuarioSelecionado.id
          ? { ...u, nomeCompleto: formNome, email: formEmail, papel: formPapel, permissoes: formPermissoes }
          : u,
      ),
    );
    setModalVisivel(false);
  }

  // ── Alternar permissão ──
  function alternarPermissao(p: Permissao) {
    setFormPermissoes(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p],
    );
  }

  // ─── Item da lista ───────────────────────────────────────────────────────────

  function renderItem({ item, index }: { item: Usuario; index: number }) {
    const badge = corBadge(item.papel);
    return (
      <View style={styles.card}>
        {/* Número + Avatar inicial */}
        <View style={styles.cardLeft}>
          <Text style={styles.cardNumero}>{index + 1}</Text>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetra}>{item.nomeCompleto[0]}</Text>
          </View>
        </View>

        {/* Dados */}
        <View style={styles.cardDados}>
          <Text style={styles.cardNome}>{item.nomeCompleto}</Text>
          <Text style={styles.cardEmail}>{item.email}</Text>
          <Text style={styles.cardTelefone}>{item.telefone}</Text>
        </View>

        {/* Badge + ações */}
        <View style={styles.cardDireita}>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeTexto, { color: badge.text }]}>{item.papel}</Text>
          </View>
          <TouchableOpacity style={styles.btnEditar} onPress={() => abrirEdicao(item)}>
            <Text style={styles.btnEditarTexto}>✏️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F0" />

      {/* Cabeçalho */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitulo}>Usuários</Text>
          <Text style={styles.headerSubtitulo}>Gerenciar usuários e papéis</Text>
        </View>
        <TouchableOpacity style={styles.btnAdicionar}>
          <Text style={styles.btnAdicionarTexto}>+ Adicionar</Text>
        </TouchableOpacity>
      </View>

      {/* Barra de busca */}
      <View style={styles.buscaContainer}>
        <Text style={styles.buscaIcone}>🔍</Text>
        <TextInput
          style={styles.buscaInput}
          placeholder="Buscar usuário..."
          placeholderTextColor="#AAAAAA"
          value={busca}
          onChangeText={setBusca}
        />
      </View>

      {/* Contador */}
      <Text style={styles.contador}>
        Exibindo {usuariosFiltrados.length} de {usuarios.length} usuários
      </Text>

      {/* Lista */}
      <FlatList
        data={usuariosFiltrados}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
      />

      {/* ── Modal de edição ─────────────────────────────────────────────────── */}
      <Modal
        visible={modalVisivel}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisivel(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>

            {/* Cabeçalho do modal */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Atualizar Usuário</Text>
              <TouchableOpacity onPress={() => setModalVisivel(false)}>
                <Text style={styles.modalFechar}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Campo Nome */}
            <Text style={styles.label}>Nome *</Text>
            <TextInput
              style={styles.inputCampo}
              value={formNome}
              onChangeText={setFormNome}
              placeholderTextColor="#AAAAAA"
            />

            {/* Campo Email */}
            <Text style={styles.label}>E-mail *</Text>
            <TextInput
              style={styles.inputCampo}
              value={formEmail}
              onChangeText={setFormEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#AAAAAA"
            />

            {/* Dropdown Papel */}
            <Text style={styles.label}>Papel *</Text>
            <TouchableOpacity
              style={[styles.inputCampo, styles.dropdown, dropdownPapelAberto && styles.dropdownAberto]}
              onPress={() => setDropdownPapelAberto(p => !p)}
            >
              <Text style={styles.dropdownTexto}>{formPapel}</Text>
              <Text style={styles.dropdownSeta}>{dropdownPapelAberto ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {dropdownPapelAberto && (
              <View style={styles.dropdownMenu}>
                {TODOS_PAPEIS.map(p => (
                  <TouchableOpacity
                    key={p}
                    style={styles.dropdownItem}
                    onPress={() => { setFormPapel(p); setDropdownPapelAberto(false); }}
                  >
                    <Text style={styles.dropdownItemTexto}>{p}</Text>
                    {formPapel === p && <Text style={styles.dropdownCheck}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Permissões */}
            <Text style={styles.label}>Permissões *</Text>
            <View style={styles.permissoesContainer}>
              {TODAS_PERMISSOES.map(p => {
                const ativa = formPermissoes.includes(p);
                return (
                  <TouchableOpacity
                    key={p}
                    style={[styles.permissaoTag, ativa && styles.permissaoTagAtiva]}
                    onPress={() => alternarPermissao(p)}
                  >
                    <Text style={[styles.permissaoTexto, ativa && styles.permissaoTextoAtivo]}>
                      {p} {ativa ? '✕' : '+'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Botões */}
            <View style={styles.modalBotoes}>
              <TouchableOpacity
                style={styles.btnCancelar}
                onPress={() => setModalVisivel(false)}
              >
                <Text style={styles.btnCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSalvar} onPress={salvarEdicao}>
                <Text style={styles.btnSalvarTexto}>Salvar</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  // Cabeçalho
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E0',
  },
  headerTitulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  headerSubtitulo: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
  btnAdicionar: {
    backgroundColor: '#D9B76A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#D9B76A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  btnAdicionarTexto: {
    color: '#1A1A1A',
    fontWeight: 'bold',
    fontSize: 13,
  },

  // Busca
  buscaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E8E8E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  buscaIcone: { fontSize: 15, marginRight: 8 },
  buscaInput: {
    flex: 1,
    color: '#1A1A1A',
    fontSize: 14,
    padding: 0,
  },

  // Contador
  contador: {
    color: '#AAAAAA',
    fontSize: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },

  // Lista
  lista: { paddingHorizontal: 16, paddingBottom: 24 },

  // Card de usuário
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EDEDEA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLeft: {
    alignItems: 'center',
    marginRight: 12,
    gap: 6,
  },
  cardNumero: {
    color: '#AAAAAA',
    fontSize: 11,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FBF0D5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#D9B76A',
  },
  avatarLetra: {
    color: '#B8922A',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cardDados: { flex: 1 },
  cardNome: {
    color: '#1A1A1A',
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 2,
  },
  cardEmail: {
    color: '#666666',
    fontSize: 12,
    marginBottom: 2,
  },
  cardTelefone: {
    color: '#AAAAAA',
    fontSize: 11,
  },
  cardDireita: {
    alignItems: 'flex-end',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeTexto: {
    fontSize: 11,
    fontWeight: '600',
  },
  btnEditar: {
    padding: 4,
  },
  btnEditarTexto: { fontSize: 16 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
    borderTopWidth: 3,
    borderTopColor: '#D9B76A',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitulo: {
    color: '#1A1A1A',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalFechar: {
    color: '#888888',
    fontSize: 18,
    padding: 4,
  },

  // Formulário
  label: {
    color: '#444444',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputCampo: {
    backgroundColor: '#F9F9F6',
    color: '#1A1A1A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E8E8E0',
  },

  // Dropdown
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownAberto: {
    borderColor: '#D9B76A',
    marginBottom: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dropdownTexto: { color: '#1A1A1A', fontSize: 14 },
  dropdownSeta:  { color: '#D9B76A', fontSize: 12 },
  dropdownMenu: {
    backgroundColor: '#F9F9F6',
    borderWidth: 1,
    borderColor: '#D9B76A',
    borderTopWidth: 0,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    marginBottom: 14,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E0',
  },
  dropdownItemTexto: { color: '#1A1A1A', fontSize: 14 },
  dropdownCheck: { color: '#D9B76A', fontWeight: 'bold' },

  // Permissões
  permissoesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  permissaoTag: {
    backgroundColor: '#F9F9F6',
    borderWidth: 1,
    borderColor: '#E8E8E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  permissaoTagAtiva: {
    backgroundColor: '#3A2E0A',
    borderColor: '#D9B76A',
  },
  permissaoTexto: { color: '#B0B4BA', fontSize: 12 },
  permissaoTextoAtivo: { color: '#D9B76A', fontWeight: '600' },

  // Botões do modal
  modalBotoes: {
    flexDirection: 'row',
    gap: 12,
  },
  btnCancelar: {
    flex: 1,
    backgroundColor: '#2E3135',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3A3D47',
  },
  btnCancelarTexto: { color: '#B0B4BA', fontWeight: '600' },
  btnSalvar: {
    flex: 1,
    backgroundColor: '#D9B76A',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnSalvarTexto: { color: '#000000', fontWeight: 'bold' },
});
