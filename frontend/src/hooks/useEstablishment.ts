import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getEstablishmentByOwner } from '@/services/establishmentServices';

/**
 * Resolve o estabelecimento do gestor logado.
 * Usado por todas as telas da área do gestor (abas) para saber
 * qual establishmentId usar nas chamadas de API.
 */
export function useEstablishment() {
  const { user } = useAuth();

  const [establishmentId, setEstablishmentId] = useState<string>('');
  const [establishmentName, setEstablishmentName] = useState<string>('Minha Barbearia');
  const [loading, setLoading] = useState(true);

  const loadEstablishment = useCallback(async () => {
    if (!user?.id) return;
    try {
      const est = await getEstablishmentByOwner(user.id);
      setEstablishmentId(est.id);
      setEstablishmentName(est.name || 'Minha Barbearia');
    } catch {
      // mantém fallback; telas que dependem de establishmentId simplesmente não farão chamadas
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadEstablishment();
  }, [loadEstablishment]);

  return { establishmentId, establishmentName, loading, reload: loadEstablishment };
}
