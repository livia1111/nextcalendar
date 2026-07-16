import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BellIcon, LocationPinIcon } from '@/components/icons';
import { BarberCard, Barber } from '@/components/ui/BarberCard';
import { CategoryPill } from '@/components/ui/CategoryPill';
import { SearchBar } from '@/components/ui/SearchBar';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';

const CATEGORIES = ['Todos', 'Corte', 'Coloração', 'Shampoo', 'Barbas'];

const BARBERS: Barber[] = [
  {
    id: '1',
    name: 'Studio Vision',
    address: 'Av. Imperatriz Leopoldina, 22ª',
    distance: '1.2 km',
    rating: 4.8,
    imageUri: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=300&q=80',
  },
  {
    id: '2',
    name: 'Barbearia Clássicos',
    address: 'Rua das Flores, 100 - Centro',
    distance: '2.3 km',
    rating: 4.6,
    imageUri: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=300&q=80',
  },
  {
    id: '3',
    name: 'Sharp Gents Barbershop',
    address: 'Av. Brasil, 445 - Sala 12',
    distance: '3.1 km',
    rating: 4.9,
    imageUri: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=300&q=80',
  },
];

export default function HomeScreen() {
  const { fontRegular, fontSemiBold, fontBold } = useAppFonts();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [remindersOn, setRemindersOn] = useState(true);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 80 }]}
      showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.locationRow}>
            <LocationPinIcon size={14} />
            <Text style={[styles.locationText, { fontFamily: fontRegular }]}>São Leopoldo - RS</Text>
          </View>
          <Text style={[styles.greeting, { fontFamily: fontSemiBold }]}>Bom dia, Glaucio 👋</Text>
        </View>
        <TouchableOpacity style={styles.bellButton}>
          <BellIcon size={22} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <SearchBar value={search} onChangeText={setSearch} onClear={() => setSearch('')} />

      {/* Promo Banner */}
      <LinearGradient
        colors={[Colors.gold, Colors.goldDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.promoBanner}>
        <View style={styles.promoContent}>
          <Text style={[styles.promoTag, { fontFamily: fontSemiBold }]}>50% OFF</Text>
          <Text style={[styles.promoTitle, { fontFamily: fontBold }]}>Especial de hoje 30%</Text>
          <Text style={[styles.promoSub, { fontFamily: fontRegular }]}>
            Obtenha um desconto em todos os seus pedidos de serviço!
          </Text>
          <TouchableOpacity style={styles.promoButton}>
            <Text style={[styles.promoButtonText, { fontFamily: fontSemiBold }]}>Válido somente hoje!</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Categories */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { fontFamily: fontSemiBold }]}>Categorias</Text>
        <TouchableOpacity>
          <Text style={[styles.seeAll, { fontFamily: fontRegular }]}>Ver tudo</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
        {CATEGORIES.map(cat => (
          <CategoryPill
            key={cat}
            label={cat}
            selected={selectedCategory === cat}
            onPress={() => setSelectedCategory(cat)}
          />
        ))}
      </ScrollView>

      {/* Upcoming appointments */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { fontFamily: fontSemiBold }]}>Consultas futuras</Text>
        <View style={styles.reminderRow}>
          <Text style={[styles.reminderLabel, { fontFamily: fontRegular }]}>Lembrete</Text>
          <Switch
            value={remindersOn}
            onValueChange={setRemindersOn}
            trackColor={{ false: Colors.grey100, true: Colors.gold }}
            thumbColor={Colors.white}
          />
        </View>
      </View>

      {/* Upcoming card */}
      <View style={styles.upcomingCard}>
        <Text style={[styles.upcomingDate, { fontFamily: fontSemiBold }]}>Dez 22, 2026</Text>
        <BarberCard barber={BARBERS[0]} />
        <View style={styles.upcomingActions}>
          <TouchableOpacity style={styles.cancelBtn}>
            <Text style={[styles.cancelText, { fontFamily: fontSemiBold }]}>Cancelar Reserva</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rescheduleBtn}>
            <Text style={[styles.rescheduleText, { fontFamily: fontSemiBold }]}>S-Recibo</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Nearby */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { fontFamily: fontSemiBold }]}>Localização Próxima</Text>
        <TouchableOpacity>
          <Text style={[styles.seeAll, { fontFamily: fontRegular }]}>Ver tudo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.barberList}>
        {BARBERS.map(barber => (
          <BarberCard key={barber.id} barber={barber} />
        ))}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.white },
  content: { paddingHorizontal: 20, gap: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { gap: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { color: Colors.grey400, fontSize: 13 },
  greeting: { color: Colors.dark, fontSize: 20, fontWeight: '600' },
  bellButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: Colors.grey100, alignItems: 'center', justifyContent: 'center' },
  promoBanner: { borderRadius: 16, padding: 20, overflow: 'hidden' },
  promoContent: { gap: 6 },
  promoTag: { color: Colors.white, fontSize: 12, opacity: 0.9 },
  promoTitle: { color: Colors.white, fontSize: 22 },
  promoSub: { color: Colors.white, fontSize: 13, opacity: 0.85, lineHeight: 20 },
  promoButton: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, marginTop: 4 },
  promoButtonText: { color: Colors.white, fontSize: 13 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: Colors.dark, fontSize: 16, fontWeight: '600' },
  seeAll: { color: Colors.gold, fontSize: 13 },
  categoriesRow: { gap: 8, paddingRight: 4 },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reminderLabel: { color: Colors.grey400, fontSize: 13 },
  upcomingCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 12 },
  upcomingDate: { color: Colors.dark, fontSize: 14 },
  upcomingActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, height: 40, borderRadius: 10, borderWidth: 1, borderColor: Colors.grey200, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: Colors.grey500, fontSize: 13 },
  rescheduleBtn: { flex: 1, height: 40, borderRadius: 10, backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center' },
  rescheduleText: { color: Colors.white, fontSize: 13 },
  barberList: { gap: 12 },
});
