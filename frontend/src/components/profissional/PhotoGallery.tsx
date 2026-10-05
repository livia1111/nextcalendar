import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PlusIcon, XIcon } from '@/components/icons';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';

export type GalleryPhoto = {
  id: string;
  uri: string;
  uploading?: boolean;
  error?: boolean;
};

interface PhotoGalleryProps {
  photos: GalleryPhoto[];
  onAddFromCamera: () => void;
  onAddFromLibrary: () => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
}

const TILE_SIZE = 84;

export function PhotoGallery({ photos, onAddFromCamera, onAddFromLibrary, onRemove, disabled }: PhotoGalleryProps) {
  const { fontSemiBold } = useAppFonts();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { fontFamily: fontSemiBold }]}>Fotos do atendimento</Text>

      <View style={styles.grid}>
        {photos.map((photo) => (
          <View key={photo.id} style={styles.tile}>
            <Image source={{ uri: photo.uri }} style={styles.image} />

            {photo.uploading && (
              <View style={styles.overlay}>
                <ActivityIndicator size="small" color={Colors.white} />
              </View>
            )}

            {photo.error && (
              <View style={[styles.overlay, { backgroundColor: 'rgba(232,64,64,0.55)' }]}>
                <Text style={styles.errorText}>Falhou</Text>
              </View>
            )}

            {!photo.uploading && (
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => onRemove(photo.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <XIcon size={12} color={Colors.white} />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, disabled && styles.disabled]}
          onPress={onAddFromCamera}
          disabled={disabled}
          activeOpacity={0.8}>
          <Text style={styles.actionEmoji}>📷</Text>
          <Text style={[styles.actionText, { fontFamily: fontSemiBold }]}>Câmera</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, disabled && styles.disabled]}
          onPress={onAddFromLibrary}
          disabled={disabled}
          activeOpacity={0.8}>
          <PlusIcon size={16} color={Colors.gold} />
          <Text style={[styles.actionText, { fontFamily: fontSemiBold }]}>Galeria</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  label: { fontSize: 14, color: Colors.dark },
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
  image: { width: '100%', height: '100%' },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: { color: Colors.white, fontSize: 11 },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(13,13,18,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsRow: { flexDirection: 'row', gap: 10 },
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
});