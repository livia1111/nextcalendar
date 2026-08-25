export type SlotStatus = 'confirmed' | 'encaixe' | 'blocked' | 'free';

export type AgendaSlot = {
  id: string;
  time: string; // "09:00"
  status: SlotStatus;
  clientName?: string;
  service?: string;
};

// 🔧 MOCK TEMPORÁRIO — trocar pela chamada real quando o back estiver pronto
export async function getAgendaByDate(
  date: string,
  professionalId?: string,
  token?: string | null
): Promise<AgendaSlot[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  const hours = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00',
    '17:30', '18:00'
  ];

  // Gera dados simulados realistas variando conforme o ID do profissional
  const isAlt = professionalId && professionalId.charCodeAt(0) % 2 === 0;

  const filled: Record<string, Partial<AgendaSlot>> = isAlt ? {
    '08:30': { status: 'confirmed', clientName: 'Felipe Rocha', service: 'Degradê Navalhado' },
    '09:30': { status: 'confirmed', clientName: 'Lucas Castro', service: 'Barboterapia' },
    '11:00': { status: 'encaixe', clientName: 'Bruno Dias', service: 'Corte Tradicional' },
    '12:00': { status: 'blocked' },
    '14:30': { status: 'confirmed', clientName: 'Matheus Reis', service: 'Corte + Barba' },
    '16:00': { status: 'confirmed', clientName: 'Gabriel Pires', service: 'Acabamento & Pezinho' },
  } : {
    '09:00': { status: 'confirmed', clientName: 'João Silva', service: 'Corte + Barba' },
    '09:30': { status: 'confirmed', clientName: 'João Silva', service: 'Corte + Barba' },
    '10:30': { status: 'encaixe', clientName: 'Marcos Lima', service: 'Barba Terapia' },
    '12:00': { status: 'blocked' },
    '14:00': { status: 'blocked' },
    '15:30': { status: 'confirmed', clientName: 'Rafael Souza', service: 'Corte Premium' },
    '17:00': { status: 'confirmed', clientName: 'André Santos', service: 'Sobrancelha' },
  };

  return hours.map((time) => ({
    id: `${professionalId || 'all'}-${date}-${time}`,
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