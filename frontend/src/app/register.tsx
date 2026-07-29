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
import { useAuth } from '@/context/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker'
import { RegisterSchema } from '@/schemas/authSchemas';

export default function RegisterScreen() {
  const { fontRegular, fontSemiBold } = useAppFonts();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signUp } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleRegister() {
    setError('');

const result = RegisterSchema.safeParse({
  name,
  email,
  phone:phone.replace(/\D/g, ''),
  password,
  dateOfBirth:dateOfBirth?.toISOString().split('T')[0] ?? ''
})


  if(!result.success){
    const errors: Record<string,string> ={};
    result.error.issues.forEach((issue)=>{
      const field = issue.path[0] as string;
      if (!errors[field]) errors[field] = issue.message;
    })
    setFieldErrors(errors);
    return
  }

    setIsSubmitting(true);
    try {
      await signUp(result.data)
      router.push('/(tabs)/home' as any);
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao criar conta. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        <Image
          source={{ uri: 'https://api.builder.io/api/v1/image/assets/TEMP/b6498689774337ed760cfa4c9fc86c77834936e1?width=300' }}
          style={styles.logo}
          contentFit="contain"
        />

        <View style={styles.header}>
          <Text style={[styles.title, { fontFamily: fontSemiBold }]}>Criar Nova Conta</Text>
          <Text style={[styles.subtitle, { fontFamily: fontRegular }]}>Preencha seus dados para se cadastrar</Text>
        </View>

        <View style={styles.form}>
          <InputField label="Nome completo" value={name} onChangeText={setName} placeholder="Seu nome completo" autoCapitalize="words" />
          {fieldErrors.name && <Text style={styles.fieldError}>{fieldErrors.name}</Text>}

          <InputField label="Email" value={email} onChangeText={setEmail} placeholder="seu@email.com" keyboardType="email-address" />
          {fieldErrors.email && <Text style={styles.fieldError}>{fieldErrors.email}</Text>}

          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
          <InputField
            label="Data de nascimento"
            value={dateOfBirth ? dateOfBirth.toLocaleDateString('pt-BR') : ''}
            placeholder="00/00/0000"
            editable={false}
            pointerEvents="none"
            onChangeText={()=> {}}
          />
        </TouchableOpacity>
        {fieldErrors.dateOfBirth && <Text style={styles.fieldError}>{fieldErrors.dateOfBirth}</Text>}

        {showDatePicker && (
          <DateTimePicker
            value={dateOfBirth ?? new Date(2000, 0, 1)}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={new Date()}
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) setDateOfBirth(selectedDate);
            }}
    />
)}
          <InputField label="Número de telefone" value={phone} onChangeText={setPhone} placeholder="(00) 00000-0000" keyboardType="phone-pad" />
          {fieldErrors.phone && <Text style={styles.fieldError}>{fieldErrors.phone}</Text>}


          <InputField label="Senha" value={password} onChangeText={setPassword} placeholder="••••••••••••" secureTextEntry />
          {fieldErrors.password && <Text style={styles.fieldError}>{fieldErrors.password}</Text>}
        </View>


        <Button label={isSubmitting ? 'Criando conta...' : 'Criar conta'} onPress={handleRegister} disabled={isSubmitting} />

        <View style={styles.loginRow}>
          <Text style={[styles.loginText, { fontFamily: fontRegular }]}>Já tem uma conta? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.loginLink, { fontFamily: fontSemiBold }]}>Entrar</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scroll: { paddingHorizontal: 25, alignItems: 'center', gap: 24 },
  logo: { width: 150, height: 124 },
  header: { alignSelf: 'stretch', gap: 8 },
  title: { color: Colors.dark, fontSize: 24, lineHeight: 36, fontWeight: '600' },
  subtitle: { color: Colors.grey400, fontSize: 14, lineHeight: 21.7, letterSpacing: -0.28 },
  form: { alignSelf: 'stretch', gap: 16 },
  errorText: { color: '#D64545', fontSize: 13, alignSelf: 'stretch', textAlign: 'left' },
  loginRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  loginText: { color: Colors.grey400, fontSize: 14, lineHeight: 21.7, letterSpacing: -0.28 },
  loginLink: { color: Colors.gold, fontSize: 14, lineHeight: 21.7, letterSpacing: -0.28, fontWeight: '600' },
  fieldError: {
  color: '#D64545',
  fontSize: 12,
  marginTop: -8, 
  fontWeight:'bold',
},
});
