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

// ─── Listar serviços (formato paginado) ────────────────────────────────────────
// Usado por telas que esperam a página inteira (ex: home.tsx, empresa-home.tsx)

export interface ServicePage {
  content: ServiceResponse[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
}

export async function getServices(establishmentId: string): Promise<ServicePage> {
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
  // Garante o formato paginado mesmo se a API responder um array puro
  return Array.isArray(data) ? { content: data } : data;
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

// ─── Alias em inglês (usado por home.tsx / empresa-home.tsx) ───────────────────
export const createService = criarServico;

export interface ServiceUpdatePayload {
  name: string;
  price: number;
  duration: number;
  category: string;
}

export async function atualizarServico(
  establishmentId: string,
  serviceId: string,
  payload: ServiceUpdatePayload,
): Promise<ServiceResponse> {
  const url = `${API_BASE_URL}/api/v1/establishments/${establishmentId}/services/${serviceId}`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const erro = await response.text();
    throw new Error(`Erro ao atualizar serviço [${response.status}]: ${erro}`);
  }

  return response.json();
}

// ─── Excluir serviço ────────────────────────────────────────────────────────────

export async function excluirServico(
  establishmentId: string,
  serviceId: string,
): Promise<void> {
  const url = `${API_BASE_URL}/api/v1/establishments/${establishmentId}/services/${serviceId}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok && response.status !== 204) {
    const erro = await response.text();
    throw new Error(`Erro ao excluir serviço [${response.status}]: ${erro}`);
  }
}

// ─── Aliases em inglês (usados pelos modais Add/Edit ServiceModal) ─────────────
export const updateService = atualizarServico;
export const deleteService = excluirServico;