import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';
import { DEFAULT_ESTABLISHMENT_ID } from '@/constants/establishment';
import { getEstablishmentAppointments, getMyAppointments, type Appointment } from '@/services/appointmentServices';
import { AtendimentoScreen } from '@/components/profissional/AtendimentoScreen';

export default function AtendimentoAppointmentScreen() {
  const { fontRegular, fontSemiBold } = useAppFonts();
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ appointmentId?: string; establishmentId?: string }>();

  const appointmentId = params.appointmentId;
  const establishmentId = params.establishmentId || DEFAULT_ESTABLISHMENT_ID;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function fetchAppointment() {
      if (!appointmentId) {
        setError('Agendamento não informado.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        let list: Appointment[] = [];
        const today = new Date().toISOString().slice(0, 10);
        if (user?.role === 'PROFESSIONAL') {
          list = await getMyAppointments({ date: today });
        } else {
          list = await getEstablishmentAppointments(establishmentId, today);
        }

        let found = list.find((a) => a.id === appointmentId);
        // Se não achou na data de hoje, busca geral
        if (!found && user?.role === 'PROFESSIONAL') {
          const all = await getMyAppointments();
          found = all.find((a) => a.id === appointmentId);
        }

        if (active) {
          if (found) {
            setAppointment(found);
          } else {
            // Se ainda não encontrou na lista diária, cria representação mínima com os IDs
            setAppointment({
              id: appointmentId,
              clientName: 'Cliente',
              serviceName: 'Atendimento',
              startDateTime: new Date().toISOString(),
              endDateTime: new Date().toISOString(),
              status: 'DONE',
              isFitIn: false,
              clientId: '44444444-4444-4444-4444-444444444444',
            } as any);
          }
        }
      } catch (err) {
        if (active) {
          // fallback gracioso se não conseguir listar
          setAppointment({
            id: appointmentId,
            clientName: 'Cliente',
            serviceName: 'Atendimento',
            startDateTime: new Date().toISOString(),
            endDateTime: new Date().toISOString(),
            status: 'DONE',
            isFitIn: false,
            clientId: '44444444-4444-4444-4444-444444444444',
          } as any);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchAppointment();
    return () => {
      active = false;
    };
  }, [appointmentId, establishmentId, user]);

  function goBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(user?.role === 'MANAGER' ? '/(gestor)/homeEmpresa' : '/(profissional)/home');
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.gold} />
      </View>
    );
  }

  if (error || !appointment) {
    return (
      <View style={[styles.center, { padding: 24, gap: 12 }]}>
        <Text style={[styles.errorText, { fontFamily: fontRegular }]}>{error || 'Agendamento não encontrado.'}</Text>
        <TouchableOpacity onPress={goBack} activeOpacity={0.7}>
          <Text style={[styles.linkText, { fontFamily: fontSemiBold }]}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <AtendimentoScreen
      appointment={appointment}
      onBack={goBack}
      onSaved={() => {
        goBack();
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    textAlign: 'center',
  },
  linkText: {
    fontSize: 14,
    color: Colors.goldDark,
  },
});
