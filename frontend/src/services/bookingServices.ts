// src/services/bookingService.ts

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
};

// 🔧 MOCK TEMPORÁRIO — trocar pela chamada real quando o back estiver pronto
export async function getMyBookings(token: string | null): Promise<Booking[]> {
  // simula o delay de uma requisição de rede
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return [
    {
      id: '1',
      date: 'Dez 22, 2026 — Ter, horário',
      time: '09:00',
      shop: 'Studio Vision',
      address: 'Av. Imperatriz Leopoldina, 22ª',
      services: 'Undercut Haircut, Regular Shaving, Natural Hair Wash',
      price: 'R$ 125,00',
      status: 'upcoming',
      reminder: true,
    },
    {
      id: '2',
      date: 'Nov 10, 2026 — Seg, horário',
      time: '11:00',
      shop: 'Barbearia Clássicos',
      address: 'Rua das Flores, 100 - Centro',
      services: 'Corte de Cabelo, Barba',
      price: 'R$ 80,00',
      status: 'upcoming',
      reminder: false,
    },
    {
      id: '3',
      date: 'Out 05, 2026',
      time: '14:00',
      shop: 'Sharp Gents Barbershop',
      address: 'Av. Brasil, 445',
      services: 'Corte com Visagismo',
      price: 'R$ 150,00',
      status: 'done',
    },
    {
      id: '4',
      date: 'Set 20, 2026',
      time: '10:00',
      shop: 'Studio Vision',
      address: 'Av. Imperatriz Leopoldina, 22ª',
      services: 'Sobrancelha',
      price: 'R$ 45,00',
      status: 'cancelled',
    },
  ];
}

// 🔧 MOCK TEMPORÁRIO — trocar pela chamada real quando o back estiver pronto
export async function cancelBooking(id: string, token: string | null): Promise<{ success: true }> {
  await new Promise((resolve) => setTimeout(resolve, 800));

  // simula falha aleatória, só pra você testar o caminho de erro também
  // if (Math.random() < 0.1) throw { message: 'Não foi possível cancelar. Tente novamente.' };

  return { success: true };
}