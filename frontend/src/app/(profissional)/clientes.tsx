import { useRouter } from 'expo-router';
import { ClienteHistoricoFlow } from '@/components/profissional/ClienteHistoricoFlow';

export default function ProfissionalClientesScreen() {
  const router = useRouter();
  return <ClienteHistoricoFlow onBack={() => router.back()} />;
}
