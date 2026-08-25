import { size } from 'zod';
import api from './api';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type ProfessionalMin = {
  id: string;
  name: string;
  nickname?: string;
  phone?: string;
  email?: string;
  photoUrl?: string | null;
  specialty?: string;
  active?: boolean;
  commission?: number;
};

export type ProfessionalCreateInput = {
  name: string;
  nickname?: string;
  cpf: string;
  email: string;
  password?: string;
  phone: string;
  gender?: string;
  photoUrl?: string;
  specialty?: string;
  commission?: number;
};

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

// ─── GET /api/v1/establishments/{establishmentId}/professionals/active ────────

export async function getActiveProfessionals(
  establishmentId: string,
  page = 0,
  size = 20
): Promise<PageResponse<ProfessionalMin>> {
  const { data } = await api.get<PageResponse<ProfessionalMin>>(
    `/establishments/${establishmentId}/professionals/active`,
    { params: { page, size } }
  );
  return data;
}


// ─── POST /api/v1/establishments/{establishmentId}/professionals ───────────────

export async function createProfessional(
  establishmentId: string,
  input: ProfessionalCreateInput
): Promise<ProfessionalMin> {
  const { data } = await api.post<ProfessionalMin>(
    `/establishments/${establishmentId}/professionals`,
    input
  );
  return data;
}

// ─── GET /api/v1/establishments/{establishmentId}/professionals ────────────────

export async function getProfessionals(
  establishmentId: string,
  page = 0,
  size = 50
): Promise<PageResponse<ProfessionalMin>> {
  const { data } = await api.get<PageResponse<ProfessionalMin>>(
    `/establishments/${establishmentId}/professionals`,
    { params: { page, size } }
  );
  return data;
}

// ─── GET /api/v1/establishments/{establishmentId}/professionals/{id} ──────────

export async function getProfessionalById(
  establishmentId: string,
  id: string
): Promise<ProfessionalMin> {
  const { data } = await api.get<ProfessionalMin>(
    `/establishments/${establishmentId}/professionals/${id}`
  );
  return data;
}

// ─── GET /api/v1/establishments/{establishmentId}/professionals/search ────────

export async function searchProfessionals(
  establishmentId: string,
  name: string,
  page = 0,
  size = 20
): Promise<PageResponse<ProfessionalMin>> {
  const { data } = await api.get<PageResponse<ProfessionalMin>>(
    `/establishments/${establishmentId}/professionals/search`,
    { params: { name, page, size } }
  );
  return data;
}

// ─── PUT /api/v1/establishments/{establishmentId}/professionals/{id} ──────────
// Atualizar próprio perfil

export type ProfessionalUpdateInput = Partial<
  Omit<ProfessionalCreateInput, 'cpf' | 'password'>
>;

export async function updateProfessional(
  establishmentId: string,
  id: string,
  input: ProfessionalUpdateInput
): Promise<ProfessionalMin> {
  const { data } = await api.put<ProfessionalMin>(
    `/establishments/${establishmentId}/professionals/${id}`,
    input
  );
  return data;
}

// ─── PUT /api/v1/establishments/{establishmentId}/professionals/{id}/admin ────

export type ProfessionalAdminUpdateInput = ProfessionalUpdateInput & {
  active?: boolean;
  commission?: number;
};

export async function updateProfessionalAsAdmin(
  establishmentId: string,
  id: string,
  input: ProfessionalAdminUpdateInput
): Promise<ProfessionalMin> {
  const { data } = await api.put<ProfessionalMin>(
    `/establishments/${establishmentId}/professionals/${id}/admin`,
    input
  );
  return data;
}

// ─── DELETE /api/v1/establishments/{establishmentId}/professionals/{id} ───────

export async function deactivateProfessional(
  establishmentId: string,
  id: string
): Promise<void> {
  await api.delete(`/establishments/${establishmentId}/professionals/${id}`);
}