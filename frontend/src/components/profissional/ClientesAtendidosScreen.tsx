import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRightIcon, ChevronLeftIcon } from '@/components/icons';
import { SearchBar } from '@/components/ui/SearchBar';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';
import { searchClients, type ClientMin } from '@/services/clientServices';

interface ClientesAtendidosScreenProps {
  onBack: () => void;
  onSelectClient: (client: ClientMin) => void;
}

export function ClientesAtendidosScreen({ onBack, onSelectClient }: ClientesAtendidosScreenProps) {
  const { fontRegular, fontSemiBold, fontBold } = useAppFonts();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState('');
  const [clients, setClients] = useState<ClientMin[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (name: string) => {
    setLoading(true);
    try {
      const page = await searchClients(name);
      setClients(page.content);
    } catch {
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Busca inicial + debounce de 400ms a cada letra digitada
  useEffect(() => {
    const timer = setTimeout(() => load(query), 400);
    return () => clearTimeout(timer);
  }, [query, load]);

  function getInitial(name: string) {
    return name?.trim()?.[0]?.toUpperCase() ?? '?';
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <ChevronLeftIcon size={22} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: fontBold }]}>Histórico de Clientes</Text>
        <View style={styles.iconBtn} />
      </View>

      <View style={styles.searchWrap}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Buscar cliente" onClear={() => setQuery('')} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.gold} />
        </View>
      ) : (
        <FlatList
          data={clients}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={[styles.emptyText, { fontFamily: fontRegular }]}>
                Nenhum cliente encontrado.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => onSelectClient(item)}>
              <View style={styles.avatar}>
                <Text style={[styles.avatarText, { fontFamily: fontSemiBold }]}>
                  {getInitial(item.name)}
                </Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.clientName, { fontFamily: fontSemiBold }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.clientPhone, { fontFamily: fontRegular }]} numberOfLines={1}>
                  {item.phone}
                </Text>
              </View>
              <ArrowRightIcon size={18} color={Colors.grey400} />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: Colors.white,
  },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, color: Colors.dark },
  searchWrap: { padding: 20, paddingBottom: 12, backgroundColor: Colors.white },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { color: Colors.grey400, fontSize: 14 },
  listContent: { padding: 20, gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.grey100,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: Colors.goldDark, fontSize: 16 },
  cardInfo: { flex: 1, gap: 2 },
  clientName: { fontSize: 15, color: Colors.dark },
  clientPhone: { fontSize: 13, color: Colors.grey400 },
});