import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';

export default function GetStartedScreen() {
  const { fontSemiBold, fontRegular } = useAppFonts();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar style="dark" />

      <View style={styles.inner}>
        <View style={styles.logoSection}>
          <Image
            source={{ uri: 'https://api.builder.io/api/v1/image/assets/TEMP/04fe62c2fc7f59b9150720c438a64e63eebc1c06?width=314' }}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={[styles.title, { fontFamily: fontSemiBold }]}>Entrar como</Text>
        </View>

        <View style={styles.buttons}>
          <Button label="Empresa" onPress={() => router.push('/login')} />
          <Button label="Cliente" onPress={() => router.push('/login')} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 80,
  },
  logoSection: {
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 157,
    height: 124,
  },
  title: {
    color: Colors.dark,
    fontSize: 24,
    lineHeight: 36,
    letterSpacing: -0.48,
  },
  buttons: {
    alignSelf: 'stretch',
    gap: 24,
  },
});
