import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeftIcon } from '@/components/icons';
import { PhotoGallery, type GalleryPhoto } from '@/components/professional/PhotoGallery';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';
import { API_BASE_URL } from '@/services/api';
import { type Appointment } from '@/services/appointmentServices';
import {
  findEntryByAppointment,
  getFullSheet,
  saveEntry,
  uploadPhoto,
} from '@/services/technicalSheetServices';

interface AtendimentoScreenProps {
  appointment: Appointment;
  onBack: () => void;
  onSaved?: () => void;
}

export function AtendimentoScreen({ appointment, onBack, onSaved }: AtendimentoScreenProps) {
  const { fontRegular, fontSemiBold, fontBold } = useAppFonts();
  const insets = useSafeAreaInsets();

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [existingEntryId, setExistingEntryId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [saving, setSaving] = useState(false);

  const hasClient = !!appointment.clientId;

  useEffect(() => {
    if (!hasClient) {
      setLoadingInitial(false);
      return;
    }

    let active = true;
    async function load() {
      try {
        const sheet = await getFullSheet(appointment.clientId);
        const entry = findEntryByAppointment(sheet, appointment.id);
        if (active && entry) {
          setExistingEntryId(entry.id);
          setNotes(entry.notes ?? '');
          setPhotos(
            entry.photos.map((p) => ({
              id: p.id,
              uri: `${API_BASE_URL}${p.photoUrl}`,
            }))
          );
        }
      } catch {

      } finally {
        if (active) setLoadingInitial(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [appointment.id, appointment.clientId, hasClient]);

  async function handlePick(fromCamera: boolean) {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permissão necessária', fromCamera
        ? 'Precisamos da câmera para tirar a foto.'
        : 'Precisamos acessar suas fotos para escolher uma imagem.');
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.6, base64: true })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.6, base64: true });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    if (!asset.base64) return;

    const tempId = `local-${Date.now()}`;
    setPhotos((prev) => [...prev, { id: tempId, uri: asset.uri, uploading: true }]);

    try {
      const contentType = asset.mimeType ?? 'image/jpeg';
      const uploaded = await uploadPhoto(asset.base64, contentType);
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === tempId ? { id: uploaded.id, uri: `${API_BASE_URL}${uploaded.url}` } : p
        )
      );
    } catch {
      setPhotos((prev) =>
        prev.map((p) => (p.id === tempId ? { ...p, uploading: false, error: true } : p))
      );
      Alert.alert('Erro', 'Não foi possível enviar a foto. Tente novamente.');
    }
  }

  function handleRemovePhoto(id: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleSave() {
    if (!hasClient) return;

    const stillUploading = photos.some((p) => p.uploading);
    if (stillUploading) {
      Alert.alert('Aguarde', 'Ainda tem foto subindo — espera terminar antes de salvar.');
      return;
    }

    setSaving(true);
    try {
      const photoUrls = photos
        .filter((p) => !p.error)
        .map((p) => (p.uri.startsWith(API_BASE_URL) ? p.uri.replace(API_BASE_URL, '') : p.uri));

      await saveEntry(appointment.clientId, existingEntryId, {
        appointmentId: appointment.id,
        notes: notes.trim() || undefined,
        photoUrls,
      });

      Alert.alert('Pronto', 'Atendimento registrado com sucesso.');
      onSaved?.();
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o atendimento. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <ChevronLeftIcon size={22} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: fontBold }]}>Atendimento</Text>
        <View style={styles.iconBtn} />
      </View>

      {loadingInitial ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.gold} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Resumo do atendimento */}
          <View style={styles.summaryCard}>
            <Text style={[styles.serviceName, { fontFamily: fontSemiBold }]}>
              {appointment.serviceName}
            </Text>
            <Text style={[styles.summaryLine, { fontFamily: fontRegular }]}>
              Cliente: <Text style={{ fontFamily: fontSemiBold, color: Colors.dark }}>{appointment.clientName}</Text>
            </Text>
            <Text style={[styles.summaryLine, { fontFamily: fontRegular }]}>
              {new Date(appointment.startDateTime).toLocaleString('pt-BR', {
                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
              })}
            </Text>
          </View>

          {!hasClient ? (
            <View style={styles.warningBox}>
              <Text style={[styles.warningText, { fontFamily: fontSemiBold }]}>
                Este agendamento não tem um cliente cadastrado.
              </Text>
              <Text style={[styles.warningSubtext, { fontFamily: fontRegular }]}>
                Só é possível registrar fotos e anotações para clientes cadastrados no sistema.
              </Text>
            </View>
          ) : (
            <>
              {/* Anotações */}
              <View style={styles.block}>
                <Text style={[styles.label, { fontFamily: fontSemiBold }]}>Observações do atendimento</Text>
                <TextInput
                  style={[styles.textarea, { fontFamily: fontRegular }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Preferências do cliente, restrições, referências, etc."
                  placeholderTextColor={Colors.grey400}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />
              </View>

              {/* Fotos */}
              <View style={styles.block}>
                <PhotoGallery
                  photos={photos}
                  onAddFromCamera={() => handlePick(true)}
                  onAddFromLibrary={() => handlePick(false)}
                  onRemove={handleRemovePhoto}
                  disabled={saving}
                />
              </View>

              <Button
                label={saving ? 'Salvando...' : 'Salvar atendimento'}
                onPress={handleSave}
                loading={saving}
                style={styles.saveButton}
              />
            </>
          )}
        </ScrollView>
      )}
    </KeyboardAvoidingView>
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, gap: 20, paddingBottom: 40 },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.grey100,
  },
  serviceName: { fontSize: 16, color: Colors.dark },
  summaryLine: { fontSize: 13, color: Colors.grey500 },
  block: { gap: 10 },
  label: { fontSize: 14, color: Colors.dark },
  textarea: {
    minHeight: 110,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.grey100,
    backgroundColor: Colors.white,
    padding: 14,
    fontSize: 14,
    color: Colors.dark,
  },
  warningBox: {
    backgroundColor: '#FDF2E9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
    padding: 16,
    gap: 4,
  },
  warningText: { color: '#92400E', fontSize: 14 },
  warningSubtext: { color: '#92400E', fontSize: 12 },
  saveButton: { marginTop: 4 },
});