import api from './api';

// ─── Tipos ────────────────────────────────────────────────────────────────────

// Resposta resumida — usada na listagem/busca (ClientMinResponseDTO)
export type ClientMin = {
  id: string;
  name: string;
  phone: string;
  email: string;
};

// Resposta completa — usada ao abrir o perfil do cliente (ClientDetailsResponseDTO)
export type ClientDetails = {
  id: string;
  name: string;
  phone: string;
  email: string;
  dateOfBirth: string | null;  // ISO date: "YYYY-MM-DD"
  photoUrl: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

// Payload de criação (ClientCreateDTO)
export type ClientCreatePayload = {
  name: string;
  phone: string;
  email: string;
  password: string;
  dateOfBirth?: string | null;  // "YYYY-MM-DD"
  photoUrl?: string | null;
  notes?: string | null;
};

// Payload de atualização (ClientUpdateDTO)
export type ClientUpdatePayload = {
  name?: string;
  phone?: string;
  email?: string;
  photoUrl?: string | null;
  notes?: string | null;
};

// Resposta de criação/atualização (ClientProfileResponseDTO)
export type ClientProfile = {
  id: string;
  name: string;
  phone: string;
  email: string;
  photoUrl: string | null;
  notes: string | null;
};

// Resposta paginada do Spring (Page<ClientMinResponseDTO>)
export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // página atual (0-indexed)
  size: number;
};

// ─── GET /api/v1/clients/search?name={name} ───────────────────────────────────
// Busca clientes por nome (deixar name="" para listar todos)

export async function searchClients(
  name = '',
  page = 0,
  size = 20
): Promise<PageResponse<ClientMin>> {
  const { data } = await api.get<PageResponse<ClientMin>>('/clients/search', {
    params: { name, page, size },
  });
  return data;
}

// ─── GET /api/v1/clients/{id} ─────────────────────────────────────────────────
// Busca os detalhes completos de um cliente

export async function getClientById(id: string): Promise<ClientDetails> {
  const { data } = await api.get<ClientDetails>(`/clients/${id}`);
  return data;
}

// ─── POST /api/v1/clients ─────────────────────────────────────────────────────
// Cria um novo cliente

export async function createClient(
  payload: ClientCreatePayload
): Promise<ClientProfile> {
  const { data } = await api.post<ClientProfile>('/clients', payload);
  return data;
}

// ─── PUT /api/v1/clients/{id} ─────────────────────────────────────────────────
// Atualiza dados de um cliente

export async function updateClient(
  id: string,
  payload: ClientUpdatePayload
): Promise<ClientProfile> {
  const { data } = await api.put<ClientProfile>(`/clients/${id}`, payload);
  return data;
}

// ─── DELETE /api/v1/clients/{id} ──────────────────────────────────────────────
// Remove (soft delete) um cliente

export async function deleteClient(id: string): Promise<void> {
  await api.delete(`/clients/${id}`);
}
// ─── GET /api/v1/clients/by-user/{userId} ─────────────────────────────────────
// Busca o cliente vinculado a um usuário autenticado (User -> Client)

export async function getClientByUserId(userId: string): Promise<ClientDetails> {
  const { data } = await api.get<ClientDetails>(`/clients/by-user/${userId}`);
  return data;
}