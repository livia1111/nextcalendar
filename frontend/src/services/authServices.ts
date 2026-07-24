// src/services/authServices.ts

type LoginResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

type RegisterPayload = {
  name:string;
  email:string;
  password:string;
  phone?:string;
}

type RegisterResponse = {
  token: string;
  user :{
    id:string;
    name:string;
    email:string;
    phone?:string;
  }
}

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

export async function register(data:RegisterPayload): Promise<RegisterResponse>{

  await new Promise((resolve)=> setTimeout(resolve,1000))

  if(data.email===' ja-existe@teste.com'){
    throw {message:'Este e-mail ja esta cadastrado'}
  }
  return {
    token:'mock-jwt-fake',
    user:{
      id:'mock-data',
      name:data.name,
      email:data.email
    }
  }
}