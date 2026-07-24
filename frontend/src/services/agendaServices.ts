export type SlotStatus = 'confirmed' | 'encaixe' | 'blocked' | 'free';

export type AgendaSlot = {
  id: string;
  time: string; // "09:00"
  status: SlotStatus;
  clientName?: string;
  service?: string;
};

// 🔧 MOCK TEMPORÁRIO — trocar pela chamada real quando o back estiver pronto
export async function getAgendaByDate(date: string, token: string | null): Promise<AgendaSlot[]> {
  await new Promise((resolve) => setTimeout(resolve, 600));

  const hours = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00',
  ];

  const filled: Record<string, Partial<AgendaSlot>> = {
    '09:00': { status: 'confirmed', clientName: 'João Silva', service: 'Corte + Barba' },
    '09:30': { status: 'confirmed', clientName: 'João Silva', service: 'Corte + Barba' },
    '10:30': { status: 'encaixe', clientName: 'Marcos Lima', service: 'Barba' },
    '14:00': { status: 'blocked' },
    '16:00': { status: 'confirmed', clientName: 'Rafael Souza', service: 'Corte' },
  };

  return hours.map((time) => ({
    id: `${date}-${time}`,
    time,
    status: (filled[time]?.status as SlotStatus) ?? 'free',
    clientName: filled[time]?.clientName,
    service: filled[time]?.service,
  }));
}

// 🔧 MOCK TEMPORÁRIO
export async function blockSlot(slotId: string, token: string | null) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { success: true };
}

// 🔧 MOCK TEMPORÁRIO
export async function cancelAppointment(slotId: string, token: string | null) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { success: true };
}

// 🔧 MOCK TEMPORÁRIO
export async function createAppointment(
  data: { slotId: string; clientName: string; service: string; isEncaixe: boolean },
  token: string | null
) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { success: true };
}