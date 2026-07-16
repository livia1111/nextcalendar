import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';

const BUSINESS_TYPES = ['Barbearia', 'Salão de Beleza', 'Estética', 'Nail Designer', 'Outro'];

export default function SetupAccountScreen() {
  const { fontRegular, fontSemiBold } = useAppFonts();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [cnpj, setCnpj] = useState('');

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.topRow}>
          <Image
            source={{ uri: 'https://api.builder.io/api/v1/image/assets/TEMP/04fe62c2fc7f59b9150720c438a64e63eebc1c06?width=200' }}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={[styles.title, { fontFamily: fontSemiBold }]}>Cadastre seu estabelecimento</Text>
          <Text style={[styles.subtitle, { fontFamily: fontRegular }]}>
            Preencha os dados do seu negócio para começar a receber agendamentos
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <InputField label="Nome do estabelecimento" value={businessName} onChangeText={setBusinessName} placeholder="Ex: Barbearia Silva" autoCapitalize="words" />
          <InputField label="Telefone" value={phone} onChangeText={setPhone} placeholder="(00) 00000-0000" keyboardType="phone-pad" />
          <InputField label="CNPJ" value={cnpj} onChangeText={setCnpj} placeholder="00.000.000/0000-00" keyboardType="number-pad" />

          {/* Tipo de negócio */}
          <View style={styles.typeGroup}>
            <Text style={[styles.typeLabel, { fontFamily: fontSemiBold }]}>Tipo de negócio</Text>
            <View style={styles.typeGrid}>
              {BUSINESS_TYPES.map(type => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typePill, selectedType === type && styles.typePillSelected]}
                  onPress={() => setSelectedType(type)}>
                  <Text style={[
                    styles.typePillText,
                    { fontFamily: fontRegular },
                    selectedType === type && styles.typePillTextSelected,
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <Button label="Cadastrar" onPress={() => router.push('/(tabs)/home' as any)} />

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scroll: { paddingHorizontal: 25, gap: 24 },
  topRow: { alignItems: 'center', gap: 12 },
  logo: { width: 100, height: 80 },
  title: { color: Colors.dark, fontSize: 22, fontWeight: '700', textAlign: 'center' },
  subtitle: { color: Colors.grey400, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  form: { gap: 16 },
  typeGroup: { gap: 10 },
  typeLabel: { color: Colors.dark, fontSize: 14, fontWeight: '500' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typePill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.grey100, backgroundColor: Colors.white },
  typePillSelected: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  typePillText: { color: Colors.dark, fontSize: 13 },
  typePillTextSelected: { color: Colors.white, fontWeight: '600' },
});
