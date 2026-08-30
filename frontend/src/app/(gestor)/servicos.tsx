import { useEffect, useState } from 'react';
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

import { ServiceSelector } from '@/components/admin/ServiceSelector';
import { AddServiceModal } from '@/components/admin/AddServiceModal';
import { EditServiceModal } from '@/components/admin/EditServiceModal';

import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';
import { useEstablishment } from '@/hooks/useEstablishment';
import {
  getServices,
  createService,
  updateService,
  deleteService,
  type ServiceResponse,
  type ServiceCreatePayload,
  type ServiceUpdatePayload,
} from '@/services/serviceServices';

export default function ServicosScreen() {
  const insets = useSafeAreaInsets();
  const { fontSemiBold, fontRegular } = useAppFonts();
  const { establishmentId, loading: loadingEstablishment, reload } = useEstablishment();

  const [refreshing, setRefreshing] = useState(false);
  const [services, setServices] = useState<ServiceResponse[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [errorServices, setErrorServices] = useState(false);
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<ServiceResponse | null>(null);

  async function loadServices(estId: string) {
    setLoadingServices(true);
    setErrorServices(false);
    try {
      const page = await getServices(estId);
      setServices(page.content);
    } catch {
      setErrorServices(true);
    } finally {
      setLoadingServices(false);
    }
  }

  useEffect(() => {
    if (!loadingEstablishment && establishmentId) {
      loadServices(establishmentId);
    }
  }, [loadingEstablishment, establishmentId]);

  async function handleRefresh() {
    setRefreshing(true);
    await reload();
    if (establishmentId) await loadServices(establishmentId);
    setRefreshing(false);
  }

  async function handleCreateService(input: ServiceCreatePayload) {
    if (!establishmentId) {
      Alert.alert('Erro', 'Estabelecimento não encontrado. Tente novamente.');
      return;
    }
    try {
      await createService(establishmentId, input);
      Alert.alert('Sucesso', `Serviço ${input.name} cadastrado com sucesso!`);
      await loadServices(establishmentId);
    } catch {
      Alert.alert('Erro', 'Não foi possível cadastrar o serviço. Tente novamente.');
    }
  }

  async function handleUpdateService(serviceId: string, input: ServiceUpdatePayload) {
    if (!establishmentId) {
      Alert.alert('Erro', 'Estabelecimento não encontrado. Tente novamente.');
      return;
    }
    await updateService(establishmentId, serviceId, input);
    Alert.alert('Sucesso', 'Serviço atualizado com sucesso!');
    await loadServices(establishmentId);
  }

  async function handleDeleteService(serviceId: string) {
    if (!establishmentId) {
      Alert.alert('Erro', 'Estabelecimento não encontrado. Tente novamente.');
      return;
    }
    await deleteService(establishmentId, serviceId);
    await loadServices(establishmentId);
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
          <Text style={[styles.title, { fontFamily: fontSemiBold }]}>Serviços</Text>
          <Text style={[styles.subtitle, { fontFamily: fontRegular }]}>
            Gerencie o catálogo de serviços do estabelecimento
          </Text>
        </View>

        <ServiceSelector
          services={services}
          onAddPress={() => setServiceModalVisible(true)}
          onSelectService={(service) => setEditingService(service)}
          isLoading={loadingServices}
          hasError={errorServices}
        />
      </ScrollView>

      <AddServiceModal
        visible={serviceModalVisible}
        onClose={() => setServiceModalVisible(false)}
        onSubmit={handleCreateService}
      />

      <EditServiceModal
        visible={!!editingService}
        service={editingService}
        onClose={() => setEditingService(null)}
        onSubmit={handleUpdateService}
        onDelete={handleDeleteService}
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
