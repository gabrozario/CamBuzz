import { INVITE_BASE_URL } from '../../config';

/** Link de convite completo: https://cambuzz.app/friends/alex-morgan */
export function buildInviteLink(inviteSlug: string): string {
  return `${INVITE_BASE_URL}/${inviteSlug}`;
}

/** Link sem "https://", para mostrar na tela (como no Figma). */
export function displayLink(link: string): string {
  return link.replace(/^https?:\/\//, '');
}

/** Extrai o slug de um link de convite colado/aberto. Ex.: ".../friends/maya-chen" -> "maya-chen". */
export function parseInviteLink(link: string): string | null {
  const match = link.trim().match(/\/friends\/([a-z0-9-]+)\/?$/i);
  return match ? match[1].toLowerCase() : null;
}

/** Validação simples de email (o backend fará a validação de verdade). */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
