import { useCallback, useEffect, useState } from 'react';
import { getCurrentEstablishment } from '@/services/establishmentServices';

/**
 * Resolve o estabelecimento atual do sistema.
 *
 * O projeto agora trabalha com apenas um estabelecimento,
 * portanto o ID não depende do usuário logado.
 *
 * O backend é responsável por retornar o estabelecimento ativo.
 *
 * Usado pelas telas que precisam saber qual establishmentId
 * utilizar nas chamadas de API.
 */
export function useEstablishment() {
  const [establishmentId, setEstablishmentId] = useState<string>('');
  const [establishmentName, setEstablishmentName] =
    useState<string>('Minha Barbearia');
  const [loading, setLoading] = useState(true);

  const loadEstablishment = useCallback(async () => {
    try {
      setLoading(true);

      const establishment = await getCurrentEstablishment();

      setEstablishmentId(establishment.id);
      setEstablishmentName(
        establishment.name || 'Minha Barbearia'
      );
    } catch (error) {
      console.error(
        '[ESTABLISHMENT] Erro ao carregar estabelecimento:',
        error
      );

      setEstablishmentId('');
      setEstablishmentName('Minha Barbearia');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEstablishment();
  }, [loadEstablishment]);

  return {
    establishmentId,
    establishmentName,
    loading,
    reload: loadEstablishment,
  };
}