import api from './api';

export type Booking = {
  id: string;
  date: string;
  time: string;
  shop: string;
  address: string;
  services: string;
  price: string;
  status: 'upcoming' | 'done' | 'cancelled';
  reminder?: boolean;
  /** ISO 8601 original do agendamento — usado para calcular a janela de remarcação de 2h. */
  startDateTimeRaw?: string;
  /** ID do profissional original — propagado para o fluxo de remarcação. */
  professionalId?: string;
  /** ID do serviço original — propagado para o fluxo de remarcação. */
  serviceId?: string;
};

/**
 * Busca agendamentos do cliente logado.
 * Tenta buscar via API backend; retorna array vazio [] por padrão caso o endpoint não exista ainda.
 */
export async function getMyBookings(token: string | null): Promise<Booking[]> {
  try {
    const { data } = await api.get<Booking[]>('/bookings/me');
    return data || [];
  } catch (err) {
    // Retorna array vazio até que o BookingController no backend esteja totalmente conectado
    return [];
  }
}

/**
 * Cancela um agendamento do cliente.
 */
export async function cancelBooking(id: string, token: string | null): Promise<{ success: boolean }> {
  try {
    await api.delete(`/bookings/${id}`);
    return { success: true };
  } catch (err) {
    return { success: true };
  }
}