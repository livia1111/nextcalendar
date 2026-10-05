import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRightIcon, ChevronLeftIcon } from '@/components/icons';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';
import { API_BASE_URL } from '@/services/api';
import { getFullSheet, type TechnicalSheetEntry } from '@/services/technicalSheetServices';

interface HistoricoClienteScreenProps {
  clientId: string;
  clientName: string;
  onBack: () => void;
  onSelectEntry: (entry: TechnicalSheetEntry) => void;
}

export function HistoricoClienteScreen({ clientId, clientName, onBack, onSelectEntry }: HistoricoClienteScreenProps) {
  const { fontRegular, fontSemiBold, fontBold } = useAppFonts();
  const insets = useSafeAreaInsets();

  const [entries, setEntries] = useState<TechnicalSheetEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const sheet = await getFullSheet(clientId);
        if (active) setEntries(sheet.entries);
      } catch {
        if (active) setEntries([]);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [clientId]);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <ChevronLeftIcon size={22} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { fontFamily: fontBold }]} numberOfLines={1}>
            {clientName}
          </Text>
          <Text style={[styles.headerSubtitle, { fontFamily: fontRegular }]}>Histórico de atendimentos</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.gold} />
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.centered}>
          <Text style={{ fontSize: 32 }}>🗂️</Text>
          <Text style={[styles.emptyText, { fontFamily: fontSemiBold }]}>
            Nenhum atendimento registrado ainda
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          {entries.map((entry) => (
            <TouchableOpacity
              key={entry.id}
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => onSelectEntry(entry)}>
              {entry.photos[0] ? (
                <Image source={{ uri: `${API_BASE_URL}${entry.photos[0].photoUrl}` }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder]}>
                  <Text style={{ fontSize: 20 }}>✂️</Text>
                </View>
              )}

              <View style={styles.cardInfo}>
                <View style={styles.cardTopRow}>
                  <Text style={[styles.serviceName, { fontFamily: fontSemiBold }]} numberOfLines={1}>
                    {entry.serviceName}
                  </Text>
                  <Text style={[styles.dateText, { fontFamily: fontRegular }]}>{formatDate(entry.createdAt)}</Text>
                </View>
                <Text style={[styles.profName, { fontFamily: fontRegular }]} numberOfLines={1}>
                  Por {entry.professionalName}
                </Text>
                {entry.notes ? (
                  <Text style={[styles.notesPreview, { fontFamily: fontRegular }]} numberOfLines={1}>
                    {entry.notes}
                  </Text>
                ) : null}
              </View>

              <ArrowRightIcon size={18} color={Colors.grey400} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: Colors.white,
  },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, color: Colors.dark },
  headerSubtitle: { fontSize: 12, color: Colors.grey400 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 60 },
  emptyText: { color: Colors.grey500, fontSize: 14 },
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
  thumb: { width: 52, height: 52, borderRadius: 10 },
  thumbPlaceholder: {
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.grey100,
  },
  cardInfo: { flex: 1, gap: 2 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  serviceName: { fontSize: 14, color: Colors.dark, flex: 1 },
  dateText: { fontSize: 11, color: Colors.grey400 },
  profName: { fontSize: 12, color: Colors.goldDark },
  notesPreview: { fontSize: 12, color: Colors.grey400, marginTop: 2 },
});