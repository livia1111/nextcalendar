import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getProfessionalMe, type ProfessionalMe } from '@/services/professionalServices';

export function useMyProfessionalProfile() {
  const { user } = useAuth();
  const [professional, setProfessional] = useState<ProfessionalMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user || user.role !== 'PROFESSIONAL') {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getProfessionalMe();
      setProfessional(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Erro ao carregar dados do profissional.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    professional,
    professionalId: professional?.id || null,
    establishmentId: professional?.establishmentId || null,
    loading,
    error,
    reload: load,
  };
}
