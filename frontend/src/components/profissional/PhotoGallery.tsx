import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PlusIcon, XIcon } from '@/components/icons';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';
import { type PhotoType } from '@/services/photoServices';

export type GalleryPhoto = {
  id: string;
  uri: string;
  type?: PhotoType;
  caption?: string | null;
  takenByName?: string | null;
  createdAt?: string;
  uploading?: boolean;
  error?: boolean;
};

interface PhotoGalleryProps {
  photos: GalleryPhoto[];
  onAddFromCamera?: () => void;
  onAddFromLibrary?: () => void;
  onRemove?: (id: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
}

const TILE_SIZE = 100;

export function PhotoGallery({
  photos,
  onAddFromCamera,
  onAddFromLibrary,
  onRemove,
  disabled,
  readOnly,
}: PhotoGalleryProps) {
  const { fontRegular, fontSemiBold, fontBold } = useAppFonts();
  const [fullscreenPhoto, setFullscreenPhoto] = useState<GalleryPhoto | null>(null);

  function getTypeLabel(type?: PhotoType) {
    if (type === 'BEFORE') return 'Antes';
    if (type === 'AFTER') return 'Depois';
    return 'Outro';
  }

  function getTypeColor(type?: PhotoType) {
    if (type === 'BEFORE') return '#D97706';
    if (type === 'AFTER') return '#059669';
    return Colors.grey500;
  }

  function confirmRemove(id: string) {
    if (!onRemove) return;
    Alert.alert('Excluir foto', 'Deseja realmente remover esta foto do atendimento?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => onRemove(id) },
    ]);
  }

  function formatDate(iso?: string) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { fontFamily: fontSemiBold }]}>Fotos do atendimento</Text>

      {photos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { fontFamily: fontRegular }]}>
            Nenhuma foto registrada ainda.
          </Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {photos.map((photo) => {
            const typeLabel = getTypeLabel(photo.type);
            const typeColor = getTypeColor(photo.type);

            return (
              <TouchableOpacity
                key={photo.id}
                style={styles.tile}
                activeOpacity={0.85}
                onPress={() => setFullscreenPhoto(photo)}>
                <Image source={{ uri: photo.uri }} style={styles.image} />

                {photo.type ? (
                  <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
                    <Text style={[styles.typeBadgeText, { fontFamily: fontSemiBold }]}>
                      {typeLabel}
                    </Text>
                  </View>
                ) : null}

                {photo.uploading && (
                  <View style={styles.overlay}>
                    <ActivityIndicator size="small" color={Colors.white} />
                  </View>
                )}

                {photo.error && (
                  <View style={[styles.overlay, { backgroundColor: 'rgba(232,64,64,0.7)' }]}>
                    <Text style={styles.errorText}>Falhou</Text>
                  </View>
                )}

                {!readOnly && onRemove && !photo.uploading && (
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => confirmRemove(photo.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <XIcon size={12} color={Colors.white} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {!readOnly && (onAddFromCamera || onAddFromLibrary) ? (
        <View style={styles.actionsRow}>
          {onAddFromCamera ? (
            <TouchableOpacity
              style={[styles.actionBtn, disabled && styles.disabled]}
              onPress={onAddFromCamera}
              disabled={disabled}
              activeOpacity={0.8}>
              <Text style={styles.actionEmoji}>📷</Text>
              <Text style={[styles.actionText, { fontFamily: fontSemiBold }]}>Tirar Foto</Text>
            </TouchableOpacity>
          ) : null}

          {onAddFromLibrary ? (
            <TouchableOpacity
              style={[styles.actionBtn, disabled && styles.disabled]}
              onPress={onAddFromLibrary}
              disabled={disabled}
              activeOpacity={0.8}>
              <PlusIcon size={16} color={Colors.gold} />
              <Text style={[styles.actionText, { fontFamily: fontSemiBold }]}>Galeria</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {/* Fullscreen Photo Modal */}
      {fullscreenPhoto ? (
        <Modal visible transparent animationType="fade" onRequestClose={() => setFullscreenPhoto(null)}>
          <View style={styles.fsOverlay}>
            <TouchableOpacity
              style={styles.fsCloseBtn}
              onPress={() => setFullscreenPhoto(null)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <XIcon size={24} color={Colors.white} />
            </TouchableOpacity>

            <View style={styles.fsImageContainer}>
              <Image source={{ uri: fullscreenPhoto.uri }} style={styles.fsImage} />
            </View>

            <View style={styles.fsInfoCard}>
              <View style={styles.fsInfoRow}>
                <View
                  style={[
                    styles.typeBadgeLarge,
                    { backgroundColor: getTypeColor(fullscreenPhoto.type) },
                  ]}>
                  <Text style={[styles.typeBadgeLargeText, { fontFamily: fontBold }]}>
                    {getTypeLabel(fullscreenPhoto.type)}
                  </Text>
                </View>
                {fullscreenPhoto.createdAt ? (
                  <Text style={[styles.fsDate, { fontFamily: fontRegular }]}>
                    {formatDate(fullscreenPhoto.createdAt)}
                  </Text>
                ) : null}
              </View>

              {fullscreenPhoto.takenByName ? (
                <Text style={[styles.fsTakenBy, { fontFamily: fontRegular }]}>
                  Registrado por: <Text style={{ fontFamily: fontSemiBold }}>{fullscreenPhoto.takenByName}</Text>
                </Text>
              ) : null}

              {fullscreenPhoto.caption ? (
                <Text style={[styles.fsCaption, { fontFamily: fontRegular }]}>
                  "{fullscreenPhoto.caption}"
                </Text>
              ) : null}
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  label: { fontSize: 14, color: Colors.dark },
  emptyContainer: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.grey100,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: Colors.grey500,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.grey100,
  },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  typeBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    color: Colors.white,
    fontSize: 10,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: { color: Colors.white, fontSize: 11 },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(13,13,18,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    backgroundColor: 'transparent',
  },
  actionEmoji: { fontSize: 15 },
  actionText: { fontSize: 13, color: Colors.gold },
  disabled: { opacity: 0.5 },

  // Fullscreen modal styles
  fsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
    padding: 16,
  },
  fsCloseBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  fsImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fsImage: {
    width: '100%',
    height: '80%',
    resizeMode: 'contain',
  },
  fsInfoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    padding: 16,
    gap: 8,
    marginBottom: Platform.OS === 'ios' ? 30 : 10,
  },
  fsInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeBadgeLarge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeLargeText: {
    color: Colors.white,
    fontSize: 12,
  },
  fsDate: {
    color: Colors.grey200,
    fontSize: 12,
  },
  fsTakenBy: {
    color: Colors.white,
    fontSize: 13,
  },
  fsCaption: {
    color: Colors.grey200,
    fontSize: 13,
    fontStyle: 'italic',
  },
});