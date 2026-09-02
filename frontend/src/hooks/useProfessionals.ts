import { useState, useEffect, useCallback } from 'react'
import { getActiveProfessionals, getProfessionals, ProfessionalMin } from '../services/professionalServices'

export function useProfessional(establishmentId: string) {

    const [professionals, setProfessionals] = useState<ProfessionalMin[]>([])
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [mode, setMode] = useState<'active' | 'all'>('active')

    const fetchProfessionals = useCallback(async () => {
        if (!establishmentId) return

        setLoading(true)
        try {
            const response = mode === 'active'
                ? await getActiveProfessionals(establishmentId)
                : await getProfessionals(establishmentId)
            setProfessionals(response.content)
            setError(null)
        } catch (e) {
            setError('Erro ao carregar profissional')
        } finally {
            setLoading(false)
        }
    }, [establishmentId, mode])

    useEffect(() => {
        fetchProfessionals()
    }, [fetchProfessionals])

    return {
        professionals, loading, error, mode, setMode, refetch: fetchProfessionals
    }
}