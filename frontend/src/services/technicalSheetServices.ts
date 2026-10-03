import api from './api';


export type TechnicalSheetPhoto = {
  id: string;
  photoUrl: string;
  createdAt: string;
};

export type TechnicalSheetEntry = {
  id: string;
  appointmentId: string;
  professionalId: string;
  professionalName: string;
  serviceName: string;
  notes: string | null;
  photos: TechnicalSheetPhoto[];
  createdAt: string;
};

export type TechnicalSheetFull = {
  id: string;
  clientId: string;
  clientName: string;
  observations: string | null;
  entries: TechnicalSheetEntry[];
  createdAt: string;
  updatedAt: string;
};

export type PhotoUploadResponse = {
  id: string;
  url: string; 
};

export type SaveEntryPayload = {
  appointmentId: string;
  notes?: string;
  photoUrls?: string[];
};

export async function uploadPhoto(base64: string, contentType: string): Promise<PhotoUploadResponse> {
  const { data } = await api.post<PhotoUploadResponse>('/photos', {
    content: base64,
    contentType,
  });
  return data;
}

export async function getFullSheet(clientId: string): Promise<TechnicalSheetFull> {
  const { data } = await api.get<TechnicalSheetFull>(`/clients/${clientId}/technical-sheet`);
  return data;
}


export function findEntryByAppointment(
  sheet: TechnicalSheetFull,
  appointmentId: string
): TechnicalSheetEntry | undefined {
  return sheet.entries.find((e) => e.appointmentId === appointmentId);
}


export async function createEntry(clientId: string, payload: SaveEntryPayload): Promise<TechnicalSheetFull> {
  const { data } = await api.post<TechnicalSheetFull>(`/clients/${clientId}/technical-sheet/entries`, payload);
  return data;
}


export async function removeEntry(clientId: string, entryId: string): Promise<TechnicalSheetFull> {
  const { data } = await api.delete<TechnicalSheetFull>(`/clients/${clientId}/technical-sheet/entries/${entryId}`);
  return data;
}


export async function saveEntry(
  clientId: string,
  existingEntryId: string | null,
  payload: SaveEntryPayload
): Promise<TechnicalSheetFull> {
  if (existingEntryId) {
    await removeEntry(clientId, existingEntryId);
  }
  return createEntry(clientId, payload);
}