import { isAxiosError } from 'axios';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeftIcon, MenuDotsIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';
import { useAuth } from '@/context/AuthContext';
import { createAppointment } from '@/services/appointmentServices';
import { getClientByUserId, type ClientDetails } from '@/services/clientServices';

type BookingParams = {
  establishmentId?: string | string[];
  professionalId?: string | string[];
  serviceId?: string | string[];
  startDateTime?: string | string[];
  serviceName?: string | string[];
  professionalName?: string | string[];
  price?: string | string[];
};

function getParam(param: string | string[] | undefined): string {
  if (!param) return '';
  return Array.isArray(param) ? param[0] : param;
}

function formatDateTimeLabel(iso: string) {
  if (!iso) return { date: '--/--/----', time: '--:--' };
  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    // Fallback de parse manual se a string for ISO simples
    const parts = iso.split('T');
    const datePart = parts[0] ? parts[0].split('-').reverse().join('/') : '--/--/----';
    const timePart = parts[1] ? parts[1].slice(0, 5) : '--:--';
    return { date: datePart, time: timePart };
  }
  const date = d.toLocaleDateString('pt-BR');
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return { date, time };
}

export default function BookingScreen() {
  const { fontRegular, fontSemiBold, fontBold } = useAppFonts();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const rawParams = useLocalSearchParams<BookingParams>();
  const establishmentId = getParam(rawParams.establishmentId);
  const professionalId = getParam(rawParams.professionalId);
  const serviceId = getParam(rawParams.serviceId);
  const startDateTime = getParam(rawParams.startDateTime);
  const serviceName = getParam(rawParams.serviceName);
  const professionalName = getParam(rawParams.professionalName);
  const price = getParam(rawParams.price);

  const [client, setClient] = useState<ClientDetails | null>(null);
  const [loadingClient, setLoadingClient] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { date, time } = formatDateTimeLabel(startDateTime);

  useEffect(() => {
    async function loadClient() {
      if (!user?.id) {
        setLoadingClient(false);
        return;
      }
      try {
        const data = await getClientByUserId(user.id);
        setClient(data);
      } catch {
        setError('Não foi possível identificar seus dados de cliente. Tente novamente.');
      } finally {
        setLoadingClient(false);
      }
    }
    loadClient();
  }, [user?.id]);

  async function handleConfirm() {
    if (!establishmentId || !professionalId || !serviceId || !startDateTime) {
      setError('Dados incompletos para confirmar o agendamento. Volte e tente novamente.');
      return;
    }
    if (!client?.id) {
      setError('Não foi possível identificar seu cadastro de cliente. Tente novamente.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await createAppointment(establishmentId, {
        professionalId,
        serviceId,
        clientId: client.id,
        startDateTime,
        isFitIn: false,
      });
      router.replace('/(tabs)/home');
    } catch (e) {
      if (isAxiosError(e)) {
        const backendMsg = e.response?.data?.message || (typeof e.response?.data === 'string' ? e.response?.data : null);
        setError(backendMsg || 'Não foi possível confirmar o agendamento. O horário pode ter ficado indisponível — tente buscar novamente.');
      } else {
        setError('Não foi possível confirmar o agendamento. O horário pode ter ficado indisponível — tente buscar novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.topNav}>
          <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
            <ChevronLeftIcon />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { fontFamily: fontSemiBold }]}>Confirmar Agendamento</Text>
          <TouchableOpacity style={styles.navBtn}>
            <MenuDotsIcon />
          </TouchableOpacity>
        </View>

        {/* Resumo */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily: fontSemiBold }]}>Resumo do agendamento</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { fontFamily: fontRegular }]}>Serviço</Text>
              <Text style={[styles.summaryValue, { fontFamily: fontSemiBold }]}>
                {serviceName || '—'}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { fontFamily: fontRegular }]}>Profissional</Text>
              <Text style={[styles.summaryValue, { fontFamily: fontSemiBold }]}>
                {professionalName || '—'}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { fontFamily: fontRegular }]}>Data</Text>
              <Text style={[styles.summaryValue, { fontFamily: fontSemiBold }]}>{date}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { fontFamily: fontRegular }]}>Horário</Text>
              <Text style={[styles.summaryValue, { fontFamily: fontSemiBold }]}>{time}</Text>
            </View>

            {!!price && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { fontFamily: fontRegular }]}>Valor</Text>
                <Text style={[styles.summaryValue, { fontFamily: fontBold }]}>
                  R$ {Number(price).toFixed(2)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={[styles.errorText, { fontFamily: fontRegular }]}>{error}</Text>
          </View>
        )}

      </ScrollView>

      {/* CTA */}
      <View style={[styles.bottomCTA, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          label={submitting ? 'Confirmando...' : 'Confirmar Agendamento'}
          onPress={handleConfirm}
          disabled={submitting || loadingClient}
        />
        {loadingClient && (
          <ActivityIndicator size="small" color={Colors.gold} style={{ marginTop: 8 }} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.white },
  scroll: { paddingHorizontal: 20, gap: 24 },
  topNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: Colors.grey100, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { color: Colors.dark, fontSize: 18 },
  section: { gap: 14 },
  sectionTitle: { color: Colors.dark, fontSize: 16, fontWeight: '600' },
  summaryCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 14 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryLabel: { color: Colors.grey400, fontSize: 14 },
  summaryValue: { color: Colors.dark, fontSize: 14 },
  errorBox: { backgroundColor: '#FEF2F2', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#FECACA' },
  errorText: { color: Colors.error, fontSize: 13 },
  bottomCTA: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.grey100 },
});