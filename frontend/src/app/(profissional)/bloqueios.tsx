import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';

import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';
import { useMyProfessionalProfile } from '@/hooks/useMyProfessionalProfile';
import {
  listBlockedTimes,
  deleteBlockedTime,
  type BlockedTime,
} from '@/services/blockedTimesServices';
import { listWorkingHours, type WorkingHours } from '@/services/workingHoursServices';
import { ClockIcon, PlusIcon } from '@/components/icons';
import { isAxiosError } from 'axios';

const DAY_NAMES = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const DAY_MAP_EN = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export default function ProfissionalBloqueiosScreen() {
  const { fontRegular, fontSemiBold, fontBold } = useAppFonts();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { establishmentId, professionalId } = useMyProfessionalProfile();

  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!establishmentId || !professionalId) return;

    try {
      setLoading(true);
      const [blocks, wh] = await Promise.all([
        listBlockedTimes(establishmentId, professionalId),
        listWorkingHours(establishmentId, professionalId),
      ]);
      setBlockedTimes(blocks);
      setWorkingHours(wh);
    } catch {
      // Silencia
    } finally {
      setLoading(false);
    }
  }, [establishmentId, professionalId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  function formatDateTime(iso: string) {
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const weekday = DAY_NAMES[d.getDay()];
    return {
      dateFormatted: `${day}/${month}/${year}`,
      weekday,
      time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
  }

  /**
   * Verifica se o bloqueio está fora do expediente atualmente cadastrado para o profissional.
   */
  function isOutsideWorkingHours(item: BlockedTime): boolean {
    const d = new Date(item.startDateTime);
    const dayEn = DAY_MAP_EN[d.getDay()];
    const wh = workingHours.find((w) => w.dayOfWeek === dayEn && w.active);
    if (!wh) return true; // Dia sem expediente

    const startTime = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const endTime = new Date(item.endDateTime).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return startTime < wh.startTime.slice(0, 5) || endTime > wh.endTime.slice(0, 5);
  }

  function confirmDelete(item: BlockedTime) {
    const { dateFormatted, time } = formatDateTime(item.startDateTime);
    const endTime = new Date(item.endDateTime).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    Alert.alert(
      'Remover Bloqueio',
      `Deseja liberar o horário bloqueado em ${dateFormatted} (${time} às ${endTime})?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => executeDelete(item.id),
        },
      ]
    );
  }

  async function executeDelete(id: string) {
    if (!establishmentId || !professionalId) return;

    setDeletingId(id);
    try {
      await deleteBlockedTime(establishmentId, professionalId, id);
      setBlockedTimes((prev) => prev.filter((b) => b.id !== id));
      Alert.alert('Sucesso', 'Bloqueio removido com sucesso.');
    } catch (err: any) {
      let msg = 'Não foi possível remover o bloqueio.';
      if (isAxiosError(err)) {
        msg = err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response?.data : msg);
      }
      Alert.alert('Erro', msg);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleCol}>
          <Text style={[styles.title, { fontFamily: fontBold }]}>Meus Bloqueios</Text>
          <Text style={[styles.subtitle, { fontFamily: fontRegular }]}>
            Gerencie intervalos de horário indisponíveis para clientes
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          activeOpacity={0.8}
          onPress={() => router.push('/(profissional)/novo-bloqueio' as any)}>
          <PlusIcon size={18} color={Colors.white} />
          <Text style={[styles.addBtnText, { fontFamily: fontSemiBold }]}>Bloquear</Text>
        </TouchableOpacity>
      </View>

      {/* Lista */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.gold} />
          <Text style={[styles.hintText, { fontFamily: fontRegular }]}>
            Carregando bloqueios...
          </Text>
        </View>
      ) : blockedTimes.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={{ fontSize: 36 }}>🔒</Text>
          <Text style={[styles.emptyTitle, { fontFamily: fontSemiBold }]}>
            Nenhum horário bloqueado
          </Text>
          <Text style={[styles.hintText, { fontFamily: fontRegular }]}>
            Você não possui nenhum bloqueio cadastrado. Toque no botão acima para bloquear um período do seu expediente.
          </Text>
        </View>
      ) : (
        <FlatList
          data={blockedTimes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.gold}
            />
          }
          renderItem={({ item }) => {
            const { dateFormatted, weekday, time } = formatDateTime(item.startDateTime);
            const endTime = new Date(item.endDateTime).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            });
            const isOutside = isOutsideWorkingHours(item);
            const isDeleting = deletingId === item.id;

            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.timeTag}>
                    <ClockIcon size={14} color={Colors.goldDark} />
                    <Text style={[styles.timeText, { fontFamily: fontSemiBold }]}>
                      {time} às {endTime}
                    </Text>
                  </View>

                  {isOutside && (
                    <View style={styles.warningBadge}>
                      <Text style={[styles.warningText, { fontFamily: fontSemiBold }]}>
                        ⚠️ Fora do expediente atual
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardBody}>
                  <Text style={[styles.dateText, { fontFamily: fontSemiBold }]}>
                    {weekday}, {dateFormatted}
                  </Text>
                  {item.reason ? (
                    <Text style={[styles.reasonText, { fontFamily: fontRegular }]}>
                      Motivo: <Text style={{ fontFamily: fontSemiBold }}>{item.reason}</Text>
                    </Text>
                  ) : (
                    <Text style={[styles.reasonText, { fontFamily: fontRegular, color: Colors.grey400 }]}>
                      Sem motivo informado
                    </Text>
                  )}
                </View>

                <View style={styles.cardFooter}>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    activeOpacity={0.8}
                    disabled={isDeleting}
                    onPress={() => confirmDelete(item)}>
                    {isDeleting ? (
                      <ActivityIndicator size="small" color="#DC2626" />
                    ) : (
                      <Text style={[styles.deleteBtnText, { fontFamily: fontSemiBold }]}>
                        Remover Bloqueio
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grey100,
  },
  headerTitleCol: {
    flex: 1,
    gap: 4,
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    color: Colors.dark,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.grey400,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.gold,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  addBtnText: {
    color: Colors.white,
    fontSize: 13,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    color: Colors.dark,
    marginTop: 8,
  },
  hintText: {
    fontSize: 13,
    color: Colors.grey400,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.grey100,
    gap: 10,
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF9EE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 13,
    color: Colors.goldDark,
  },
  warningBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  warningText: {
    fontSize: 11,
    color: '#92400E',
  },
  cardBody: {
    gap: 4,
  },
  dateText: {
    fontSize: 15,
    color: Colors.dark,
  },
  reasonText: {
    fontSize: 13,
    color: Colors.grey700,
  },
  cardFooter: {
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: Colors.grey100,
    paddingTop: 10,
  },
  deleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  deleteBtnText: {
    fontSize: 13,
    color: '#DC2626',
  },
});
