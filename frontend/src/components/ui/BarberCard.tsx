import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LocationPinIcon, StarIcon } from '@/components/icons';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';

export interface Barber {
  id: string;
  name: string;
  address: string;
  distance?: string;
  rating?: number;
  imageUri?: string;
  isOpen?: boolean;
}

interface BarberCardProps {
  barber: Barber;
}

export function BarberCard({ barber }: BarberCardProps) {
  const { fontRegular, fontSemiBold } = useAppFonts();
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => router.push(`/barber/${barber.id}`)}>
      <Image
        source={{ uri: barber.imageUri ?? 'https://api.builder.io/api/v1/image/assets/TEMP/barber-placeholder' }}
        style={styles.image}
        contentFit="cover"
      />
      <View style={styles.info}>
        <Text style={[styles.name, { fontFamily: fontSemiBold }]} numberOfLines={1}>{barber.name}</Text>
        <View style={styles.row}>
          <LocationPinIcon size={13} />
          <Text style={[styles.address, { fontFamily: fontRegular }]} numberOfLines={1}>{barber.address}</Text>
        </View>
        <View style={styles.footer}>
          {barber.distance && (
            <Text style={[styles.meta, { fontFamily: fontRegular }]}>📍 {barber.distance}</Text>
          )}
          {barber.rating !== undefined && (
            <View style={styles.rating}>
              <StarIcon size={12} />
              <Text style={[styles.meta, { fontFamily: fontSemiBold }]}>{barber.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.grey100,
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 10,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: Colors.dark,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  address: {
    color: Colors.grey400,
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 2,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  meta: {
    color: Colors.grey500,
    fontSize: 12,
    lineHeight: 18,
  },
});
