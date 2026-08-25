import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BellIcon, LocationPinIcon, SettingsIcon } from '@/components/icons';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';
import { useRouter } from 'expo-router';

interface AdminHeaderProps {
  establishmentName: string;
  managerName: string;
  totalAppointments: number;
  activeProfessionalsCount: number;
  nextAppointmentTime?: string;
  onSignOut: () => void;
}

export function AdminHeader({
  establishmentName,
  managerName,
  totalAppointments,
  activeProfessionalsCount,
  nextAppointmentTime = '09:00',
  onSignOut,
}: AdminHeaderProps) {
  const { fontSemiBold, fontRegular } = useAppFonts();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <LinearGradient
      colors={[Colors.gold, Colors.goldDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { paddingTop: insets.top + 16 }]}>
      
      {/* Top row */}
      <View style={styles.topRow}>
        <View style={styles.infoCol}>
          <View style={styles.badgeRow}>
            <LocationPinIcon size={14} color={Colors.white} />
            <Text style={[styles.establishmentText, { fontFamily: fontSemiBold }]}>
              {establishmentName || 'Minha Empresa'}
            </Text>
          </View>
          <Text style={[styles.greetingText, { fontFamily: fontSemiBold }]}>
            Painel do Gestor 👋
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.8}
            onPress={() => router.push('/empresa')}
            accessibilityLabel="Configurações da Empresa">
            <SettingsIcon size={18} color={Colors.white} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.8}
            onPress={onSignOut}
            accessibilityLabel="Sair">
            <Text style={[styles.logoutBtnText, { fontFamily: fontSemiBold }]}>Sair</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* KPI Cards Row */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricCard}>
          <Text style={[styles.metricNumber, { fontFamily: fontSemiBold }]}>{totalAppointments}</Text>
          <Text style={[styles.metricLabel, { fontFamily: fontRegular }]}>Agendamentos</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricCard}>
          <Text style={[styles.metricNumber, { fontFamily: fontSemiBold }]}>{activeProfessionalsCount}</Text>
          <Text style={[styles.metricLabel, { fontFamily: fontRegular }]}>Profissionais</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricCard}>
          <Text style={[styles.metricNumber, { fontFamily: fontSemiBold }]}>{nextAppointmentTime}</Text>
          <Text style={[styles.metricLabel, { fontFamily: fontRegular }]}>Próximo Atend.</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  infoCol: {
    flex: 1,
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  establishmentText: {
    color: Colors.white,
    fontSize: 13,
    opacity: 0.9,
  },
  greetingText: {
    color: Colors.white,
    fontSize: 22,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtnText: {
    color: Colors.white,
    fontSize: 12,
  },
  metricsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  metricNumber: {
    color: Colors.white,
    fontSize: 18,
  },
  metricLabel: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
});
