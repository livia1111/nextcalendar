/**
 * ID do único estabelecimento suportado nesta versão do app (single-tenant
 * por decisão de escopo). Definido via variável de ambiente — para trocar,
 * edite o .env e reinicie o Metro bundler, sem precisar tocar em código.
 *
 * O UUID deve bater com o inserido na migration do backend:
 *   backend/src/main/resources/db/migration/V1__seed_default_establishment.sql
 */
export const DEFAULT_ESTABLISHMENT_ID =
  process.env.EXPO_PUBLIC_ESTABLISHMENT_ID ?? '';

if (!DEFAULT_ESTABLISHMENT_ID && __DEV__) {
  console.warn(
    '[establishment] EXPO_PUBLIC_ESTABLISHMENT_ID não definido no .env — ' +
      'funcionalidades de agendamento do lado do cliente vão falhar.',
  );
}
