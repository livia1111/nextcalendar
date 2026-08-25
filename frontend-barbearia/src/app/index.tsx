import { Redirect } from 'expo-router';

export default function Index() {
  // Redireciona para a tela de usuários por padrão
  return <Redirect href="/usuarios" />;
}
