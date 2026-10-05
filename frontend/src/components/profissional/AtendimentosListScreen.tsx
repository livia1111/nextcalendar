import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowRightIcon, ChevronLeftIcon } from '@/components/icons';
import { SearchBar } from '@/components/ui/SearchBar';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';
import { useAuth } from '@/context/AuthContext';
import {
  getProfessionalAttendances,
  getEstablishmentAttendances,
  type AttendanceItem,
} from '@/services/attendanceServices';
import { getActiveProfessionals, type ProfessionalMin } from '@/services/professionalServices';
import { DEFAULT_ESTABLISHMENT_ID } from '@/constants/establishment';
import { formatBRL } from '@/utils/money';
import { type AppointmentStatus } from '@/services/appointmentServices';
import { AtendimentoDetalhesCompletoScreen } from './AtendimentoDetalhesCompletoScreen';
import { HistoricoClienteScreen } from './HistoricoClienteScreen';
import { AtendimentoScreen } from './AtendimentoScreen';
import { type TechnicalSheetEntry } from '@/services/technicalSheetServices';

interface AtendimentosListScreenProps {
  onBack?: () => void;
}

export function AtendimentosListScreen({ onBack }: AtendimentosListScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { fontRegular, fontSemiBold, fontBold } = useAppFonts();

  const isManager = user?.role === 'MANAGER';
  const establishmentId = DEFAULT_ESTABLISHMENT_ID;

  // Active navigation view state
  const [selectedAttendance, setSelectedAttendance] = useState<AttendanceItem | null>(null);
  const [historyClient, setHistoryClient] = useState<{ id: string; name: string } | null>(null);
  const [editingSheetAppt, setEditingSheetAppt] = useState<any | null>(null);

  // Filters state
  const [profTab, setProfTab] = useState<'IN_PROGRESS' | 'DONE'>('IN_PROGRESS');
  const [managerStatusFilter, setManagerStatusFilter] = useState<'ALL' | 'IN_PROGRESS' | 'DONE'>('ALL');
  const [selectedProfId, setSelectedProfId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Data state
  const [attendances, setAttendances] = useState<AttendanceItem[]>([]);
  const [professionals, setProfessionals] = useState<ProfessionalMin[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Load professionals for manager filter
  useEffect(() => {
    if (!isManager) return;
    getActiveProfessionals(establishmentId)
      .then((res) => setProfessionals(res.content))
      .catch(() => {});
  }, [isManager, establishmentId]);

  const loadAttendances = useCallback(
    async (pageToLoad: number, append = false) => {
      if (pageToLoad === 0 && !append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        if (!isManager) {
          // Professional view
          const statusParam = profTab;
          const res = await getProfessionalAttendances({
            status: statusParam,
            page: pageToLoad,
            size: 15,
          });

          setTotalPages(res.totalPages);
          setAttendances((prev) => (append ? [...prev, ...res.content] : res.content));
        } else {
          // Manager view
          const statusParam: AppointmentStatus | undefined =
            managerStatusFilter === 'ALL' ? undefined : managerStatusFilter;

          const res = await getEstablishmentAttendances({
            professionalId: selectedProfId || undefined,
            status: statusParam,
            page: pageToLoad,
            size: 15,
          });

          setTotalPages(res.totalPages);
          setAttendances((prev) => (append ? [...prev, ...res.content] : res.content));
        }
      } catch {
        if (!append) setAttendances([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [isManager, profTab, managerStatusFilter, selectedProfId]
  );

  useEffect(() => {
    setPage(0);
    loadAttendances(0, false);
  }, [loadAttendances]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(0);
    loadAttendances(0, false);
  }, [loadAttendances]);

  const handleLoadMore = () => {
    if (loadingMore || page + 1 >= totalPages) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadAttendances(nextPage, true);
  };

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }

  // Filter local attendances by client search query
  const filteredAttendances = attendances.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.clientName?.toLowerCase().includes(q) ||
      item.clientPhone?.toLowerCase().includes(q) ||
      item.serviceName?.toLowerCase().includes(q) ||
      item.professionalName?.toLowerCase().includes(q)
    );
  });

  // Flow views
  if (editingSheetAppt) {
    return (
      <AtendimentoScreen
        appointment={editingSheetAppt}
        onBack={() => setEditingSheetAppt(null)}
        onSaved={() => {
          setEditingSheetAppt(null);
          handleRefresh();
        }}
      />
    );
  }

  if (historyClient) {
    return (
      <HistoricoClienteScreen
        clientId={historyClient.id}
        clientName={historyClient.name}
        onBack={() => setHistoryClient(null)}
        onSelectEntry={(_entry: TechnicalSheetEntry) => {}}
      />
    );
  }

  if (selectedAttendance) {
    return (
      <AtendimentoDetalhesCompletoScreen
        attendance={selectedAttendance}
        onBack={() => setSelectedAttendance(null)}
        onViewClientHistory={(clientId, clientName) => {
          setHistoryClient({ id: clientId, name: clientName });
        }}
        onEditTechnicalSheet={() => {
          setEditingSheetAppt({
            id: selectedAttendance.id,
            clientId: selectedAttendance.clientId,
            clientName: selectedAttendance.clientName,
            serviceName: selectedAttendance.serviceName,
            startDateTime: selectedAttendance.startDateTime,
          });
        }}
      />
    );
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
            <ChevronLeftIcon size={22} color={Colors.dark} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconBtn} />
        )}
        <Text style={[styles.headerTitle, { fontFamily: fontBold }]}>Atendimentos</Text>
        <View style={styles.iconBtn} />
      </View>

      {/* Tabs / Filters */}
      {!isManager ? (
        // Professional Tabs
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, profTab === 'IN_PROGRESS' && styles.tabBtnActive]}
            activeOpacity={0.8}
            onPress={() => setProfTab('IN_PROGRESS')}>
            <Text
              style={[
                styles.tabText,
                { fontFamily: fontSemiBold },
                profTab === 'IN_PROGRESS' && styles.tabTextActive,
              ]}>
              Em andamento
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, profTab === 'DONE' && styles.tabBtnActive]}
            activeOpacity={0.8}
            onPress={() => setProfTab('DONE')}>
            <Text
              style={[
                styles.tabText,
                { fontFamily: fontSemiBold },
                profTab === 'DONE' && styles.tabTextActive,
              ]}>
              Concluídos
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Manager Filters
        <View style={styles.managerFilters}>
          {/* Status filter chips */}
          <View style={styles.statusChipsRow}>
            {(
              [
                { key: 'ALL', label: 'Todos' },
                { key: 'IN_PROGRESS', label: 'Em andamento' },
                { key: 'DONE', label: 'Concluídos' },
              ] as const
            ).map((st) => (
              <TouchableOpacity
                key={st.key}
                style={[
                  styles.statusChip,
                  managerStatusFilter === st.key && styles.statusChipActive,
                ]}
                activeOpacity={0.8}
                onPress={() => setManagerStatusFilter(st.key)}>
                <Text
                  style={[
                    styles.statusChipText,
                    { fontFamily: fontSemiBold },
                    managerStatusFilter === st.key && styles.statusChipTextActive,
                  ]}>
                  {st.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Professional selection horizontal scroll */}
          {professionals.length > 0 ? (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={[{ id: '', name: 'Todos os Profissionais' }, ...professionals]}
              keyExtractor={(item) => item.id || 'all'}
              contentContainerStyle={styles.profChipsContent}
              renderItem={({ item }) => {
                const isSelected = item.id ? selectedProfId === item.id : selectedProfId === null;
                return (
                  <TouchableOpacity
                    style={[styles.profChip, isSelected && styles.profChipActive]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedProfId(item.id || null)}>
                    <Text
                      style={[
                        styles.profChipText,
                        { fontFamily: fontRegular },
                        isSelected && styles.profChipTextActive,
                      ]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          ) : null}
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchWrap}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar por cliente, serviço..."
          onClear={() => setSearchQuery('')}
        />
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      ) : (
        <FlatList
          data={filteredAttendances}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.gold}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={{ fontSize: 32 }}>✂️</Text>
              <Text style={[styles.emptyTitle, { fontFamily: fontSemiBold }]}>
                Nenhum atendimento encontrado.
              </Text>
              <Text style={[styles.emptySubtitle, { fontFamily: fontRegular }]}>
                {searchQuery
                  ? 'Tente buscar por outro termo.'
                  : !isManager && profTab === 'IN_PROGRESS'
                  ? 'Nenhum atendimento em andamento no momento.'
                  : 'Os atendimentos finalizados aparecerão aqui.'}
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={Colors.gold} />
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const isDone = item.status === 'DONE';
            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => setSelectedAttendance(item)}>
                {/* Card Top Row */}
                <View style={styles.cardTopRow}>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: isDone ? '#DEF7EC' : '#FEF3C7' },
                    ]}>
                    <Text
                      style={[
                        styles.statusPillText,
                        { color: isDone ? '#03543F' : '#92400E', fontFamily: fontSemiBold },
                      ]}>
                      {isDone ? 'Concluído' : 'Em andamento'}
                    </Text>
                  </View>
                  <Text style={[styles.cardDate, { fontFamily: fontRegular }]}>
                    {formatDate(item.startDateTime)}
                  </Text>
                </View>

                {/* Service and Client */}
                <View style={styles.cardBody}>
                  <Text style={[styles.serviceText, { fontFamily: fontBold }]}>
                    {item.serviceName}
                  </Text>
                  <Text style={[styles.clientText, { fontFamily: fontRegular }]}>
                    Cliente: <Text style={{ fontFamily: fontSemiBold }}>{item.clientName}</Text>
                  </Text>
                  {isManager ? (
                    <Text style={[styles.profText, { fontFamily: fontRegular }]}>
                      Profissional: <Text style={{ fontFamily: fontSemiBold }}>{item.professionalName}</Text>
                    </Text>
                  ) : null}
                </View>

                {/* Card Bottom Row: Badges & Total */}
                <View style={styles.cardBottomRow}>
                  <View style={styles.badgesRow}>
                    {item.photosCount > 0 ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>📷 {item.photosCount}</Text>
                      </View>
                    ) : null}

                    {item.hasTechnicalSheet ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>📝 Ficha</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.priceRow}>
                    <Text style={[styles.priceText, { fontFamily: fontBold }]}>
                      {formatBRL(item.totalAmount)}
                    </Text>
                    <ArrowRightIcon size={16} color={Colors.grey400} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.grey100,
  },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, color: Colors.dark },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grey100,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: Colors.surface,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(202, 160, 82, 0.12)',
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  tabText: {
    fontSize: 13,
    color: Colors.grey500,
  },
  tabTextActive: {
    color: Colors.goldDark,
  },
  managerFilters: {
    backgroundColor: Colors.white,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grey100,
  },
  statusChipsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.grey200,
  },
  statusChipActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  statusChipText: {
    fontSize: 12,
    color: Colors.grey500,
  },
  statusChipTextActive: {
    color: Colors.white,
  },
  profChipsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  profChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.grey100,
  },
  profChipActive: {
    borderColor: Colors.gold,
    backgroundColor: 'rgba(202, 160, 82, 0.08)',
  },
  profChipText: {
    fontSize: 12,
    color: Colors.grey500,
  },
  profChipTextActive: {
    color: Colors.goldDark,
    fontWeight: '600',
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 12,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.grey100,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 11,
  },
  cardDate: {
    fontSize: 12,
    color: Colors.grey500,
  },
  cardBody: {
    gap: 3,
  },
  serviceText: {
    fontSize: 16,
    color: Colors.dark,
  },
  clientText: {
    fontSize: 13,
    color: Colors.grey500,
  },
  profText: {
    fontSize: 12,
    color: Colors.grey500,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.grey100,
    paddingTop: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.grey200,
  },
  badgeText: {
    fontSize: 11,
    color: Colors.grey500,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceText: {
    fontSize: 15,
    color: Colors.goldDark,
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    color: Colors.dark,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.grey500,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
