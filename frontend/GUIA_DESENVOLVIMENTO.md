# Guia de Desenvolvimento — Next-Calendar

> App de agendamento de barbearia/salão em **React Native com Expo Router**.
> Este guia explica como o projeto está organizado e como criar novas telas e componentes.

---

## 📁 Estrutura do projeto

```
src/
├── app/                        → Cada arquivo = uma tela (roteamento automático)
│   ├── _layout.tsx             → Layout raiz (registra todas as rotas)
│   ├── index.tsx               → Tela "Get Started" (/)
│   ├── login.tsx               → Login (/login)
│   ├── register.tsx            → Cadastro (/register)
│   ├── forgot-password.tsx     → Esqueceu a senha
│   ├── verify-code.tsx         → Verificação OTP
│   ├── new-password.tsx        → Nova senha + modal de sucesso
│   ├── setup-account.tsx       → Cadastro de estabelecimento
│   ├── booking.tsx             → Agendamento (/booking)
│   ├── barber/
│   │   └── [id].tsx            → Detalhes da barbearia (/barber/123)
│   └── (tabs)/
│       ├── _layout.tsx         → Tab navigator com 5 abas
│       ├── home.tsx            → Home principal
│       ├── search.tsx          → Pesquisa
│       ├── booking-tab.tsx     → Botão central QR
│       ├── messages.tsx        → Mensagens
│       └── profile.tsx         → Perfil
│
├── components/
│   ├── icons/
│   │   └── index.tsx           → Todos os ícones SVG do app
│   └── ui/
│       ├── Button.tsx          → Botão primário dourado
│       ├── InputField.tsx      → Campo de formulário com label
│       ├── SocialButton.tsx    → Botão Google/Apple/Phone
│       ├── Divider.tsx         → "Ou continue com"
│       ├── SearchBar.tsx       → Barra de pesquisa
│       ├── BarberCard.tsx      → Card de barbearia
│       └── CategoryPill.tsx    → Pílula de categoria/filtro
│
├── constants/
│   ├── colors.ts               → Paleta de cores do app
│   └── theme.ts                → Spacing, Fonts, Colors (tema geral)
│
└── hooks/
    ├── use-fonts.ts            → Carrega WorkSans (useAppFonts)
    └── use-theme.ts            → Tema claro/escuro
```

---

## 🎨 Como usar as cores

Todas as cores estão em `src/constants/colors.ts`. **Nunca use strings de cor direto no código.**

```tsx
import { Colors } from '@/constants/colors';

// ✅ Correto
<View style={{ backgroundColor: Colors.gold }}>
<Text style={{ color: Colors.dark }}>

// ❌ Errado — dificulta manutenção
<View style={{ backgroundColor: '#D9B76A' }}>
```

### Paleta principal
| Nome | Valor | Uso |
|------|-------|-----|
| `Colors.gold` | `#D9B76A` | Cor primária, botões, destaques |
| `Colors.dark` | `#0D0D12` | Texto principal |
| `Colors.white` | `#FFFFFF` | Fundos |
| `Colors.grey100` | `#DFE1E7` | Bordas, divisores |
| `Colors.grey400` | `#818898` | Texto secundário, placeholders |
| `Colors.surface` | `#F7F8FA` | Fundo de cards e inputs |
| `Colors.success` | `#2DC653` | Status "Aberto", confirmações |

---

## 🔤 Como usar fontes (WorkSans)

Use sempre o hook `useAppFonts()` — ele carrega as fontes e retorna os nomes.

```tsx
import { useAppFonts } from '@/hooks/use-fonts';

export default function MinhaTelaScreen() {
  const { fontRegular, fontSemiBold, fontBold } = useAppFonts();

  return (
    <Text style={{ fontFamily: fontSemiBold }}>Título</Text>
    <Text style={{ fontFamily: fontRegular }}>Descrição</Text>
  );
}
```

### Fontes disponíveis
| Variável | Peso | Uso |
|----------|------|-----|
| `fontRegular` | 400 | Textos corridos, labels |
| `fontMedium` | 500 | Labels de formulário |
| `fontSemiBold` | 600 | Títulos, botões, destaques |
| `fontBold` | 700 | Títulos grandes, nomes |

