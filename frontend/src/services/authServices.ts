import api from './api';

type LoginResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'CUSTOMER' | 'MANAGER' | 'PROFESSIONAL';
  };
};

/**
 * POST /api/v1/auth/login
 * Autentica o usuário e retorna o JWT + dados do usuário.
 */
export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
  return data;
}

/**
 * POST /api/v1/auth/register
 * Cadastra um novo usuário e retorna o JWT + dados do usuário.
 */
export async function register(
   name: string,
   email: string, 
   password: string, 
   role: string,
   phone?: string,
   dateOfBirth?: string
  
  ): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/register', { 
    name, 
    email, 
    password, 
    role,
    phone,
    dateOfBirth,
   });
  return data;
}

/**
 * POST /api/v1/auth/register (Gerente)
 * Cadastra um novo gerente e já salva os dados da empresa.
 */
export async function registerEmpresa(payload: Record<string, any>): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/register', payload);
  return data;
}