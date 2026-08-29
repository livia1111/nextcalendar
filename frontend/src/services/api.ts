import axios from 'axios';
import { getStorageItemAsync } from '../utils/storage';

import { Platform } from 'react-native';

const API_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:8080/api/v1' 
  : 'http://localhost:8080/api/v1';

/**
 * Instância centralizada do axios.
 * Lê o token JWT do SecureStore e injeta automaticamente no header.
 */
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: injeta o Bearer token em toda requisição
api.interceptors.request.use(async (config) => {
  const token = await getStorageItemAsync('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

// ─── Config extra usada pelas telas de Serviços / Profissionais ────────────────
export const API_BASE_URL = Platform.OS === 'android'
  ? 'http://10.0.2.2:8080'
  : 'http://localhost:8080';

// TODO: substituir pela leitura real do estabelecimento logado (AuthContext)
export const ESTABLISHMENT_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
