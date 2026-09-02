import React, { useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { LocationPinIcon, PlusIcon } from '@/components/icons';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';
import type { Booking } from '@/services/bookingServices';

interface NextBookingCardProps {
  booking?: Booking | null;
  bookings?: Booking[];
  onNewBookingPress: () => void;
}

export function NextBookingCard({
  booking,
  bookings,
  onNewBookingPress,
}: NextBookingCardProps) {
  const { fontRegular, fontSemiBold, fontBold } = useAppFonts();
  const { width: windowWidth } = useWindowDimensions();
  const cardWidth = windowWidth - 40; // paddingHorizontal 20 de cada lado na Home

  const [activeIndex, setActiveIndex] = useState(0);

  // Lista normalizada
  const list = bookings ?? (booking ? [booking] : []);

  if (list.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Text style={styles.emptyIconText}>📅</Text>
        </View>
        <Text style={[styles.emptyTitle, { fontFamily: fontSemiBold }]}>
          Nenhum agendamento marcado
        </Text>
        <Text style={[styles.emptySubtitle, { fontFamily: fontRegular }]}>
          Que tal agendar seu horário com praticidade?
        </Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={onNewBookingPress}
          activeOpacity={0.85}>
          <PlusIcon size={16} color={Colors.white} />
          <Text style={[styles.emptyButtonText, { fontFamily: fontSemiBold }]}>
            Agendar Horário
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / cardWidth);
    if (index !== activeIndex && index >= 0 && index < list.length) {
      setActiveIndex(index);
    }
  }

  function renderCard(item: Booking, index?: number) {
    return (
      <View style={[styles.card, list.length > 1 && { width: cardWidth }]}>
        <View style={styles.topRow}>
          <View style={styles.dateGroup}>
            <Text style={[styles.dateText, { fontFamily: fontSemiBold }]}>
              {item.date}
            </Text>
            {list.length > 1 && (
              <Text style={[styles.indexIndicator, { fontFamily: fontRegular }]}>
                ({(index ?? 0) + 1} de {list.length})
              </Text>
            )}
          </View>
          <View style={styles.statusBadge}>
            <Text style={[styles.statusText, { fontFamily: fontSemiBold }]}>
              Confirmado
            </Text>
          </View>
        </View>

        <View style={styles.bodyRow}>
          <View style={styles.avatarBox}>
            <Text style={{ fontSize: 20 }}>✂️</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={[styles.shopName, { fontFamily: fontSemiBold }]}>
              {item.shop}
            </Text>
            <View style={styles.addrRow}>
              <LocationPinIcon size={12} />
              <Text
                style={[styles.addrText, { fontFamily: fontRegular }]}
                numberOfLines={1}>
                {item.address}
              </Text>
            </View>
            <Text
              style={[styles.servicesText, { fontFamily: fontRegular }]}
              numberOfLines={1}>
              {item.services}
            </Text>
          </View>
          <Text style={[styles.priceText, { fontFamily: fontBold }]}>
            {item.price}
          </Text>
        </View>
      </View>
    );
  }

  // Card único
  if (list.length === 1) {
    return renderCard(list[0]);
  }

  // Carrossel com múltiplos agendamentos
  return (
    <View style={styles.carouselContainer}>
      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        snapToInterval={cardWidth}
        decelerationRate="fast"
        renderItem={({ item, index }) => renderCard(item, index)}
      />

      {/* Dots de paginação */}
      <View style={styles.dotsContainer}>
        {list.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.dot,
              idx === activeIndex ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  carouselContainer: {
    gap: 10,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  dateText: {
    color: Colors.dark,
    fontSize: 14,
  },
  indexIndicator: {
    color: Colors.grey400,
    fontSize: 12,
  },
  statusBadge: {
    backgroundColor: Colors.goldLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: Colors.gold,
    fontSize: 12,
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.grey100,
  },
  infoBox: {
    flex: 1,
    gap: 2,
  },
  shopName: {
    color: Colors.dark,
    fontSize: 15,
  },
  addrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addrText: {
    color: Colors.grey400,
    fontSize: 12,
    flex: 1,
  },
  servicesText: {
    color: Colors.grey500,
    fontSize: 12,
    marginTop: 2,
  },
  priceText: {
    color: Colors.gold,
    fontSize: 15,
  },

  // Dots de Paginação
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingTop: 2,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 18,
    backgroundColor: Colors.gold,
  },
  dotInactive: {
    width: 6,
    backgroundColor: Colors.grey200,
  },

  // Empty State Styles
  emptyContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyIconText: {
    fontSize: 22,
  },
  emptyTitle: {
    color: Colors.dark,
    fontSize: 15,
  },
  emptySubtitle: {
    color: Colors.grey400,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gold,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
    gap: 6,
  },
  emptyButtonText: {
    color: Colors.white,
    fontSize: 13,
  },
});

