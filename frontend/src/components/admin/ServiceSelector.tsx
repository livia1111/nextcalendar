import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PlusIcon, ClockIcon } from '@/components/icons';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';
import { ServiceResponse } from '@/services/serviceServices';

interface ServiceSelectorProps {
  services: ServiceResponse[];
  onAddPress: () => void;
  /** Exibe indicador de carregamento enquanto a lista é buscada */
  isLoading?: boolean;
  /** Exibe mensagem de erro se a busca falhar */
  hasError?: boolean;
}

function formatPrice(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function ServiceSelector({
  services,
  onAddPress,
  isLoading = false,
  hasError = false,
}: ServiceSelectorProps) {
  const { fontSemiBold, fontRegular } = useAppFonts();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <ClockIcon size={18} color={Colors.dark} />
          <Text style={[styles.title, { fontFamily: fontSemiBold }]}>Serviços</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          activeOpacity={0.7}
          onPress={onAddPress}>
          <PlusIcon size={14} color={Colors.goldDark} />
          <Text style={[styles.addBtnText, { fontFamily: fontSemiBold }]}>Adicionar</Text>
        </TouchableOpacity>
      </View>

      {/* Estado: carregando */}
      {isLoading && (
        <View style={styles.feedbackBox}>
          <ActivityIndicator size="small" color={Colors.gold} />
          <Text style={[styles.feedbackText, { fontFamily: fontRegular }]}>
            Carregando serviços…
          </Text>
        </View>
      )}

      {/* Estado: erro na busca */}
      {!isLoading && hasError && (
        <View style={styles.feedbackBox}>
          <Text style={[styles.errorText, { fontFamily: fontRegular }]}>
            ⚠️ Não foi possível carregar os serviços.
          </Text>
        </View>
      )}

      {/* Estado: sem serviços */}
      {!isLoading && !hasError && services.length === 0 && (
        <View style={styles.feedbackBox}>
          <Text style={{ fontSize: 28 }}>✂️</Text>
          <Text style={[styles.emptyTitle, { fontFamily: fontSemiBold }]}>
            Nenhum serviço cadastrado
          </Text>
          <Text style={[styles.feedbackText, { fontFamily: fontRegular }]}>
            Toque em "Adicionar" para cadastrar o primeiro serviço do catálogo.
          </Text>
        </View>
      )}

      {/* Lista de serviços */}
      {!isLoading && !hasError && services.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          {services.map((item) => (
            <View key={item.id} style={styles.card}>
              <Text style={[styles.name, { fontFamily: fontSemiBold }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[styles.category, { fontFamily: fontRegular }]} numberOfLines={1}>
                {item.category}
              </Text>
              <View style={styles.metaRow}>
                <Text style={[styles.price, { fontFamily: fontSemiBold }]}>
                  {formatPrice(item.price)}
                </Text>
                <Text style={[styles.duration, { fontFamily: fontRegular }]}>
                  {item.duration} min
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    color: Colors.dark,
    fontSize: 16,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F7F3E9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.goldLight,
  },
  addBtnText: {
    color: Colors.goldDark,
    fontSize: 13,
  },
  // ── Feedback boxes ──────────────────────────────────────────────────────────
  feedbackBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    gap: 6,
  },
  emptyTitle: {
    color: Colors.dark,
    fontSize: 14,
    textAlign: 'center',
  },
  feedbackText: {
    color: Colors.grey400,
    fontSize: 13,
    textAlign: 'center',
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    textAlign: 'center',
  },
  // ── Lista ───────────────────────────────────────────────────────────────────
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  card: {
    width: 140,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.grey100,
    gap: 4,
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  name: {
    color: Colors.dark,
    fontSize: 13,
  },
  category: {
    color: Colors.grey400,
    fontSize: 11,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  price: {
    color: Colors.goldDark,
    fontSize: 13,
  },
  duration: {
    color: Colors.grey400,
    fontSize: 11,
  },
});
