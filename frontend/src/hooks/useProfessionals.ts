import { useState, useEffect} from 'react'
import {getActiveProfessionals, getProfessionals, ProfessionalMin } from '../services/professionalServices'

export function useProfessional(establishmentId:string){

    const [ professionals, setProfessionals]  = useState<ProfessionalMin[]>([])
    const [error,setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [mode, setMode] = useState<'active' |'all'>('active')

    useEffect(()=>{
        async function getData(){
           setLoading(true)
            if (mode==='active') {
                try{
                        const response  =  await getActiveProfessionals(establishmentId)
                        setProfessionals(response.content)
                        setError(null)

                    }catch(e){
                        setError('Erro ao carregar profissional');
                    }finally{
                        setLoading(false);
                    }
            } else{
                try{
                    const response = await getProfessionals(establishmentId)
                    setProfessionals(response.content)
                    setError(null)
                }catch(e){
                    setError('Erro ao carregar profissional')
                }finally{
                    setLoading(false)
                }
            }
        }
        if (establishmentId) {
            getData()
        }
    },[establishmentId,mode])

    return{
            professionals,loading,error,mode,setMode
        }

}