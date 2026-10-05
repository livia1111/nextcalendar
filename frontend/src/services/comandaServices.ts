import api from './api';
import { USE_MOCK_COMANDA } from '../constants/mocks';
import { listarServicos } from './serviceServices';
import { listProducts } from './produtoServices';

export type OrderStatus = 'OPEN' | 'CLOSED' | 'CANCELLED';
export type OrderItemType = 'SERVICE' | 'PRODUCT';
export type PaymentMethod = 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX';

export type OrderItem = {
  id: string;
  itemType: OrderItemType;
  name: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
};

export type Order = {
  id: string;
  appointmentId: string;
  professionalId: string;
  professionalName: string;
  professionalPhotoUrl: string | null;
  clientName: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod | null;
  createdAt: string;
  closedAt: string | null;
};

export type OrderItemAddInput = {
  itemType: OrderItemType;
  itemId: string;
  quantity: number;
};

export type OrderUpdateInput = {
  discountAmount?: number;
  paymentMethod?: PaymentMethod;
};

export type CatalogService = {
  id: string;
  name: string;
  price: number;
  category?: string;
};

export const MOCK_APPOINTMENT_ID = 'mock-appointment';

// ─── Mock (só em memória) ─────────────────────────────────────────────────────

const wait = (ms = 250) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const round2 = (n: number) => Math.round(n * 100) / 100;
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

let mockSeq = 0;
const nextId = (prefix: string) => `${prefix}-${Date.now()}-${++mockSeq}`;

const MOCK_SERVICES: CatalogService[] = [
  { id: 's-1', name: 'Corte Degradê', price: 70, category: 'Cabelo' },
  { id: 's-2', name: 'Barba', price: 40, category: 'Barba' },
  { id: 's-3', name: 'Hidratação', price: 30, category: 'Cabelo' },
  { id: 's-4', name: 'Sobrancelha', price: 20, category: 'Estética' },
  { id: 's-5', name: 'Corte + Barba', price: 100, category: 'Combo' },
];

let mockOrders: Order[] = [];

function recalc(order: Order): Order {
  const items = order.items.map((i) => ({ ...i, subtotal: round2(i.unitPrice * i.quantity) }));
  const subtotal = round2(items.reduce((sum, i) => sum + i.subtotal, 0));
  return { ...order, items, subtotal, totalAmount: Math.max(round2(subtotal - order.discountAmount), 0) };
}

function findMock(orderId: string): Order {
  const order = mockOrders.find((o) => o.id === orderId);
  if (!order) throw new Error('Comanda não encontrada.');
  return order;
}

function assertOpen(order: Order) {
  if (order.status === 'CLOSED') {
    throw new Error('Esta comanda já foi finalizada e não pode mais ser alterada.');
  }
}

function saveMock(order: Order): Order {
  const saved = recalc(order);
  mockOrders = mockOrders.map((o) => (o.id === saved.id ? saved : o));
  return clone(saved);
}

export async function listCatalogServices(establishmentId: string): Promise<CatalogService[]> {
  if (USE_MOCK_COMANDA) {
    await wait();
    return clone(MOCK_SERVICES);
  }
  const services = await listarServicos(establishmentId);
  return services.map((s) => ({ id: s.id, name: s.name, price: s.price, category: s.category }));
}

export async function openOrder(establishmentId: string, appointmentId: string): Promise<Order> {
  if (USE_MOCK_COMANDA) {
    await wait();
    const existing = mockOrders.find((o) => o.appointmentId === appointmentId);
    if (existing) return clone(existing);

    const created = recalc({
      id: nextId('order'),
      appointmentId,
      professionalId: 'prof-1',
      professionalName: 'Carlos Silva',
      professionalPhotoUrl: null,
      clientName: 'João Pereira',
      status: 'OPEN',
      items: [
        { id: nextId('item'), itemType: 'SERVICE', name: 'Corte Degradê', unitPrice: 70, quantity: 1, subtotal: 70 },
      ],
      subtotal: 0,
      discountAmount: 0,
      totalAmount: 0,
      paymentMethod: null,
      createdAt: new Date().toISOString(),
      closedAt: null,
    });
    mockOrders = [...mockOrders, created];
    return clone(created);
  }
  const { data } = await api.post<Order>(`/establishments/${establishmentId}/appointments/${appointmentId}/order`);
  return data;
}

