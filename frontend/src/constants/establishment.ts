/**
 * ID do único estabelecimento suportado nesta versão do app (single-tenant
 * por decisão de escopo). Definido via variável de ambiente — para trocar,
 * edite frontend/.env e reinicie o Metro bundler com `npx expo start --clear`.
 *
 * O UUID deve bater com o inserido na migration do backend:
 *   backend/src/main/resources/db/migration/V1__seed_default_establishment.sql
 *
 * ATENÇÃO: o Expo lê variáveis EXPO_PUBLIC_* apenas do .env dentro da pasta
 * que contém o package.json do frontend (frontend/.env), não da raiz do monorepo.
 */

/** UUID fixo do seed SQL — fonte da verdade para o ambiente de desenvolvimento. */
const SEED_ESTABLISHMENT_ID = '11111111-1111-1111-1111-111111111111';

export const DEFAULT_ESTABLISHMENT_ID: string =
  process.env.EXPO_PUBLIC_ESTABLISHMENT_ID || SEED_ESTABLISHMENT_ID;

if (__DEV__ && process.env.EXPO_PUBLIC_ESTABLISHMENT_ID) {
  // Variável lida com sucesso pelo Expo — confirma no log
  console.log(
    '[establishment] EXPO_PUBLIC_ESTABLISHMENT_ID carregado:',
    process.env.EXPO_PUBLIC_ESTABLISHMENT_ID
  );
} else if (__DEV__) {
  console.warn(
    '[establishment] EXPO_PUBLIC_ESTABLISHMENT_ID não definido no frontend/.env — ' +
      `usando fallback do seed: ${SEED_ESTABLISHMENT_ID}`
  );
}
