import { useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XIcon } from '@/components/icons';
import { BarberCard, Barber } from '@/components/ui/BarberCard';
import { CategoryPill } from '@/components/ui/CategoryPill';
import { SearchBar } from '@/components/ui/SearchBar';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';

const RECENT_SEARCHES = [
  'Barbearia Cortes Clássicos',
  'Sharp Gents Barbershop',
  'The Gentleman\'s Den',
  'Urban Edge Barbershop',
  'The Dapper Barber Lounge',
];

const CATEGORIES = ['Todos', 'Corte', 'Coloração', 'Shampoo'];

const NEARBY: Barber[] = [
  { id: '1', name: 'Studio Vision', address: 'Av. Imperatriz Leopoldina, 22ª', distance: '1.2 km', rating: 4.8, imageUri: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=300&q=80' },
  { id: '2', name: 'Studio Vision', address: 'Av. Imperatriz Leopoldina, 22ª', distance: '1.2 km', rating: 4.8, imageUri: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=300&q=80' },
];

export default function SearchScreen() {
  const { fontRegular, fontSemiBold } = useAppFonts();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [recents, setRecents] = useState(RECENT_SEARCHES);
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  function removeRecent(item: string) {
    setRecents(r => r.filter(x => x !== item));
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 80 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">

      {/* Search bar */}
      <Text style={[styles.pageTitle, { fontFamily: fontSemiBold }]}>Pesquisa</Text>
      <SearchBar value={query} onChangeText={setQuery} onClear={() => setQuery('')} />

      {/* Recent searches */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { fontFamily: fontSemiBold }]}>Pesquisa recente</Text>
        <TouchableOpacity onPress={() => setRecents([])}>
          <Text style={[styles.seeAll, { fontFamily: fontRegular }]}>Ver tudo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.recentList}>
        {recents.map(item => (
          <View key={item} style={styles.recentRow}>
            <Text style={[styles.recentText, { fontFamily: fontRegular }]} numberOfLines={1}>{item}</Text>
            <TouchableOpacity onPress={() => removeRecent(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <XIcon size={14} color={Colors.grey400} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Categories */}
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

      {/* Nearby results */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { fontFamily: fontSemiBold }]}>Em torno de você</Text>
      </View>
      <View style={styles.barberList}>
        {NEARBY.map(b => <BarberCard key={b.id} barber={b} />)}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.white },
  content: { paddingHorizontal: 20, gap: 16 },
  pageTitle: { color: Colors.dark, fontSize: 22, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: Colors.dark, fontSize: 16, fontWeight: '600' },
  seeAll: { color: Colors.gold, fontSize: 13 },
  recentList: { gap: 0, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: Colors.grey100 },
  recentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.grey100, backgroundColor: Colors.white },
  recentText: { color: Colors.dark, fontSize: 14, flex: 1, marginRight: 8 },
  categoriesRow: { gap: 8, paddingRight: 4 },
  barberList: { gap: 12 },
});