export async function getOrder(establishmentId: string, orderId: string): Promise<Order> {
  if (USE_MOCK_COMANDA) {
    await wait();
    return clone(findMock(orderId));
  }
  const { data } = await api.get<Order>(`/establishments/${establishmentId}/orders/${orderId}`);
  return data;
}

export async function addOrderItem(
  establishmentId: string,
  orderId: string,
  input: OrderItemAddInput,
): Promise<Order> {
  if (USE_MOCK_COMANDA) {
    await wait();
    const order = findMock(orderId);
    assertOpen(order);
    let name: string;
    let unitPrice: number;
    if (input.itemType === 'SERVICE') {
      const service = MOCK_SERVICES.find((s) => s.id === input.itemId);
      if (!service) throw new Error('Serviço não encontrado.');
      name = service.name;
      unitPrice = service.price;
    } else {
      const products = await listProducts(establishmentId);
      const product = products.find((p) => p.id === input.itemId);
      if (!product) throw new Error('Produto não encontrado.');
      name = product.name;
      unitPrice = product.price;
    }
    const item: OrderItem = {
      id: nextId('item'),
      itemType: input.itemType,
      name,
      unitPrice,
      quantity: input.quantity,
      subtotal: round2(unitPrice * input.quantity),
    };
    return saveMock({ ...order, items: [...order.items, item] });
  }
  const { data } = await api.post<Order>(`/establishments/${establishmentId}/orders/${orderId}/items`, input);
  return data;
}


export async function removeOrderItem(
  establishmentId: string,
  orderId: string,
  itemId: string,
): Promise<Order> {
  if (USE_MOCK_COMANDA) {
    await wait();
    const order = findMock(orderId);
    assertOpen(order);
    if (!order.items.some((i) => i.id === itemId)) throw new Error('Item da comanda não encontrado.');
    return saveMock({ ...order, items: order.items.filter((i) => i.id !== itemId) });
  }
  const { data } = await api.delete<Order>(`/establishments/${establishmentId}/orders/${orderId}/items/${itemId}`);
  return data;
}


export async function updateOrder(
  establishmentId: string,
  orderId: string,
  input: OrderUpdateInput,
): Promise<Order> {
  if (USE_MOCK_COMANDA) {
    await wait();
    const order = findMock(orderId);
    assertOpen(order);
    if (input.discountAmount != null && input.discountAmount < 0) {
      throw new Error('O desconto não pode ser negativo.');
    }
    return saveMock({
      ...order,
      discountAmount: input.discountAmount ?? order.discountAmount,
      paymentMethod: input.paymentMethod ?? order.paymentMethod,
    });
  }
  const { data } = await api.patch<Order>(`/establishments/${establishmentId}/orders/${orderId}`, input);
  return data;
}

export async function finishOrder(establishmentId: string, orderId: string): Promise<Order> {
  if (USE_MOCK_COMANDA) {
    await wait();
    const order = findMock(orderId);
    assertOpen(order);
    if (order.items.length === 0) throw new Error('A comanda precisa ter ao menos um item para ser finalizada.');
    if (!order.paymentMethod) throw new Error('Selecione a forma de pagamento antes de finalizar a comanda.');
    return saveMock({ ...order, status: 'CLOSED', closedAt: new Date().toISOString() });
  }
  const { data } = await api.post<Order>(`/establishments/${establishmentId}/orders/${orderId}/finish`);
  return data;
}