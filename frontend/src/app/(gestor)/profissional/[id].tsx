import { isAxiosError } from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddProfessionalModal } from '@/components/admin/AddProfessionalModal';
import { ChevronLeftIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';
import { useEstablishment } from '@/hooks/useEstablishment';
import { getProfessionalById, type ProfessionalMin, updateProfessionalAsAdmin, type ProfessionalAdminUpdateInput } from '@/services/professionalServices';
import {
  listBlockedTimes,
  deleteBlockedTime,
  type BlockedTime,
} from '@/services/blockedTimesServices';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function formatTimeOnly(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatDateOnly(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function ProfissionalDetailScreen() {
  const { fontRegular, fontSemiBold } = useAppFonts();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { establishmentId, loading: loadingEst } = useEstablishment();

  // ── Estado do profissional ─────────────────────────────────────────────────
  const [professional, setProfessional] = useState<ProfessionalMin | null>(null);
  const [loadingProf, setLoadingProf] = useState(true);

  // ── Estado dos bloqueios ───────────────────────────────────────────────────
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Modal de edição do profissional ───────────────────────────────────────
  const [editModalVisible, setEditModalVisible] = useState(false);

  // ─── Carrega dados ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!establishmentId || !id) return;
    loadProfessional();
    loadBlocked();
  }, [establishmentId, id]);

  async function loadProfessional() {
    setLoadingProf(true);
    try {
      const prof = await getProfessionalById(establishmentId!, id!);
      setProfessional(prof);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os dados do profissional.');
    } finally {
      setLoadingProf(false);
    }
  }

  async function loadBlocked() {
    setLoadingBlocked(true);
    try {
      const list = await listBlockedTimes(establishmentId!, id!);
      setBlockedTimes(list);
    } catch {
      // Lista vazia — não bloqueia a tela
      setBlockedTimes([]);
    } finally {
      setLoadingBlocked(false);
    }
  }

  // ─── Excluir bloqueio ─────────────────────────────────────────────────────
  function confirmDelete(item: BlockedTime) {
    Alert.alert(
      'Remover bloqueio',
      `Deseja remover o bloqueio de ${formatDateOnly(item.startDateTime)}, ${formatTimeOnly(item.startDateTime)}–${formatTimeOnly(item.endDateTime)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => handleDelete(item.id),
        },
      ]
    );
  }

  async function handleDelete(blockedTimeId: string) {
    setDeletingId(blockedTimeId);
    try {
      await deleteBlockedTime(establishmentId!, id!, blockedTimeId);
      setBlockedTimes(prev => prev.filter(b => b.id !== blockedTimeId));
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 404) {
        Alert.alert('Erro', 'Bloqueio não encontrado. Atualizando lista...');
        loadBlocked();
      } else {
        Alert.alert('Erro', 'Não foi possível remover o bloqueio. Tente novamente.');
      }
    } finally {
      setDeletingId(null);
    }
  }

  // ─── Atualização do profissional via modal ────────────────────────────────
  async function handleUpdateProfessional(input: ProfessionalAdminUpdateInput) {
    if (!establishmentId || !id) return;
    try {
      const updated = await updateProfessionalAsAdmin(establishmentId, id, input);
      setProfessional(updated);
      Alert.alert('Sucesso', 'Profissional atualizado com sucesso!');
      setEditModalVisible(false);
    } catch (err: any) {
      Alert.alert('Erro', err?.message || 'Não foi possível salvar as alterações.');
      throw err;
    }
  }

  // ─── Loading inicial ───────────────────────────────────────────────────────
  if (loadingEst || loadingProf) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={Colors.gold} size="large" />
      </View>
    );
  }

  if (!professional) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeftIcon size={22} />
        </TouchableOpacity>
        <Text style={[styles.emptyHint, { fontFamily: fontRegular }]}>
          Profissional não encontrado.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeftIcon size={22} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: fontSemiBold }]} numberOfLines={1}>
          {professional.name}
        </Text>
        <TouchableOpacity
          onPress={() => setEditModalVisible(true)}
          style={[styles.backBtn, styles.editBtn]}
        >
          <Text style={[styles.editBtnText, { fontFamily: fontSemiBold }]}>Editar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Card do profissional ────────────────────────────────────────── */}
        <View style={styles.profCard}>
          <View style={styles.profAvatar}>
            <Text style={[styles.profAvatarText, { fontFamily: fontSemiBold }]}>
              {professional.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profInfo}>
            <Text style={[styles.profName, { fontFamily: fontSemiBold }]}>
              {professional.name}
            </Text>
            {professional.specialty ? (
              <Text style={[styles.profDetail, { fontFamily: fontRegular }]}>
                {professional.specialty}
              </Text>
            ) : null}
            {professional.email ? (
              <Text style={[styles.profDetail, { fontFamily: fontRegular }]}>
                {professional.email}
              </Text>
            ) : null}
            {professional.commission != null ? (
              <Text style={[styles.profDetail, { fontFamily: fontRegular }]}>
                Comissão: {professional.commission}%
              </Text>
            ) : null}
            <View style={[styles.badge, professional.active ? styles.badgeActive : styles.badgeInactive]}>
              <Text style={[styles.badgeText, { fontFamily: fontSemiBold }]}>
                {professional.active ? 'Ativo' : 'Inativo'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Seção de Bloqueios ──────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { fontFamily: fontSemiBold }]}>
              Bloqueios de horário
            </Text>
            <Button
              label="+ Bloquear"
              onPress={() =>
                router.push({
                  pathname: '/(gestor)/profissional/bloquear-horario',
                  params: {
                    professionalId: id,
                    professionalName: professional.name,
                  },
                })
              }
              style={styles.addBlockBtn}
            />
          </View>

          {loadingBlocked ? (
            <ActivityIndicator color={Colors.gold} style={{ marginTop: 12 }} />
          ) : blockedTimes.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={[styles.emptyHint, { fontFamily: fontRegular }]}>
                Nenhum bloqueio cadastrado.
              </Text>
            </View>
          ) : (
            blockedTimes.map(item => (
              <View key={item.id} style={styles.blockedCard}>
                <View style={styles.blockedInfo}>
                  <Text style={[styles.blockedDate, { fontFamily: fontSemiBold }]}>
                    {formatDateOnly(item.startDateTime)}
                  </Text>
                  <Text style={[styles.blockedTime, { fontFamily: fontRegular }]}>
                    {formatTimeOnly(item.startDateTime)} → {formatTimeOnly(item.endDateTime)}
                  </Text>
                  {item.reason ? (
                    <Text style={[styles.blockedReason, { fontFamily: fontRegular }]}>
                      {item.reason}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  onPress={() => confirmDelete(item)}
                  disabled={deletingId === item.id}
                  style={styles.deleteBtn}
                >
                  {deletingId === item.id ? (
                    <ActivityIndicator size="small" color={Colors.error} />
                  ) : (
                    <Text style={[styles.deleteBtnText, { fontFamily: fontSemiBold }]}>✕</Text>
                  )}
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* ── Modal de edição ───────────────────────────────────────────────── */}
      <AddProfessionalModal
        visible={editModalVisible}
        mode="edit"
        professional={professional}
        establishmentId={establishmentId}
        onClose={() => setEditModalVisible(false)}
        onSubmit={async () => {}}
        onUpdate={handleUpdateProfessional}
      />
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  centered: { alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grey100,
    backgroundColor: Colors.surface,
  },
  backBtn: { width: 52, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, color: Colors.dark, flex: 1, textAlign: 'center' },
  editBtn: { width: 52 },
  editBtnText: { fontSize: 14, color: Colors.gold },

  scroll: { padding: 16, gap: 20 },

  // Card do profissional
  profCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.grey100,
  },
  profAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profAvatarText: { fontSize: 22, color: Colors.white },
  profInfo: { flex: 1, gap: 4 },
  profName: { fontSize: 17, color: Colors.dark },
  profDetail: { fontSize: 13, color: Colors.grey400 },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginTop: 4,
  },
  badgeActive: { backgroundColor: '#D1FAE5' },
  badgeInactive: { backgroundColor: '#FEE2E2' },
  badgeText: { fontSize: 11, color: Colors.dark },

  // Seção de bloqueios
  section: { gap: 12 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { fontSize: 15, color: Colors.dark },
  addBlockBtn: { paddingHorizontal: 14, paddingVertical: 8, minHeight: 0 } as any,

  emptyBox: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.grey100,
  },
  emptyHint: { fontSize: 13, color: Colors.grey400, fontStyle: 'italic' },

  // Card de bloqueio
  blockedCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.grey100,
  },
  blockedInfo: { flex: 1, gap: 2 },
  blockedDate: { fontSize: 14, color: Colors.dark },
  blockedTime: { fontSize: 13, color: Colors.grey500 },
  blockedReason: { fontSize: 12, color: Colors.grey400, fontStyle: 'italic', marginTop: 2 },
  deleteBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
  },
  deleteBtnText: { fontSize: 14, color: Colors.error },
});
