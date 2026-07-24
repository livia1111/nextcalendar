import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { login as loginService, register as registerService } from '../services/authServices';

type User = {
  id: string;
  name: string;
  email: string;
};

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: RegisterPayload) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync('authToken').then((token) => {
      // TODO: quando a API estiver pronta, validar esse token com o backend
      // e restaurar o usuário (setUser) se for válido.
      // Por enquanto, só libera a tela sem restaurar sessão.
      setIsLoading(false);
    });
  }, []);

  async function signIn(email: string, password: string) {
    const { token, user } = await loginService(email, password);
    await SecureStore.setItemAsync('authToken', token);
    setUser(user);
  }

  async function signUp(data: RegisterPayload) {
    const { token, user } = await registerService(data);
    await SecureStore.setItemAsync('authToken', token);
    setUser(user);
  }

  async function signOut() {
    await SecureStore.deleteItemAsync('authToken');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth precisa ser usado dentro de um AuthProvider');
  }
  return context;
}