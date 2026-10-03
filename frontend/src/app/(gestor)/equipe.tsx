import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfessionalSelector } from '@/components/admin/ProfessionalSelector';
import { AddProfessionalModal } from '@/components/admin/AddProfessionalModal';

import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';
import { useEstablishment } from '@/hooks/useEstablishment';
import { useProfessional } from '@/hooks/useProfessionals';
import {
  createProfessional,
  deactivateProfessional,
  getProfessionalById,
  updateProfessionalAsAdmin,
  type ProfessionalAdminUpdateInput,
  type ProfessionalCreateInput,
  type ProfessionalCreateResponse,
  type ProfessionalMin,
} from '@/services/professionalServices';

export default function EquipeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { fontSemiBold, fontRegular } = useAppFonts();
  const { establishmentId, loading: loadingEstablishment, reload } = useEstablishment();

  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedProfessional, setSelectedProfessional] = useState<ProfessionalMin | undefined>(undefined);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const {
    professionals,
    loading: loadingProfessionals,
    error: errorProfessionals,
    setMode,
  } = useProfessional(establishmentId);

  async function handleRefresh() {
    setRefreshing(true);
    await reload();
    setMode('all');
    setTimeout(() => setMode('active'), 100);
    setRefreshing(false);
  }

  // Abertura do Modal para Cadastro (Botão "+ Adicionar")
  function handleOpenCreate() {
    setSelectedProfessional(undefined);
    setModalMode('create');
    setModalVisible(true);
  }

  // Abertura do Modal para Edição (Clique no card do profissional)
  // Busca o objeto completo (ProfessionalDetailsResponseDTO) com nickname, email e commission.
  // O endpoint de listagem retorna apenas ProfessionalMinResponseDTO (id, name, phone, photoUrl, commission)
  // e NÃO inclui nickname nem email — por isso a busca por ID é obrigatória antes de abrir o modal.
  async function handleSelectProfessional(profId: string | null) {
    if (!profId || !establishmentId) return;
    setLoadingDetail(true);
    try {
      const fullProfessional = await getProfessionalById(establishmentId, profId);
      setSelectedProfessional(fullProfessional);
      setModalMode('edit');
      setModalVisible(true);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os dados do profissional.');
    } finally {
      setLoadingDetail(false);
    }
  }

  // Submissão de novo profissional — retorna a resposta para o modal exibir a senha temporária
  async function handleCreateProfessional(input: ProfessionalCreateInput): Promise<ProfessionalCreateResponse> {
    if (!establishmentId) {
      Alert.alert('Erro', 'Estabelecimento não encontrado. Tente novamente.');
      throw new Error('Estabelecimento não encontrado.');
    }
    try {
      const result = await createProfessional(establishmentId, input);
      // Atualiza a lista em background
      setMode('all');
      setTimeout(() => setMode('active'), 100);
      // Retorna o resultado — o modal exibirá a senha temporária e fechará sozinho
      return result;
    } catch (err: any) {
      throw new Error(err?.response?.data?.message || err?.message || 'Não foi possível cadastrar o profissional.');
    }
  }

  // Atualização dos dados do profissional existente
  async function handleUpdateProfessional(input: ProfessionalAdminUpdateInput) {
    if (!establishmentId || !selectedProfessional?.id) {
      Alert.alert('Erro', 'Profissional ou estabelecimento inválido.');
      return;
    }
    try {
      await updateProfessionalAsAdmin(establishmentId, selectedProfessional.id, input);
      Alert.alert('Sucesso', 'Profissional atualizado com sucesso!');
      setMode('all');
      setTimeout(() => setMode('active'), 100);
      setModalVisible(false);
    } catch (err: any) {
      Alert.alert('Erro', err?.message || 'Não foi possível salvar as alterações.');
      throw err;
    }
  }

  // Exclusão do profissional
  async function handleDeleteProfessional(id: string) {
    if (!establishmentId) {
      Alert.alert('Erro', 'Estabelecimento não encontrado.');
      return;
    }
    try {
      await deactivateProfessional(establishmentId, id);
      // Remove da listagem local sem precisar de novo fetch
      setMode('all');
      setTimeout(() => setMode('active'), 100);
      setSelectedProfessional(undefined);
      setModalVisible(false);
      Alert.alert('Sucesso', 'Profissional excluído com sucesso!');
    } catch (err: any) {
      const backendMessage =
        (err as any)?.response?.data?.message ||
        (typeof (err as any)?.response?.data === 'string' ? (err as any)?.response?.data : null);
      throw new Error(backendMessage || 'Não foi possível excluir o profissional.');
    }
  }

  if (loadingEstablishment) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.gold} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.gold} />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.title, { fontFamily: fontSemiBold }]}>Equipe</Text>
          <Text style={[styles.subtitle, { fontFamily: fontRegular }]}>
            Profissionais cadastrados no estabelecimento
          </Text>
        </View>

        <ProfessionalSelector
          professionals={professionals}
          selectedId={selectedProfessional?.id ?? null}
          onSelect={handleSelectProfessional}
          onAddPress={handleOpenCreate}
          isLoading={loadingProfessionals || loadingDetail}
          hasError={!!errorProfessionals}
        />
      </ScrollView>

      <AddProfessionalModal
        visible={modalVisible}
        mode={modalMode}
        professional={selectedProfessional}
        establishmentId={establishmentId}
        onClose={() => setModalVisible(false)}
        onSubmit={handleCreateProfessional}
        onUpdate={handleUpdateProfessional}
        onDelete={handleDeleteProfessional}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    gap: 20,
  },
  header: {
    paddingHorizontal: 20,
    gap: 4,
  },
  title: {
    fontSize: 24,
    color: Colors.dark,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.grey400,
  },
});