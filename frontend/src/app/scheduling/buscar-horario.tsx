import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';
import { Button } from '@/components/ui/Button';

export default function BuscarHorarioScreen() {
  const router = useRouter();
  const { fontRegular, fontSemiBold } = useAppFonts();

  // TODO: dropdowns — Serviço, Profissional, Data, Período do Dia
  // TODO: botão "Buscar" -> chamar API e navegar/exibir resultados

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { fontFamily: fontSemiBold }]}>
        Pesquisa Avançada de Horário
      </Text>
      <Button label="Buscar" onPress={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface, padding: 16 },
  title: { fontSize: 18, marginBottom: 16, color: Colors.gold },
});