---

## 🧩 Componentes disponíveis

### `<Button>`
```tsx
import { Button } from '@/components/ui/Button';

<Button label="Entrar" onPress={() => router.push('/home')} />
<Button label="Carregando..." loading />
<Button label="Cancelar" variant="outline" onPress={() => {}} />
<Button label="Bloqueado" disabled />
```

### `<InputField>`
```tsx
import { InputField } from '@/components/ui/InputField';

<InputField
  label="Email"
  value={email}
  onChangeText={setEmail}
  placeholder="seu@email.com"
  keyboardType="email-address"
/>
<InputField
  label="Senha"
  value={password}
  onChangeText={setPassword}
  secureTextEntry     // ← mostra botão de olho automaticamente
/>
```

### `<SearchBar>`
```tsx
import { SearchBar } from '@/components/ui/SearchBar';

<SearchBar
  value={query}
  onChangeText={setQuery}
  onClear={() => setQuery('')}
/>
```

### `<BarberCard>`
```tsx
import { BarberCard } from '@/components/ui/BarberCard';

<BarberCard barber={{
  id: '1',
  name: 'Studio Vision',
  address: 'Av. Imperatriz Leopoldina, 22ª',
  distance: '1.2 km',
  rating: 4.8,
  imageUri: 'https://...',
}} />
```

### `<CategoryPill>`
```tsx
import { CategoryPill } from '@/components/ui/CategoryPill';

<CategoryPill label="Corte" selected={selectedCat === 'Corte'} onPress={() => setSelectedCat('Corte')} />
```

### Ícones
```tsx
import { SearchIcon, BellIcon, StarIcon, LocationPinIcon } from '@/components/icons';

<SearchIcon color={Colors.grey400} size={20} />
<StarIcon color={Colors.gold} size={14} />
```

---

## 📱 Como criar uma nova tela

### 1. Crie o arquivo na pasta `src/app/`
O nome do arquivo vira a rota automaticamente:
- `src/app/profile.tsx` → `/profile`
- `src/app/barber/[id].tsx` → `/barber/123`

### 2. Use o template padrão
```tsx
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { useAppFonts } from '@/hooks/use-fonts';

export default function MinhaTela() {
  const { fontRegular, fontSemiBold } = useAppFonts();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      {/* seu conteúdo aqui */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
});
```

### 3. Registre no `_layout.tsx`
```tsx
// src/app/_layout.tsx
<Stack.Screen name="minha-tela" />
```

### 4. Navegue para ela
```tsx
router.push('/minha-tela');
router.push('/barber/42');   // rota dinâmica
router.replace('/login');    // sem volta
router.back();               // voltar
```

---

## 🗺️ Fluxo de navegação

```
index (Get Started)
  ├── login
  │   ├── forgot-password → verify-code → new-password
  │   └── register → setup-account (empresas)
  └── (tabs) — tela principal
      ├── home → barber/[id] → booking
      ├── search → barber/[id]
      ├── booking-tab (QR central)
      ├── messages
      └── profile
```

---

## 💡 Dicas React Native vs React Web

| Conceito | React Web | React Native |
|----------|-----------|--------------|
| `<div>` | `<div>` | `<View>` |
| `<p>`, `<span>`, `<h1>` | qualquer | `<Text>` (obrigatório) |
| `<img>` | `<img>` | `<Image>` (expo-image) |
| `<button>` | `<button>` | `<TouchableOpacity>` |
| `<a>` | `<a>` | `<TouchableOpacity onPress={router.push}>` |
| CSS classes | `.css` | `StyleSheet.create({})` |
| `display: flex` | padrão | **padrão no RN** |
| `overflow: scroll` | automático | `<ScrollView>` |
| `position: fixed` | CSS | `position: 'absolute'` |
| Media query | `@media` | `useWindowDimensions()` |
| Click | `onClick` | `onPress` |

---

## 🚀 Rodando o app

```bash
# Instalar dependências (só na primeira vez)
npm install

# Iniciar o servidor de desenvolvimento
npm start

# Abrir no dispositivo Android
npm run android

# Abrir no simulador iOS
npm run ios
```

Escaneie o QR code com o app **Expo Go** no celular para ver o app em tempo real.
