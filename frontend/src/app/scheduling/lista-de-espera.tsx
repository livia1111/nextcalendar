import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';

export default function ListaDeEsperaScreen() {
  const router = useRouter();
  const { fontRegular, fontSemiBold } = useAppFonts();

  // TODO: buscar clientes na lista de espera (nome, celular, serviço)
  const waitlist: any[] = [];

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { fontFamily: fontSemiBold }]}>
        Lista de Espera
      </Text>
      <FlatList
        data={waitlist}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <View>
              <Text style={{ fontFamily: fontSemiBold }}>{item.nome}</Text>
              <Text style={{ fontFamily: fontRegular, color: Colors.grey500 }}>
                {item.celular} · {item.servico}
              </Text>
            </View>
            
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface, padding: 16 },
  title: { fontSize: 18, marginBottom: 16, color: Colors.gold },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
});