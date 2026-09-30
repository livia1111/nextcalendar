/**
 * ID do único estabelecimento suportado nesta versão do app (single-tenant
 * por decisão de escopo). Definido via variável de ambiente — para trocar,
 * edite o .env e reinicie o Metro bundler com `npx expo start -c`.
 *
 * O UUID deve bater com o inserido no seed do backend:
 *   backend/src/main/resources/data.sql
 *
 * ⚠️  Se a variável não estiver definida, é utilizado o UUID do seed padrão
 *     de desenvolvimento. Em produção, defina EXPO_PUBLIC_ESTABLISHMENT_ID
 *     explicitamente no .env para evitar surpresas ao trocar de banco.
 */
export const DEFAULT_ESTABLISHMENT_ID =
  process.env.EXPO_PUBLIC_ESTABLISHMENT_ID ?? '3fa85f64-5717-4562-b3fc-2c963f66afa6';

if (!process.env.EXPO_PUBLIC_ESTABLISHMENT_ID && __DEV__) {
  console.warn(
    '[establishment] EXPO_PUBLIC_ESTABLISHMENT_ID não está definido no .env — ' +
      'usando UUID de fallback do seed de desenvolvimento. ' +
      'Defina a variável e reinicie com `npx expo start -c`.',
  );
}
