import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppleIcon, GoogleIcon, PhoneIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { InputField } from '@/components/ui/InputField';
import { SocialButton } from '@/components/ui/SocialButton';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';
import { LoginSchema }  from '@/schemas/authSchemas';
import { useAuth } from '@/context/AuthContext';



export default function LoginScreen() {
  const { fontRegular, fontSemiBold } = useAppFonts();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn  } = useAuth();


  async function handleLogin(){
  const result = LoginSchema.safeParse({email,password})

  if(!result.success){
    const firstError = result.error.issues[0].message
    setError(firstError)
    return
  }

  setError('')
  setIsSubmitting(true)

  try{
    await signIn(result.data.email,result.data.password);
    router.push('/(tabs)/home' as any);
  } catch(err:any){
    setError(err.message ?? 'Não foi possivel entrar. Tente novamente')
  }finally{
    setIsSubmitting(false)
  }
}


  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { fontFamily: fontSemiBold }]}>Bem-vindo de volta! 👋</Text>
          <Text style={[styles.subtitle, { fontFamily: fontRegular }]}>
            Conecte-se aos serviços que você precisa com facilidade
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <InputField label="Email" value={email} onChangeText={setEmail} placeholder="Digite seu E-mail" keyboardType="email-address" />
          <InputField label="Senha" value={password} onChangeText={setPassword} placeholder="Digite sua senha" secureTextEntry />

          <TouchableOpacity style={styles.forgotRow} activeOpacity={0.7} onPress={() => router.push('/forgot-password' as any)}>
            <Text style={[styles.forgotText, { fontFamily: fontSemiBold }]}>Esqueceu a senha?</Text>
          </TouchableOpacity>
        </View>

        <Button label={isSubmitting ? 'Entrando...' : 'Entrar'} onPress={handleLogin} disabled={isSubmitting}/>
        {error ? <Text style={styles.errorText}></Text>:null}

        <Divider />

        {/* Social */}
        <View style={styles.socials}>
          <SocialButton icon={<GoogleIcon />} label="Entrar com Google" />
          <SocialButton icon={<AppleIcon />} label="Entrar com Apple" />
          <SocialButton icon={<PhoneIcon />} label="Entrar com Telefone" />
        </View>

        {/* Register link */}
        <View style={styles.registerRow}>
          <Text style={[styles.registerText, { fontFamily: fontRegular }]}>Não tem uma conta? </Text>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={[styles.registerLink, { fontFamily: fontSemiBold }]}>Cadastre-se</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scroll: { paddingHorizontal: 25, gap: 24 },
  header: { gap: 8 },
  title: { color: Colors.dark, fontSize: 24, lineHeight: 36, fontWeight: '600' },
  subtitle: { color: Colors.grey400, fontSize: 14, lineHeight: 21.7, letterSpacing: -0.28 },
  form: { gap: 16 },
  forgotRow: { alignSelf: 'flex-end' },
  forgotText: { color: Colors.gold, fontSize: 14, lineHeight: 21.7, letterSpacing: -0.28, fontWeight: '600' },
  socials: { gap: 12 },
  registerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  registerText: { color: Colors.grey400, fontSize: 14, lineHeight: 21.7, letterSpacing: -0.28 },
  registerLink: { color: Colors.gold, fontSize: 14, lineHeight: 21.7, letterSpacing: -0.28, fontWeight: '600' },
  errorText: { color: '#E53935', fontSize: 13, letterSpacing: -0.28 },
});
