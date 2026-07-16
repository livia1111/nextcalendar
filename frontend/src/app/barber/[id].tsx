import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeftIcon, LocationPinIcon, MenuDotsIcon, StarIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';

const TABS = ['Sobre', 'Serviços', 'Pacotes', 'Avaliações'] as const;
type Tab = typeof TABS[number];

const SERVICES = [
  { id: '1', name: 'Cabelo', price: 125.0 },
  { id: '2', name: 'Barba', price: 125.0 },
  { id: '3', name: 'Blindagem', price: 125.0 },
  { id: '4', name: 'Sobrancelha', price: 125.0 },
  { id: '5', name: 'Corte com Visagismo', price: 125.0 },
];

const ARTISTS = [
  { id: 'a1', name: 'G.Siqueira', imageUri: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&q=80' },
  { id: 'a2', name: 'B.Albornoz', imageUri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80' },
];

export default function BarberDetailScreen() {
  const { fontRegular, fontSemiBold, fontBold } = useAppFonts();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<Tab>('Sobre');

  return (
    <View style={styles.root}>
      {/* Hero Image */}
      <View style={styles.hero}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80' }}
          style={styles.heroImage}
          contentFit="cover"
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.5)', 'transparent']}
          style={styles.heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        {/* Nav */}
        <View style={[styles.heroNav, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
            <ChevronLeftIcon color="white" />
          </TouchableOpacity>
          <Text style={[styles.heroTitle, { fontFamily: fontSemiBold }]}>Detalhes</Text>
          <TouchableOpacity style={styles.navBtn}>
            <MenuDotsIcon color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}>

        {/* Info card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Text style={[styles.barberName, { fontFamily: fontBold }]}>Studio Vision</Text>
              <View style={styles.locationRow}>
                <LocationPinIcon size={13} />
                <Text style={[styles.address, { fontFamily: fontRegular }]} numberOfLines={2}>
                  Av. Imperatriz Leopoldina, 22ª - Sala 23
                </Text>
              </View>
            </View>
            <View style={[styles.badge, { backgroundColor: '#E6F9EF' }]}>
              <Text style={[styles.badgeText, { fontFamily: fontSemiBold, color: Colors.success }]}>Aberto</Text>
            </View>
          </View>

          {/* Artists */}
          <View style={styles.artistsSection}>
            <Text style={[styles.artistsTitle, { fontFamily: fontSemiBold }]}>Nossos Artistas</Text>
            <View style={styles.artistsRow}>
              {ARTISTS.map(a => (
                <TouchableOpacity key={a.id} style={styles.artist}>
                  <Image source={{ uri: a.imageUri }} style={styles.artistPhoto} contentFit="cover" />
                  <Text style={[styles.artistName, { fontFamily: fontRegular }]}>{a.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, { fontFamily: fontSemiBold }, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'Sobre' && (
          <View style={styles.tabContent}>
            <Text style={[styles.contentTitle, { fontFamily: fontSemiBold }]}>Descrição</Text>
            <Text style={[styles.description, { fontFamily: fontRegular }]}>
              Studio Vision é um espaço de atendimento exclusivo, focado em imagem e identidade. Especialista em visagismo masculino, cada corte é pensado de forma estratégica para valorizar seu rosto e comunicar quem você é.
            </Text>

            <Text style={[styles.contentTitle, { fontFamily: fontSemiBold }]}>Horários</Text>
            <View style={styles.hoursRow}>
              <Text style={[styles.hoursLabel, { fontFamily: fontRegular }]}>Segunda - Sexta</Text>
              <Text style={[styles.hoursValue, { fontFamily: fontSemiBold }]}>08:00 - 21:00</Text>
            </View>
            <View style={styles.hoursRow}>
              <Text style={[styles.hoursLabel, { fontFamily: fontRegular }]}>Sábado - Domingo</Text>
              <Text style={[styles.hoursValue, { fontFamily: fontSemiBold }]}>09:00 - 20:00</Text>
            </View>

            <Text style={[styles.contentTitle, { fontFamily: fontSemiBold }]}>Endereço</Text>
            <View style={styles.locationRow}>
              <LocationPinIcon />
              <Text style={[styles.address, { fontFamily: fontRegular }]}>
                Av. Imperatriz Leopoldina, 22ª - Sala 23
              </Text>
            </View>
          </View>
        )}

        {activeTab === 'Serviços' && (
          <View style={styles.tabContent}>
            <View style={styles.servicesHeader}>
              <Text style={[styles.contentTitle, { fontFamily: fontSemiBold }]}>Nossos Serviços</Text>
              <TouchableOpacity>
                <Text style={[styles.seeAll, { fontFamily: fontRegular }]}>See All</Text>
              </TouchableOpacity>
            </View>
            {SERVICES.map(s => (
              <View key={s.id} style={styles.serviceRow}>
                <Text style={[styles.serviceName, { fontFamily: fontRegular }]}>{s.name}</Text>
                <TouchableOpacity style={styles.servicePriceBtn}>
                  <Text style={[styles.servicePrice, { fontFamily: fontSemiBold }]}>
                    R$ {s.price.toFixed(2)} ›
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {(activeTab === 'Pacotes' || activeTab === 'Avaliações') && (
          <View style={styles.tabContent}>
            <Text style={[styles.description, { fontFamily: fontRegular }]}>Em breve...</Text>
          </View>
        )}

      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomCTA, { paddingBottom: insets.bottom + 16 }]}>
        <Button label="Agendar" onPress={() => router.push('/booking')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.white },
  hero: { height: 260, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  heroNav: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  navBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { color: Colors.white, fontSize: 18 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, gap: 20, paddingTop: 16 },
  infoCard: { gap: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  infoLeft: { flex: 1, gap: 6 },
  barberName: { color: Colors.dark, fontSize: 20 },
  locationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  address: { color: Colors.grey400, fontSize: 13, lineHeight: 19, flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 13 },
  artistsSection: { gap: 10 },
  artistsTitle: { color: Colors.dark, fontSize: 15 },
  artistsRow: { flexDirection: 'row', gap: 16 },
  artist: { alignItems: 'center', gap: 4 },
  artistPhoto: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: Colors.gold },
  artistName: { color: Colors.grey500, fontSize: 11 },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.grey100 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.gold },
  tabText: { color: Colors.grey400, fontSize: 13 },
  tabTextActive: { color: Colors.gold },
  tabContent: { gap: 14 },
  contentTitle: { color: Colors.dark, fontSize: 15, fontWeight: '600' },
  description: { color: Colors.grey500, fontSize: 14, lineHeight: 22 },
  hoursRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.grey100 },
  hoursLabel: { color: Colors.grey500, fontSize: 14 },
  hoursValue: { color: Colors.dark, fontSize: 14 },
  servicesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  seeAll: { color: Colors.gold, fontSize: 13 },
  serviceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.grey100 },
  serviceName: { color: Colors.dark, fontSize: 15 },
  servicePriceBtn: { backgroundColor: Colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  servicePrice: { color: Colors.gold, fontSize: 14 },
  bottomCTA: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.grey100 },
});
