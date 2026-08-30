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
  type ProfessionalCreateInput,
} from '@/services/professionalServices';

/**
 * Aba Equipe — gestão de profissionais.
 *
 * NOTA DE COORDENAÇÃO DE TIME: cadastro está funcional (reaproveita
 * AddProfessionalModal já existente). Edição e exclusão de profissional
 * ficam a cargo do Pedro — não adicionar essa lógica aqui para evitar
 * conflito com o trabalho dele em paralelo.
 */
export default function EquipeScreen() {
  const insets = useSafeAreaInsets();
  const { fontSemiBold, fontRegular } = useAppFonts();
  const { establishmentId, loading: loadingEstablishment, reload } = useEstablishment();

  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(null);

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

  async function handleCreateProfessional(input: ProfessionalCreateInput) {
    if (!establishmentId) {
      Alert.alert('Erro', 'Estabelecimento não encontrado. Tente novamente.');
      return;
    }
    try {
      await createProfessional(establishmentId, input);
      Alert.alert('Sucesso', `Profissional ${input.name} cadastrado com sucesso!`);
      setMode('all'); // força re-fetch
      setTimeout(() => setMode('active'), 100);
    } catch {
      Alert.alert('Erro', 'Não foi possível cadastrar o profissional. Tente novamente.');
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
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.gold} />
        }>
        <View style={styles.header}>
          <Text style={[styles.title, { fontFamily: fontSemiBold }]}>Equipe</Text>
          <Text style={[styles.subtitle, { fontFamily: fontRegular }]}>
            Profissionais cadastrados no estabelecimento
          </Text>
        </View>

        <ProfessionalSelector
          professionals={professionals}
          selectedId={selectedProfessionalId}
          onSelect={setSelectedProfessionalId}
          onAddPress={() => setModalVisible(true)}
          isLoading={loadingProfessionals}
          hasError={!!errorProfessionals}
        />

        {/*
          TODO (Pedro): adicionar aqui a listagem completa com edição/exclusão
          de profissional (updateProfessional / deactivateProfessional já
          existem prontos em services/professionalServices.ts).
        */}
      </ScrollView>

      <AddProfessionalModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleCreateProfessional}
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
