import api from './api';
import { USE_MOCK_COMANDA } from '../constants/mocks';

export type ProductResponse = {
  id: string;
  name: string;
  category: string;
  price: number;
  stockQuantity: number;
};

export type ProductPayload = {
  name: string;
  category: string;
  price: number;
  stockQuantity: number;
};

const wait = (ms = 250) => new Promise<void>((resolve) => setTimeout(resolve, ms));

let mockSeq = 100;
let mockProducts: ProductResponse[] = [
  { id: 'p-1', name: 'Pomada Modeladora', category: 'Cabelo', price: 50, stockQuantity: 12 },
  { id: 'p-2', name: 'Óleo para Barba', category: 'Barba', price: 45, stockQuantity: 8 },
  { id: 'p-3', name: 'Shampoo Anticaspa', category: 'Cabelo', price: 38, stockQuantity: 3 },
  { id: 'p-4', name: 'Cera Capilar', category: 'Cabelo', price: 42, stockQuantity: 0 },
];

function validate(p: ProductPayload) {
  const name = p.name?.trim() ?? '';
  if (name.length < 3 || name.length > 120) throw new Error('O nome deve ter entre 3 a 120 caracteres.');
  if (!p.category?.trim()) throw new Error('A categoria é obrigatória.');
  if (p.category.trim().length > 50) throw new Error('A categoria deve possuir no máximo 50 caracteres.');
  if (!(p.price > 0)) throw new Error('O preço do produto precisa ser positivo.');
  if (p.stockQuantity < 0) throw new Error('A quantidade em estoque não pode ser negativa.');
}

export async function listProducts(establishmentId: string): Promise<ProductResponse[]> {
  if (USE_MOCK_COMANDA) {
    await wait();
    return mockProducts.map((p) => ({ ...p }));
  }
  // O backend devolve Page<ProductMinResponseDTO> — pegamos só o content.
  const { data } = await api.get(`/establishments/${establishmentId}/products`, {
    params: { size: 100 },
  });
  return data.content ?? data;
}

export async function createProduct(
  establishmentId: string,
  payload: ProductPayload,
): Promise<ProductResponse> {
  if (USE_MOCK_COMANDA) {
    await wait();
    validate(payload);
    const created: ProductResponse = {
      id: `p-${++mockSeq}`,
      name: payload.name.trim(),
      category: payload.category.trim(),
      price: payload.price,
      stockQuantity: payload.stockQuantity,
    };
    mockProducts = [...mockProducts, created];
    return { ...created };
  }
  const { data } = await api.post<ProductResponse>(`/establishments/${establishmentId}/products`, payload);
  return data;
}

export async function updateProduct(
  establishmentId: string,
  productId: string,
  payload: ProductPayload,
): Promise<ProductResponse> {
  if (USE_MOCK_COMANDA) {
    await wait();
    validate(payload);
    const current = mockProducts.find((p) => p.id === productId);
    if (!current) throw new Error('Produto não encontrado.');
    const updated: ProductResponse = {
      ...current,
      name: payload.name.trim(),
      category: payload.category.trim(),
      price: payload.price,
      stockQuantity: payload.stockQuantity,
    };
    mockProducts = mockProducts.map((p) => (p.id === productId ? updated : p));
    return { ...updated };
  }
  const { data } = await api.put<ProductResponse>(
    `/establishments/${establishmentId}/products/${productId}`,
    payload,
  );
  return data;
}


export async function deleteProduct(establishmentId: string, productId: string): Promise<void> {
  if (USE_MOCK_COMANDA) {
    await wait();
    mockProducts = mockProducts.filter((p) => p.id !== productId);
    return;
  }
  await api.delete(`/establishments/${establishmentId}/products/${productId}`);
}