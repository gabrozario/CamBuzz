// Configurações gerais do app. NUNCA coloque chaves de API aqui (o repo é público).

/**
 * Base dos links de convite. Domínio PROVISÓRIO (ainda não existe).
 * Quando houver site/backend, troque aqui e configure o deep link
 * (scheme no app.json + expo-linking) para o link abrir o app.
 */
export const INVITE_BASE_URL = 'https://cambuzz.app/friends';

/**
 * Visual do mapa (Android / Google Maps), no modo claro:
 * - 'google'      → visual padrão do Google Maps (prédios sempre bem visíveis, em qualquer zoom),
 *                   só escondendo comércios e transporte para o campus ficar limpo.
 * - 'illustrated' → mapa bege/verde do Figma (theme/mapStyle.ts). Com zoom grande, o Google pinta
 *                   o chão "construído" do campus com a mesma cor dos prédios e tudo se mistura.
 * O modo escuro continua usando o estilo escuro do app.
 */
export const MAP_LOOK: 'google' | 'illustrated' = 'google';
