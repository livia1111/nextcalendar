import { useRouter } from 'expo-router';
import { ClienteHistoricoFlow } from '@/components/profissional/ClienteHistoricoFlow';

export default function GestorClientesScreen() {
  const router = useRouter();
  return <ClienteHistoricoFlow onBack={() => router.back()} />;
}
