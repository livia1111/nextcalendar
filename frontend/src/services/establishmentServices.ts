import api from './api';

// ─── Tipos ────────────────────────────────────────────────────────────────

export type AddressResponse = {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

export type EstablishmentResponse = {
  id: string;
  ownerId: string;
  legalName: string;
  name: string;
  cnpj: string;
  phone: string;
  whatsapp: string;
  email: string;
  businessType: string;
  logoUrl: string | null;
  address: AddressResponse;
  trialStartDate: string;
  trialEndDate: string;
  trialActive: boolean;
  termsAccepted: boolean;
  active: boolean;
};

export type CepResponse = {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
};

export type EstablishmentUpdatePayload = {
  legalName?: string;
  name?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  businessType?: string;
  address?: {
    cep?: string;
    number?: string;
    complement?: string;
    street?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
  };
};

// ─── UC02 — Consultar CEP ──────────────────────────────────────────────────

export async function consultarCep(cep: string): Promise<CepResponse> {
  const { data } = await api.get<CepResponse>(`/cep/${cep.replace(/\D/g, '')}`);
  return data;
}

// ─── UC03 — Obter establishment do proprietário ───────────────────────────

export async function getEstablishmentByOwner(ownerId: string): Promise<EstablishmentResponse> {
  const { data } = await api.get<EstablishmentResponse>(`/establishments/owner/${ownerId}`);
  return data;
}

// ─── UC06 — Atualizar dados do estabelecimento ────────────────────────────

export async function updateEstablishment(
  id: string,
  payload: EstablishmentUpdatePayload
): Promise<EstablishmentResponse> {
  const { data } = await api.put<EstablishmentResponse>(`/establishments/${id}`, payload);
  return data;
}
