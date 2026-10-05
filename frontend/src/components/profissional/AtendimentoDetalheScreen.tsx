import { useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeftIcon } from '@/components/icons';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';
import { API_BASE_URL } from '@/services/api';
import { DEFAULT_ESTABLISHMENT_ID } from '@/constants/establishment';
import { getClientAppointments, type Appointment } from '@/services/appointmentServices';
import { type TechnicalSheetEntry } from '@/services/technicalSheetServices';

interface AtendimentoDetalheScreenProps {
  entry: TechnicalSheetEntry;
  clientId: string;
  clientName: string;
  onBack: () => void;
  onEdit: (appointment: Appointment) => void;
}

export function AtendimentoDetalheScreen({ entry, clientId, clientName, onBack, onEdit }: AtendimentoDetalheScreenProps) {
  const { fontRegular, fontSemiBold, fontBold } = useAppFonts();
  const insets = useSafeAreaInsets();
  const [loadingEdit, setLoadingEdit] = useState(false);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  async function handleEdit() {
    setLoadingEdit(true);
    try {
      const appointments = await getClientAppointments(DEFAULT_ESTABLISHMENT_ID, clientId);
      const appointment = appointments.find((a) => a.id === entry.appointmentId);
      if (!appointment) {
        Alert.alert('Não encontrado', 'Não foi possível localizar o agendamento original deste atendimento.');
        return;
      }
      onEdit(appointment);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar o agendamento. Tente novamente.');
    } finally {
      setLoadingEdit(false);
    }
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <ChevronLeftIcon size={22} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: fontBold }]}>Detalhes do atendimento</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryCard}>
          <View style={styles.dateChip}>
            <Text style={[styles.dateChipText, { fontFamily: fontBold }]}>
              {formatDate(entry.createdAt)}
            </Text>
          </View>
          <Text style={[styles.serviceName, { fontFamily: fontSemiBold }]}>{entry.serviceName}</Text>
          <Text style={[styles.summaryLine, { fontFamily: fontRegular }]}>
            Cliente: <Text style={{ fontFamily: fontSemiBold, color: Colors.dark }}>{clientName}</Text>
          </Text>
          <Text style={[styles.summaryLine, { fontFamily: fontRegular }]}>
            Por <Text style={{ fontFamily: fontSemiBold, color: Colors.goldDark }}>{entry.professionalName}</Text>
          </Text>
        </View>

        <View style={styles.block}>
          <Text style={[styles.label, { fontFamily: fontSemiBold }]}>Fotos do resultado</Text>
          {entry.photos.length === 0 ? (
            <Text style={[styles.noPhotosText, { fontFamily: fontRegular }]}>Nenhuma foto registrada.</Text>
          ) : (
            <View style={styles.photoGrid}>
              {entry.photos.map((photo) => (
                <Image key={photo.id} source={{ uri: `${API_BASE_URL}${photo.photoUrl}` }} style={styles.photo} />
              ))}
            </View>
          )}
        </View>

        <View style={styles.block}>
          <Text style={[styles.label, { fontFamily: fontSemiBold }]}>Anotações técnicas (privado)</Text>
          <View style={styles.notesBox}>
            <Text style={[styles.notesText, { fontFamily: fontRegular }]}>
              {entry.notes || 'Nenhuma anotação registrada.'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.editButton, loadingEdit && styles.disabled]}
          onPress={handleEdit}
          disabled={loadingEdit}
          activeOpacity={0.85}>
          {loadingEdit ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <Text style={[styles.editButtonText, { fontFamily: fontSemiBold }]}>Editar informações</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  content: { padding: 20, gap: 20, paddingBottom: 40 },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.grey100,
  },
  dateChip: { alignSelf: 'flex-start' },
  dateChipText: { fontSize: 12, color: Colors.goldDark, textTransform: 'capitalize' },
  serviceName: { fontSize: 17, color: Colors.dark },
  summaryLine: { fontSize: 13, color: Colors.grey500 },
  block: { gap: 10 },
  label: { fontSize: 14, color: Colors.dark },
  noPhotosText: { fontSize: 13, color: Colors.grey400 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photo: { width: 84, height: 84, borderRadius: 12 },
  notesBox: {
    backgroundColor: '#FDF6E3',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.goldLight,
    padding: 14,
  },
  notesText: { fontSize: 13, color: '#5C4A1E', lineHeight: 20 },
  editButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  editButtonText: { color: Colors.white, fontSize: 15 },
  disabled: { opacity: 0.6 },
});