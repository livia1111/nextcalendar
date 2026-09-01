import api from './api';

// ─── Tipos ────────────────────────────────────────────────────────────────────

/** Status possíveis de um agendamento retornados pelo backend. */
export type AppointmentStatus =
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

/** Shape completo de um agendamento — usado em todas as respostas deste módulo. */
export type Appointment = {
  id: string;
  professionalId: string;
  professionalName: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  clientId: string;
  clientName: string;
  /** ISO 8601 — ex: "2026-09-01T15:50:20.804Z" */
  startDateTime: string;
  /** ISO 8601 — ex: "2026-09-01T16:20:20.804Z" */
  endDateTime: string;
  status: AppointmentStatus;
  isFitIn: boolean;
  notes?: string;
};

/** Body para criação de agendamento. */
export type AppointmentCreateInput = {
  professionalId: string;
  serviceId: string;
  /** UUID do cliente cadastrado. Omitir quando usar os campos fallback. */
  clientId?: string;
  /** Nome avulso do cliente quando não há cadastro. */
  clientNameFallback?: string;
  /** Telefone avulso do cliente quando não há cadastro. */
  clientPhoneFallback?: string;
  /** ISO 8601 — ex: "2026-09-01T15:44:50.658Z" */
  startDateTime: string;
  isFitIn?: boolean;
  notes?: string;
};

/** Body para reagendamento. */
export type AppointmentRescheduleInput = {
  /** ISO 8601 — ex: "2026-09-01T15:50:43.458Z" */
  newStartDateTime: string;
};

/** Resposta de horários disponíveis. */
export type AvailableSlotsResponse = {
  serviceId: string;
  serviceName: string;
  price: number;
  durationMinutes: number;
  /** Formato "YYYY-MM-DD" */
  date: string;
  /** Array de horários disponíveis no formato "HH:mm" ou ISO 8601, conforme o backend. */
  slots: string[];
};

// ─── POST /api/v1/establishments/{establishmentId}/appointments ───────────────

/**
 * Cria um novo agendamento para o estabelecimento.
 * @throws AxiosError — a tela pode inspecionar `error.response.status` para
 *   tratar 400 (conflito de horário) e 404 (entidade não encontrada).
 */
export async function createAppointment(
  establishmentId: string,
  input: AppointmentCreateInput
): Promise<Appointment> {
  const { data } = await api.post<Appointment>(
    `/establishments/${establishmentId}/appointments`,
    input
  );
  return data;
}

// ─── PATCH /api/v1/establishments/{establishmentId}/appointments/{id}/cancel ──

/**
 * Cancela um agendamento existente.
 * @throws AxiosError 400 — agendamento já cancelado ou antecedência mínima não respeitada.
 */
export async function cancelAppointment(
  establishmentId: string,
  id: string
): Promise<Appointment> {
  const { data } = await api.patch<Appointment>(
    `/establishments/${establishmentId}/appointments/${id}/cancel`
  );
  return data;
}

// ─── PUT /api/v1/establishments/{establishmentId}/appointments/{id}/reschedule ─

/**
 * Reagenda um agendamento para um novo horário.
 * @throws AxiosError 400 — agendamento cancelado ou novo horário indisponível.
 */
export async function rescheduleAppointment(
  establishmentId: string,
  id: string,
  input: AppointmentRescheduleInput
): Promise<Appointment> {
  const { data } = await api.put<Appointment>(
    `/establishments/${establishmentId}/appointments/${id}/reschedule`,
    input
  );
  return data;
}

// ─── GET /api/v1/establishments/{establishmentId}/appointments/client/{clientId}

/**
 * Retorna todos os agendamentos de um cliente no estabelecimento.
 */
export async function getClientAppointments(
  establishmentId: string,
  clientId: string
): Promise<Appointment[]> {
  const { data } = await api.get<Appointment[]>(
    `/establishments/${establishmentId}/appointments/client/${clientId}`
  );
  return data;
}

// ─── GET /api/v1/establishments/{establishmentId}/appointments/available-slots ─

/**
 * Consulta os horários disponíveis para um profissional e serviço em uma data.
 *
 * @param date — Formato "YYYY-MM-DD"
 * @throws AxiosError 400 — profissional não atende neste dia da semana.
 * @throws AxiosError 404 — profissional, serviço ou estabelecimento não encontrado.
 */
export async function getAvailableSlots(
  establishmentId: string,
  professionalId: string,
  serviceId: string,
  date: string
): Promise<AvailableSlotsResponse> {
  const { data } = await api.get<AvailableSlotsResponse>(
    `/establishments/${establishmentId}/appointments/available-slots`,
    { params: { professionalId, serviceId, date } }
  );
  return data;
}
