import { Platform } from 'react-native';
import api from './api';

export type PhotoType = 'BEFORE' | 'AFTER' | 'OTHER';

export type AttendancePhoto = {
  id: string;
  appointmentId: string;
  clientId: string | null;
  type: PhotoType;
  caption: string | null;
  takenBy: string | null;
  takenByName: string | null;
  photoUrl: string;
  createdAt: string;
};

export async function uploadAppointmentPhoto(
  appointmentId: string,
  uri: string,
  mimeType: string,
  type: PhotoType,
  caption?: string
): Promise<AttendancePhoto> {
  const formData = new FormData();
  const filename = uri.split('/').pop() || `photo_${Date.now()}.jpg`;

  // React Native file representation in FormData
  formData.append('file', {
    uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
    name: filename,
    type: mimeType || 'image/jpeg',
  } as unknown as Blob);

  formData.append('type', type);
  if (caption && caption.trim()) {
    formData.append('caption', caption.trim());
  }

  const { data } = await api.post<AttendancePhoto>(
    `/appointments/${appointmentId}/photos`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return data;
}

export async function getAppointmentPhotos(appointmentId: string): Promise<AttendancePhoto[]> {
  const { data } = await api.get<AttendancePhoto[]>(`/appointments/${appointmentId}/photos`);
  return data;
}

export async function getClientPhotos(clientId: string): Promise<AttendancePhoto[]> {
  const { data } = await api.get<AttendancePhoto[]>(`/clients/${clientId}/photos`);
  return data;
}

export async function deletePhoto(photoId: string): Promise<void> {
  await api.delete(`/photos/${photoId}`);
}
