// src/lib/api.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import { Platform } from 'react-native';

export const api = axios.create({
  baseURL:
    process.env.EXPO_PUBLIC_API_URL ||
    (Platform.OS === 'android' ? 'http://10.0.2.2:8080/api/v1' : 'http://localhost:8080/api/v1'),
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message ?? 'Erro de conexão com o servidor';
    const status = error.response?.status;
    return Promise.reject({ message, status, original: error });
  }
);