import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { XIcon } from '@/components/icons';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';
import { uploadAppointmentPhoto, type AttendancePhoto, type PhotoType } from '@/services/photoServices';
import { getApiErrorMessage } from '@/utils/apiError';

interface PhotoCaptureModalProps {
  visible: boolean;
  appointmentId: string;
  onClose: () => void;
  onPhotoSaved: (photo: AttendancePhoto) => void;
}

export function PhotoCaptureModal({
  visible,
  appointmentId,
  onClose,
  onPhotoSaved,
}: PhotoCaptureModalProps) {
  const { fontRegular, fontSemiBold, fontBold } = useAppFonts();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [type, setType] = useState<PhotoType>('BEFORE');
  const [caption, setCaption] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  function resetState() {
    setImageUri(null);
    setMimeType('image/jpeg');
    setType('BEFORE');
    setCaption('');
    setSaving(false);
    setErrorMsg('');
  }

  function handleClose() {
    if (saving) return;
    resetState();
    onClose();
  }

  async function handleLaunchCamera() {
    setErrorMsg('');
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== ImagePicker.PermissionStatus.GRANTED) {
        Alert.alert(
          'Permissão necessária',
          'Para tirar fotos é necessário autorizar o acesso à câmera.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Abrir Configurações', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setImageUri(asset.uri);
        setMimeType(asset.mimeType || 'image/jpeg');
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível abrir a câmera.');
    }
  }

  async function handleLaunchLibrary() {
    setErrorMsg('');
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== ImagePicker.PermissionStatus.GRANTED) {
        Alert.alert(
          'Permissão necessária',
          'Para escolher fotos é necessário autorizar o acesso à galeria.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Abrir Configurações', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setImageUri(asset.uri);
        setMimeType(asset.mimeType || 'image/jpeg');
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível abrir a galeria.');
    }
  }

  async function handleSavePhoto() {
    if (!imageUri) return;
    setSaving(true);
    setErrorMsg('');

    try {
      const photo = await uploadAppointmentPhoto(
        appointmentId,
        imageUri,
        mimeType,
        type,
        caption
      );
      resetState();
      onPhotoSaved(photo);
      onClose();
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, 'Erro ao salvar foto do atendimento.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { fontFamily: fontBold }]}>
              {imageUri ? 'Confirmar Foto' : 'Adicionar Foto'}
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              disabled={saving}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <XIcon size={20} color={Colors.grey500} />
            </TouchableOpacity>
          </View>

          {!imageUri ? (
            <View style={styles.pickOptions}>
              <Text style={[styles.instruction, { fontFamily: fontRegular }]}>
                Capture ou escolha uma foto para registrar o atendimento:
              </Text>
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={styles.optionCard}
                  activeOpacity={0.8}
                  onPress={handleLaunchCamera}>
                  <Text style={styles.optionEmoji}>📸</Text>
                  <Text style={[styles.optionTitle, { fontFamily: fontSemiBold }]}>Tirar Foto</Text>
                  <Text style={[styles.optionSub, { fontFamily: fontRegular }]}>Abrir câmera</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.optionCard}
                  activeOpacity={0.8}
                  onPress={handleLaunchLibrary}>
                  <Text style={styles.optionEmoji}>🖼️</Text>
                  <Text style={[styles.optionTitle, { fontFamily: fontSemiBold }]}>Galeria</Text>
                  <Text style={[styles.optionSub, { fontFamily: fontRegular }]}>Escolher salva</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.previewContainer}
              keyboardShouldPersistTaps="handled">
              {/* Preview image */}
              <View style={styles.imagePreviewBox}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              </View>

              {/* Type selector */}
              <Text style={[styles.sectionLabel, { fontFamily: fontSemiBold }]}>Tipo da Foto</Text>
              <View style={styles.typeSelector}>
                {(
                  [
                    { key: 'BEFORE', label: 'Antes' },
                    { key: 'AFTER', label: 'Depois' },
                    { key: 'OTHER', label: 'Outro' },
                  ] as const
                ).map((opt) => {
                  const isSelected = type === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[styles.typeBtn, isSelected && styles.typeBtnActive]}
                      activeOpacity={0.8}
                      onPress={() => setType(opt.key)}>
                      <Text
                        style={[
                          styles.typeBtnText,
                          { fontFamily: fontSemiBold },
                          isSelected && styles.typeBtnTextActive,
                        ]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Caption input */}
              <Text style={[styles.sectionLabel, { fontFamily: fontSemiBold }]}>
                Legenda (opcional)
              </Text>
              <TextInput
                style={[styles.input, { fontFamily: fontRegular }]}
                placeholder="Ex: Antes do procedimento, corte lateral..."
                placeholderTextColor={Colors.grey400}
                value={caption}
                onChangeText={setCaption}
                maxLength={300}
              />

              {errorMsg ? (
                <View style={styles.errorBox}>
                  <Text style={[styles.errorText, { fontFamily: fontRegular }]}>{errorMsg}</Text>
                </View>
              ) : null}

              {/* Actions */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.btn, styles.btnCancel]}
                  activeOpacity={0.8}
                  disabled={saving}
                  onPress={() => setImageUri(null)}>
                  <Text style={[styles.btnCancelText, { fontFamily: fontSemiBold }]}>
                    Escolher Outra
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btn, styles.btnSave, saving && styles.btnDisabled]}
                  activeOpacity={0.8}
                  disabled={saving}
                  onPress={handleSavePhoto}>
                  {saving ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <Text style={[styles.btnSaveText, { fontFamily: fontBold }]}>Salvar Foto</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    color: Colors.dark,
  },
  closeBtn: {
    padding: 4,
  },
  pickOptions: {
    paddingVertical: 12,
    gap: 16,
  },
  instruction: {
    fontSize: 14,
    color: Colors.grey500,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  optionCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.grey100,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 6,
  },
  optionEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  optionTitle: {
    fontSize: 15,
    color: Colors.dark,
  },
  optionSub: {
    fontSize: 12,
    color: Colors.grey500,
  },
  previewContainer: {
    paddingBottom: 20,
    gap: 14,
  },
  imagePreviewBox: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.dark,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  sectionLabel: {
    fontSize: 13,
    color: Colors.dark,
    marginTop: 4,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.grey200,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  typeBtnActive: {
    borderColor: Colors.gold,
    backgroundColor: 'rgba(202, 160, 82, 0.12)',
  },
  typeBtnText: {
    fontSize: 13,
    color: Colors.grey500,
  },
  typeBtnTextActive: {
    color: Colors.goldDark,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.grey200,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.dark,
    backgroundColor: Colors.surface,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 10,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  btn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancel: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.grey200,
  },
  btnCancelText: {
    color: Colors.grey500,
    fontSize: 14,
  },
  btnSave: {
    backgroundColor: Colors.gold,
  },
  btnSaveText: {
    color: Colors.white,
    fontSize: 14,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
