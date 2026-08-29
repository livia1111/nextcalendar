import { API_BASE_URL } from './api';

// ─── Tipos ─────────────────────────────────────────────────────────────────────

export interface ProfessionalCreatePayload {
  name: string;
  nickname?: string;
  cpf: string;
  email: string;
  password: string;
  phone: string;
  gender?: string;
  photoUrl?: string;
  commission?: number;
}

export interface ProfessionalAdminUpdatePayload {
  name?: string;
  nickname?: string;
  cpf?: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  commission?: number;
  active?: boolean;
}

export interface ProfessionalMin {
  id: string;
  name: string;
  phone: string;
  photoUrl: string | null;
  commission: number | null;
}

export interface ProfessionalDetails extends ProfessionalMin {
  nickname: string | null;
  cpf: string;
  email: string;
  gender: string | null;
  active: boolean;
}

// ─── Listar profissionais ────────────────────────────────────────────────────

export async function listarProfissionais(establishmentId: string): Promise<ProfessionalMin[]> {
  const url = `${API_BASE_URL}/api/v1/establishments/${establishmentId}/professionals?size=100`;

  const response = await fetch(url, { headers: { Accept: 'application/json' } });

  if (!response.ok) {
    const erro = await response.text();
    throw new Error(`Erro ao listar profissionais [${response.status}]: ${erro}`);
  }

  const data = await response.json();
  return data.content ?? data;
}

// ─── Buscar 1 profissional (detalhes, para abrir a edição) ─────────────────────

export async function buscarProfissional(
  establishmentId: string,
  id: string,
): Promise<ProfessionalDetails> {
  const url = `${API_BASE_URL}/api/v1/establishments/${establishmentId}/professionals/${id}`;

  const response = await fetch(url, { headers: { Accept: 'application/json' } });

  if (!response.ok) {
    const erro = await response.text();
    throw new Error(`Erro ao buscar profissional [${response.status}]: ${erro}`);
  }

  return response.json();
}

// ─── Criar profissional ─────────────────────────────────────────────────────────

export async function criarProfissional(
  establishmentId: string,
  payload: ProfessionalCreatePayload,
): Promise<ProfessionalDetails> {
  const url = `${API_BASE_URL}/api/v1/establishments/${establishmentId}/professionals`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const erro = await response.text();
    throw new Error(`Erro ao criar profissional [${response.status}]: ${erro}`);
  }

  return response.json();
}

// ─── Atualizar profissional (via admin) ────────────────────────────────────────

export async function atualizarProfissional(
  establishmentId: string,
  id: string,
  payload: ProfessionalAdminUpdatePayload,
): Promise<ProfessionalDetails> {
  const url = `${API_BASE_URL}/api/v1/establishments/${establishmentId}/professionals/${id}/admin`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const erro = await response.text();
    throw new Error(`Erro ao atualizar profissional [${response.status}]: ${erro}`);
  }

  return response.json();
}

// ─── Excluir profissional ───────────────────────────────────────────────────────

export async function excluirProfissional(establishmentId: string, id: string): Promise<void> {
  const url = `${API_BASE_URL}/api/v1/establishments/${establishmentId}/professionals/${id}`;

  const response = await fetch(url, { method: 'DELETE', headers: { Accept: 'application/json' } });

  if (!response.ok && response.status !== 204) {
    const erro = await response.text();
    throw new Error(`Erro ao excluir profissional [${response.status}]: ${erro}`);
  }
}
