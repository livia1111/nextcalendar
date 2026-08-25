import { API_BASE_URL } from './api';

// ─── Tipos ─────────────────────────────────────────────────────────────────────

export interface ServiceCreatePayload {
  name: string;
  price: number;
  duration: number;
  category: string;
}

export interface ServiceResponse {
  id: string;
  name: string;
  price: number;
  duration: number;
  category: string;
}

// ─── Listar serviços ───────────────────────────────────────────────────────────

export async function listarServicos(
  establishmentId: string,
): Promise<ServiceResponse[]> {
  const url = `${API_BASE_URL}/api/v1/establishments/${establishmentId}/services?size=100`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    const erro = await response.text();
    throw new Error(`Erro ao listar serviços [${response.status}]: ${erro}`);
  }

  const data = await response.json();
  // O backend retorna Page<ServiceMinResponseDTO> — extraímos o array content
  return data.content ?? data;
}

// ─── Criar serviço ─────────────────────────────────────────────────────────────

export async function criarServico(
  establishmentId: string,
  payload: ServiceCreatePayload,
): Promise<ServiceResponse> {
  const url = `${API_BASE_URL}/api/v1/establishments/${establishmentId}/services`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const erro = await response.text();
    throw new Error(`Erro ao criar serviço [${response.status}]: ${erro}`);
  }

  return response.json();
}
