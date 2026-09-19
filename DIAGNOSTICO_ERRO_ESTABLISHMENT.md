# Diagnóstico: Erro no ESTABLISHMENT no Frontend

## 1. Descrição do Problema

Ao rodar o frontend da aplicação, é disparado no console o seguinte log de erro:

```text
[ESTABLISHMENT] Erro ao carregar estabelecimento: [AxiosError: Request failed with status code 404]
```
*(ou erro de conexão de rede caso o backend não esteja ativo).*

---

## 2. Origem do Erro no Código

O log é originado no hook [`frontend/src/hooks/useEstablishment.ts`](file:///c:/Users/ResTIC55/next-tic/nextcalendar/frontend/src/hooks/useEstablishment.ts):

```typescript
// frontend/src/hooks/useEstablishment.ts
const loadEstablishment = useCallback(async () => {
  try {
    setLoading(true);
    const establishment = await getCurrentEstablishment(); // <-- Chamada HTTP
    setEstablishmentId(establishment.id);
    setEstablishmentName(establishment.name || 'Minha Barbearia');
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
```

Esse hook chama a função no [`frontend/src/services/establishmentServices.ts`](file:///c:/Users/ResTIC55/next-tic/nextcalendar/frontend/src/services/establishmentServices.ts):

```typescript
export async function getCurrentEstablishment(): Promise<Establishment> {
  const { data } = await api.get<Establishment>('/establishments/current');
  return data;
}
```

O hook `useEstablishment` é utilizado em múltiplos pontos críticos do app:
- `app/(gestor)/homeEmpresa.tsx`
- `app/(gestor)/servicos.tsx`
- `app/(gestor)/equipe.tsx`
- `app/(gestor)/perfil.tsx`
- `app/(tabs)/booking-tab.tsx`
- `app/scheduling/buscar-horario.tsx`

---

## 3. Causa Raiz

1. **Endpoint Inexistente no Backend (HTTP 404):**
   - O frontend dispara uma requisição `GET /api/v1/establishments/current`.
   - No backend ([`EstablishmentController.java`](file:///c:/Users/ResTIC55/next-tic/nextcalendar/backend/src/main/java/com/nextcalendar/controller/EstablishmentController.java)), os únicos endpoints de consulta disponíveis são:
     - `GET /api/v1/establishments/{id}` (busca por ID específico do estabelecimento)
     - `GET /api/v1/establishments/owner/{ownerId}` (busca pelo ID do proprietário logado)
   - Não existe mapeamento `@GetMapping("/establishments/current")` no Spring Boot.

2. **Backend Desligado ou Conexão Recusada (Network Error / ECONNREFUSED):**
   - Caso o serviço do Spring Boot (porta `8080`) não esteja em execução, o Axios não consegue se comunicar com a API e cai no mesmo bloco `catch`.

---

## 4. Soluções Propostas

### Opção 1: Ajustar o Frontend para Usar o Dono Logado (Recomendado se houver autenticação)
Utilizar as informações do usuário autenticado (`useAuth`) para chamar o endpoint existente `getEstablishmentByOwner(user.id)`.

```typescript
import { useAuth } from '@/context/AuthContext';
import { getEstablishmentByOwner } from '@/services/establishmentServices';

export function useEstablishment() {
  const { user } = useAuth();
  // ...
  const loadEstablishment = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await getEstablishmentByOwner(user.id);
      setEstablishmentId(data.id);
      setEstablishmentName(data.name || 'Minha Barbearia');
    } catch (error) {
      // tratamento
    }
  }, [user?.id]);
}
```

---

### Opção 2: Implementar o Endpoint no Backend Spring Boot
Criar o endpoint no `EstablishmentController.java` e no `EstablishmentService.java` para retornar o estabelecimento atual (ex.: o estabelecimento padrão do sistema ou resolvido a partir do token JWT do usuário autenticado):

```java
@GetMapping("/establishments/current")
public EstablishmentResponseDTO getCurrent() {
    return establishmentService.findCurrentEstablishment();
}
```

---

### Opção 3: Fallback Temporário / ID Fixo
Caso a autenticação ainda esteja em desenvolvimento nas telas de teste, utilizar como fallback o ID constante já definido em [`frontend/src/services/api.ts`](file:///c:/Users/ResTIC55/next-tic/nextcalendar/frontend/src/services/api.ts):

```typescript
import { ESTABLISHMENT_ID } from '@/services/api';
```
Definindo `setEstablishmentId(ESTABLISHMENT_ID)` caso a chamada falhe ou definindo-o diretamente para testes.
