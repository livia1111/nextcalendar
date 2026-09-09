import api from './api';

// ─── Tipos ────────────────────────────────────────────────────────────────────

/** Dias da semana aceitos pelo backend (enum em maiúsculo). */
export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

/** Shape completo de uma jornada de trabalho — retornado pelo backend. */
export type WorkingHours = {
  id: string;
  professionalId: string;
  dayOfWeek: DayOfWeek;
  /** Formato HH:mm:ss — ex: "09:00:00" */
  startTime: string;
  /** Formato HH:mm:ss — ex: "18:00:00" */
  endTime: string;
  /** Formato HH:mm:ss — ex: "12:00:00". Null quando não há pausa. */
  breakStart: string | null;
  /** Formato HH:mm:ss — ex: "13:00:00". Null quando não há pausa. */
  breakEnd: string | null;
  active: boolean;
};

/**
 * Body usado tanto no POST (criar) quanto no PUT (atualizar).
 * `active` é aceito opcionalmente; omita na criação se o backend não exigir.
 */
export type WorkingHoursInput = {
  dayOfWeek: DayOfWeek;
  /** Formato HH:mm:ss ou HH:mm */
  startTime: string;
  /** Formato HH:mm:ss ou HH:mm */
  endTime: string;
  /** Formato HH:mm:ss ou HH:mm. Omita ou passe null quando não houver pausa. */
  breakStart?: string | null;
  /** Formato HH:mm:ss ou HH:mm. Omita ou passe null quando não houver pausa. */
  breakEnd?: string | null;
  /** Aceito no PUT; tratado como opcional no POST. */
  active?: boolean;
};

// ─── GET /api/v1/establishments/{establishmentId}/professionals/{professionalId}/working-hours ──

/**
 * Retorna todas as jornadas de trabalho de um profissional.
 */
export async function listWorkingHours(
  establishmentId: string,
  professionalId: string
): Promise<WorkingHours[]> {
  const { data } = await api.get<WorkingHours[]>(
    `/establishments/${establishmentId}/professionals/${professionalId}/working-hours`
  );
  return data;
}

// ─── POST /api/v1/establishments/{establishmentId}/professionals/{professionalId}/working-hours ─

/**
 * Cria uma nova jornada de trabalho para o profissional.
 *
 * @throws AxiosError 400 — "Já existe jornada cadastrada para este dia,
 *   ou horário de início posterior ao término".
 * @throws AxiosError 404 — Profissional ou estabelecimento não encontrado.
 */
export async function createWorkingHours(
  establishmentId: string,
  professionalId: string,
  input: WorkingHoursInput
): Promise<WorkingHours> {
  const { data } = await api.post<WorkingHours>(
    `/establishments/${establishmentId}/professionals/${professionalId}/working-hours`,
    input
  );
  return data;
}

// ─── PUT /api/v1/establishments/{establishmentId}/professionals/{professionalId}/working-hours/{id}

/**
 * Atualiza uma jornada de trabalho existente.
 *
 * @throws AxiosError 400 — Conflito de jornada para o dia, ou horário inválido.
 * @throws AxiosError 404 — Jornada, profissional ou estabelecimento não encontrado.
 */
export async function updateWorkingHours(
  establishmentId: string,
  professionalId: string,
  id: string,
  input: WorkingHoursInput
): Promise<WorkingHours> {
  const { data } = await api.put<WorkingHours>(
    `/establishments/${establishmentId}/professionals/${professionalId}/working-hours/${id}`,
    input
  );
  return data;
}

// ─── DELETE /api/v1/establishments/{establishmentId}/professionals/{professionalId}/working-hours/{id}

/**
 * Remove uma jornada de trabalho pelo id.
 *
 * @throws AxiosError 404 — Jornada, profissional ou estabelecimento não encontrado.
 */
export async function deleteWorkingHours(
  establishmentId: string,
  professionalId: string,
  id: string
): Promise<void> {
  await api.delete(
    `/establishments/${establishmentId}/professionals/${professionalId}/working-hours/${id}`
  );
}
