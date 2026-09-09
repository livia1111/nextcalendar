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
  updateProfessionalAsAdmin,
  type ProfessionalAdminUpdateInput,
  type ProfessionalCreateInput,
  type ProfessionalMin,
} from '@/services/professionalServices';

export default function EquipeScreen() {
  const insets = useSafeAreaInsets();
  const { fontSemiBold, fontRegular } = useAppFonts();
  const { establishmentId, loading: loadingEstablishment, reload } = useEstablishment();

  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedProfessional, setSelectedProfessional] = useState<ProfessionalMin | undefined>(undefined);

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
  function handleSelectProfessional(profId: string | null) {
    if (!profId) return;
    const found = professionals.find((p) => p.id === profId);
    if (found) {
      setSelectedProfessional(found);
      setModalMode('edit');
      setModalVisible(true);
    }
  }

  // Submissão de novo profissional
  async function handleCreateProfessional(input: ProfessionalCreateInput) {
    if (!establishmentId) {
      Alert.alert('Erro', 'Estabelecimento não encontrado. Tente novamente.');
      return;
    }
    try {
      await createProfessional(establishmentId, input);
      Alert.alert('Sucesso', `Profissional ${input.name} cadastrado com sucesso!`);
      setMode('all');
      setTimeout(() => setMode('active'), 100);
      setModalVisible(false);
    } catch (err: any) {
      Alert.alert('Erro', err?.message || 'Não foi possível cadastrar o profissional.');
      throw err;
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
          isLoading={loadingProfessionals}
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