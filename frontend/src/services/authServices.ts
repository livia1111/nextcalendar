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

type ForgotPasswordResponse = {
  message:string;
} 
type VerifyCodeResponse = {
  resetToken:string;
}

type ResetPasswordResponse = {
  message:string;
}

export async function forgotPassword(email:string) : Promise<ForgotPasswordResponse>{
  await new Promise((resolve)=> setTimeout(resolve,1000));

  if(email ==='naoexiste@teste.com'){
    throw {message:'Não encontramos uma conta com esse email'};
  }

  return {message:'Código enviado para o seu e-mail'}
}

export async function verifyCode(email:string,code:string) : Promise<VerifyCodeResponse>{
  await new Promise((resolve)=>setTimeout(resolve,1000));

  if(code!== '122222'){
    throw{message:'Código inválido'}
  }

  return {resetToken:'reset-token-mockado'}
}

export async function resetPassword(resetToken:string,newPassword:string) : Promise<ResetPasswordResponse> {
  await new Promise((resolve)=> setTimeout(resolve,1000))

  if (!resetToken) {
    throw { message: 'Sessão de redefinição expirada, solicite um novo código' };
  }

  return { message: 'Senha redefinida com sucesso' };
}