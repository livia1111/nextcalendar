import React from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';
import { useAuth } from '@/context/AuthContext';
import { useMyProfessionalProfile } from '@/hooks/useMyProfessionalProfile';
import { ChevronLeftIcon, UserTabIcon } from '@/components/icons';

export default function ProfissionalPerfilScreen() {
  const { fontRegular, fontSemiBold, fontBold } = useAppFonts();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut } = useAuth();
  const { professional, loading } = useMyProfessionalProfile();

  function handleSignOut() {
    Alert.alert(
      'Sair da Conta',
      'Deseja realmente sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/login');
          },
        },
      ]
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { fontFamily: fontBold }]}>Meu Perfil</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.gold} />
          </View>
        ) : (
          <>
            {/* Card Principal com Avatar */}
            <View style={styles.profileCard}>
              <View style={styles.avatarCircle}>
                <Text style={[styles.avatarInitials, { fontFamily: fontBold }]}>
                  {professional?.name
                    ? professional.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()
                    : 'PR'}
                </Text>
              </View>

              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { fontFamily: fontBold }]}>
                  {professional?.name || 'Profissional'}
                </Text>
                {professional?.nickname ? (
                  <Text style={[styles.profileNickname, { fontFamily: fontRegular }]}>
                    "{professional.nickname}"
                  </Text>
                ) : null}
                <Text style={[styles.profileEstablishment, { fontFamily: fontSemiBold }]}>
                  ✂️ {professional?.establishmentName || 'Minha Barbearia'}
                </Text>
              </View>
            </View>

            {/* Informações Cadastrais */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { fontFamily: fontSemiBold }]}>
                Informações Cadastrais
              </Text>

              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { fontFamily: fontRegular }]}>E-mail</Text>
                  <Text style={[styles.infoValue, { fontFamily: fontSemiBold }]}>
                    {professional?.email || '—'}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { fontFamily: fontRegular }]}>Telefone</Text>
                  <Text style={[styles.infoValue, { fontFamily: fontSemiBold }]}>
                    {professional?.phone || '—'}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { fontFamily: fontRegular }]}>CPF</Text>
                  <Text style={[styles.infoValue, { fontFamily: fontSemiBold }]}>
                    {professional?.cpf || '—'}
                  </Text>
                </View>

                {professional?.commission != null ? (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { fontFamily: fontRegular }]}>Comissão</Text>
                      <Text style={[styles.infoValue, { fontFamily: fontSemiBold, color: Colors.goldDark }]}>
                        {professional.commission}%
                      </Text>
                    </View>
                  </>
                ) : null}
              </View>
            </View>

            {/* Segurança */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { fontFamily: fontSemiBold }]}>
                Segurança
              </Text>

              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.8}
                onPress={() => router.push('/(profissional)/trocar-senha' as any)}>
                <View style={styles.menuLeft}>
                  <Text style={styles.menuIcon}>🔐</Text>
                  <Text style={[styles.menuText, { fontFamily: fontSemiBold }]}>
                    Alterar Minha Senha
                  </Text>
                </View>
                <View style={{ transform: [{ rotate: '180deg' }] }}>
                  <ChevronLeftIcon size={18} color={Colors.grey400} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Sair */}
            <TouchableOpacity
              style={styles.logoutBtn}
              activeOpacity={0.8}
              onPress={handleSignOut}>
              <Text style={[styles.logoutBtnText, { fontFamily: fontSemiBold }]}>
                Sair da Conta
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grey100,
  },
  headerTitle: {
    fontSize: 20,
    color: Colors.dark,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 18,
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.grey100,
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 20,
    color: Colors.white,
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: 17,
    color: Colors.dark,
  },
  profileNickname: {
    fontSize: 13,
    color: Colors.grey500,
  },
  profileEstablishment: {
    fontSize: 13,
    color: Colors.goldDark,
    marginTop: 2,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    color: Colors.grey500,
    letterSpacing: 0.3,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.grey100,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.grey500,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.dark,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.grey100,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.grey100,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIcon: {
    fontSize: 18,
  },
  menuText: {
    fontSize: 15,
    color: Colors.dark,
  },
  logoutBtn: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  logoutBtnText: {
    color: '#DC2626',
    fontSize: 15,
  },
});
