import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PlusIcon, UsersIcon } from '@/components/icons';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';
import { ProfessionalMin } from '@/services/professionalServices';
import { Image } from 'expo-image';

interface ProfessionalSelectorProps {
  professionals: ProfessionalMin[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAddPress: () => void;
  /** Exibe indicador de carregamento enquanto o hook busca os dados */
  isLoading?: boolean;
  /** Exibe mensagem de erro se a busca falhar */
  hasError?: boolean;
}

export function ProfessionalSelector({
  professionals,
  selectedId,
  onSelect,
  onAddPress,
  isLoading = false,
  hasError = false,
}: ProfessionalSelectorProps) {
  const { fontSemiBold, fontRegular } = useAppFonts();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <UsersIcon size={18} color={Colors.dark} />
          <Text style={[styles.title, { fontFamily: fontSemiBold }]}>Equipe & Profissionais</Text>
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
            Carregando profissionais…
          </Text>
        </View>
      )}

      {/* Estado: erro na busca */}
      {!isLoading && hasError && (
        <View style={styles.feedbackBox}>
          <Text style={[styles.errorText, { fontFamily: fontRegular }]}>
            ⚠️ Não foi possível carregar os profissionais.
          </Text>
        </View>
      )}

      {/* Estado: sem profissionais */}
      {!isLoading && !hasError && professionals.length === 0 && (
        <View style={styles.feedbackBox}>
          <Text style={{ fontSize: 28 }}>👤</Text>
          <Text style={[styles.emptyTitle, { fontFamily: fontSemiBold }]}>
            Nenhum profissional cadastrado
          </Text>
          <Text style={[styles.feedbackText, { fontFamily: fontRegular }]}>
            Toque em "Adicionar" para cadastrar o primeiro profissional da equipe.
          </Text>
        </View>
      )}

      {/* Lista de profissionais */}
      {!isLoading && !hasError && professionals.length > 0 && (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Opção "Todos" */}
        <TouchableOpacity
          style={[
            styles.card,
            selectedId === null && styles.cardSelected,
          ]}
          activeOpacity={0.8}
          onPress={() => onSelect(null)}>
          <View style={[styles.avatarPlaceholder, selectedId === null && styles.avatarSelected]}>
            <UsersIcon size={18} color={selectedId === null ? Colors.white : Colors.grey500} />
          </View>
          <Text
            style={[
              styles.name,
              { fontFamily: fontSemiBold },
              selectedId === null && styles.nameSelected,
            ]}
            numberOfLines={1}>
            Todos
          </Text>
          <Text style={[styles.specialty, { fontFamily: fontRegular }]}>Geral</Text>
        </TouchableOpacity>

        {/* Cards dos profissionais */}
        {professionals.map((prof) => {
          const isSelected = selectedId === prof.id;
          const initials = prof.name
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();

          return (
            <TouchableOpacity
              key={prof.id}
              style={[styles.card, isSelected && styles.cardSelected]}
              activeOpacity={0.8}
              onPress={() => onSelect(prof.id)}>
              {prof.photoUrl ? (
                <Image
                  source={{ uri: prof.photoUrl }}
                  style={[styles.avatar, isSelected && styles.avatarSelected]}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.avatarPlaceholder, isSelected && styles.avatarSelected]}>
                  <Text
                    style={[
                      styles.initialsText,
                      { fontFamily: fontSemiBold },
                      isSelected && { color: Colors.white },
                    ]}>
                    {initials}
                  </Text>
                </View>
              )}

              <Text
                style={[
                  styles.name,
                  { fontFamily: fontSemiBold },
                  isSelected && styles.nameSelected,
                ]}
                numberOfLines={1}>
                {prof.nickname || prof.name.split(' ')[0]}
              </Text>

              <Text style={[styles.specialty, { fontFamily: fontRegular }]} numberOfLines={1}>
                {prof.specialty || 'Profissional'}
              </Text>
            </TouchableOpacity>
          );
        })}
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
    width: 96,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.grey100,
    alignItems: 'center',
    gap: 4,
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardSelected: {
    borderColor: Colors.gold,
    backgroundColor: '#FCFAF5',
    shadowColor: Colors.gold,
    shadowOpacity: 0.15,
    elevation: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: 4,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.grey200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarSelected: {
    backgroundColor: Colors.gold,
    borderColor: Colors.goldDark,
  },
  initialsText: {
    color: Colors.grey500,
    fontSize: 14,
  },
  name: {
    color: Colors.dark,
    fontSize: 13,
    textAlign: 'center',
  },
  nameSelected: {
    color: Colors.dark,
    fontWeight: '700',
  },
  specialty: {
    color: Colors.grey400,
    fontSize: 11,
    textAlign: 'center',
  },
});

