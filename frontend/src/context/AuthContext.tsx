import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getStorageItemAsync, setStorageItemAsync, deleteStorageItemAsync } from '../utils/storage';
import { login as loginService, register as registerService } from '../services/authServices';
import { isAxiosError } from 'axios';

/** Extrai a mensagem de erro de uma resposta Axios do backend Spring */
function extractBackendMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const data = err.response?.data;
    if (typeof data === 'string' && data.trim()) return data.trim();
    if (typeof data?.message === 'string') return data.message;
  }
  return fallback;
}

type User = {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'MANAGER' | 'PROFESSIONAL';
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStorageData() {
      const storedToken = await getStorageItemAsync('authToken');
      const userStr = await getStorageItemAsync('authUser');

      if (storedToken && userStr) {
        setToken(storedToken);
        setUser(JSON.parse(userStr));
      }
      setIsLoading(false);
    }
    loadStorageData();
  }, []);

  async function signIn(email: string, password: string) {
    try {
      const { token: newToken, user: newUser } = await loginService(email, password);
      await setStorageItemAsync('authToken', newToken);
      await setStorageItemAsync('authUser', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      return newUser;
    } catch (err: unknown) {
      throw new Error(
        extractBackendMessage(err, 'Não foi possível entrar. Tente novamente.')
      );
    }
  }

  async function signOut() {
    await deleteStorageItemAsync('authToken');
    await deleteStorageItemAsync('authUser');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, signIn, signOut }}>
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