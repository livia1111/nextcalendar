import { Redirect } from 'expo-router';

/**
 * Rota antiga — mantida apenas como redirecionamento de segurança.
 * A área do gestor agora vive em app/(gestor)/ com barra de abas
 * (Agenda, Serviços, Equipe, Perfil).
 */
export default function EmpresaHomeRedirect() {
  return <Redirect href={'/(gestor)/agenda' as any} />;
}

