// src/services/authService.ts

type LoginResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

// 🔧 MOCK TEMPORÁRIO — trocar pela chamada real quando o back estiver pronto
export async function login(email: string, password: string): Promise<LoginResponse> {
  // simula o delay de uma requisição de rede
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // simula erro de credenciais inválidas pra você testar esse caminho também
  if (password !== '123456') {
    throw { message: 'Email ou senha inválidos' };
  }

  return {
    token: 'mock-jwt-token-fake',
    user: {
      id: 'mock-uuid-123',
      name: 'Pedro Teste',
      email,
    },
  };
}