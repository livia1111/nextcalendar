import api from './api';

// ─── Tipos ────────────────────────────────────────────────────────────────────

/** Payload para criação de um bloqueio de horário. */
export type BlockedTimeCreateInput = {
  /** ISO 8601 — ex: "2026-10-01T09:00:00" */
  startDateTime: string;
  /** ISO 8601 — ex: "2026-10-01T11:00:00" */
  endDateTime: string;
  /** Motivo do bloqueio (opcional). */
  reason?: string;
};

/** Bloqueio de horário retornado pelo backend. */
export type BlockedTime = {
  id: string;
  professionalId: string;
  /** ISO 8601 */
  startDateTime: string;
  /** ISO 8601 */
  endDateTime: string;
  reason?: string | null;
};

// ─── Base URL helper ──────────────────────────────────────────────────────────

function base(establishmentId: string, professionalId: string) {
  return `/establishments/${establishmentId}/professionals/${professionalId}/blocked-times`;
}

// ─── GET /…/blocked-times ────────────────────────────────────────────────────

/**
 * Lista todos os bloqueios de horário do profissional em ordem cronológica.
 * @throws AxiosError 404 — profissional ou estabelecimento não encontrado.
 */
export async function listBlockedTimes(
  establishmentId: string,
  professionalId: string
): Promise<BlockedTime[]> {
  const { data } = await api.get<BlockedTime[]>(base(establishmentId, professionalId));
  return data;
}

// ─── POST /…/blocked-times ───────────────────────────────────────────────────

/**
 * Cria um novo bloqueio de horário para o profissional.
 * @throws AxiosError 400 — conflito com agendamento existente, sobreposição com
 *   outro bloqueio, ou horário de início posterior ao término.
 * @throws AxiosError 404 — profissional ou estabelecimento não encontrado.
 * @throws AxiosError 422 — dados inválidos (startDateTime ou endDateTime ausentes).
 */
export async function createBlockedTime(
  establishmentId: string,
  professionalId: string,
  input: BlockedTimeCreateInput
): Promise<BlockedTime> {
  const { data } = await api.post<BlockedTime>(base(establishmentId, professionalId), input);
  return data;
}

// ─── DELETE /…/blocked-times/{id} ────────────────────────────────────────────

/**
 * Remove um bloqueio de horário pelo seu ID.
 * @throws AxiosError 404 — bloqueio não encontrado.
 */
export async function deleteBlockedTime(
  establishmentId: string,
  professionalId: string,
  blockedTimeId: string
): Promise<void> {
  await api.delete(`${base(establishmentId, professionalId)}/${blockedTimeId}`);
}
