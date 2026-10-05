import api from './api';
import { type AppointmentStatus } from './appointmentServices';
import { type OrderStatus } from './comandaServices';

export type AttendanceItem = {
  id: string; // appointmentId
  establishmentId: string;
  professionalId: string;
  professionalName: string;
  clientId: string | null;
  clientName: string;
  clientPhone: string | null;
  serviceId: string;
  serviceName: string;
  services: string[];
  startDateTime: string;
  endDateTime: string;
  status: AppointmentStatus;
  orderId: string | null;
  orderStatus: OrderStatus | null;
  totalAmount: number;
  photosCount: number;
  hasTechnicalSheet: boolean;
  notes: string | null;
};

export type AttendancePage = {
  content: AttendanceItem[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  empty: boolean;
  first: boolean;
  last: boolean;
};

export type GetProfessionalAttendancesParams = {
  status?: AppointmentStatus;
  from?: string;
  to?: string;
  clientId?: string;
  page?: number;
  size?: number;
};

export type GetEstablishmentAttendancesParams = {
  professionalId?: string;
  clientId?: string;
  status?: AppointmentStatus;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
};

export async function getProfessionalAttendances(
  params?: GetProfessionalAttendancesParams
): Promise<AttendancePage> {
  const { data } = await api.get<AttendancePage>('/professionals/me/attendances', { params });
  return data;
}

export async function getEstablishmentAttendances(
  params?: GetEstablishmentAttendancesParams
): Promise<AttendancePage> {
  const { data } = await api.get<AttendancePage>('/attendances', { params });
  return data;
}

export async function getClientAttendances(clientId: string): Promise<AttendanceItem[]> {
  const { data } = await api.get<AttendanceItem[]>(`/clients/${clientId}/attendances`);
  return data;
}
