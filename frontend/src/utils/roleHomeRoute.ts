/**
 * Retorna a rota home canônica de acordo com o role do usuário.
 * Fonte única de verdade: altere aqui e ambos _layout.tsx e login.tsx
 * herdarão o comportamento correto automaticamente.
 */
export function getRoleHomeRoute(role: string): string {
  switch (role) {
    case 'MANAGER':
      return '/(gestor)/homeEmpresa';
    case 'PROFESSIONAL':
      return '/(profissional)/home';
    default:
      return '/(tabs)/home';
  }
}
