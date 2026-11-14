import { directory, friends as initialFriends, me } from '../../../data';
import { friendPalette } from '../../theme';
import type { DirectoryUser, Friend, FriendRequest, UserProfile } from '../../types';
import { buildInviteLink, isValidEmail, normalizeEmail, parseInviteLink } from './invite';

/** Resultado de tentar adicionar um amigo. */
export type AddFriendResult =
  | { ok: true; request: FriendRequest; friend?: Friend } // friend presente = já virou amigo
  | { ok: false; error: string };

/**
 * Tudo o que o app precisa do "backend" de amigos.
 * Hoje: implementação falsa (mockFriendsService) com os JSONs de /data.
 * Futuro: criar apiFriendsService com fetch() para o servidor, com as MESMAS
 * funções, e trocar em `friendsService` lá embaixo. As telas não mudam.
 */
export interface FriendsService {
  getMe(): Promise<UserProfile>;
  getFriends(): Promise<Friend[]>;
  getPendingRequests(): Promise<FriendRequest[]>;
  /** Seu link pessoal de convite (cada conta tem um). */
  getInviteLink(): Promise<string>;
  /** Envia pedido de amizade para um email. */
  sendFriendRequest(email: string): Promise<AddFriendResult>;
  /** Aceita um convite recebido por link (quando alguém abrir o seu link, ou você abrir o de alguém). */
  acceptInviteLink(link: string): Promise<AddFriendResult>;
}

// ---------------- Implementação falsa (em memória) ----------------

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let friendsState: Friend[] = [...initialFriends];
let requestsState: FriendRequest[] = [];

function nextColor(): string {
  const used = new Set(friendsState.map((f) => f.color));
  return friendPalette.find((c) => !used.has(c)) ?? friendPalette[friendsState.length % friendPalette.length];
}

function befriend(user: DirectoryUser): Friend {
  const friend: Friend = { ...user, color: nextColor() };
  friendsState = [...friendsState, friend];
  return friend;
}

function makeRequest(email: string, via: FriendRequest['via'], status: FriendRequest['status']): FriendRequest {
  return { id: `req-${Date.now()}`, email, via, status, createdAt: new Date().toISOString() };
}

export const mockFriendsService: FriendsService = {
  async getMe() {
    return me;
  },
  async getFriends() {
    return friendsState;
  },
  async getPendingRequests() {
    return requestsState.filter((r) => r.status === 'pending');
  },
  async getInviteLink() {
    return buildInviteLink(me.inviteSlug);
  },

  async sendFriendRequest(rawEmail) {
    await wait(600); // simula a ida ao servidor
    const email = normalizeEmail(rawEmail);
    if (!isValidEmail(email)) return { ok: false, error: 'Enter a valid email address.' };
    if (email === me.email) return { ok: false, error: "That's your own email." };
    if (friendsState.some((f) => f.email === email)) return { ok: false, error: "You're already friends." };
    if (requestsState.some((r) => r.email === email && r.status === 'pending')) {
      return { ok: false, error: 'Request already sent.' };
    }

    // Demo: se o email for de alguém do diretório (directory.json), a pessoa "aceita" na hora.
    // Na vida real o pedido fica pendente até o amigo aceitar no app dele.
    const user = directory.find((u) => u.email === email);
    if (user) {
      const request = makeRequest(email, 'email', 'accepted');
      requestsState = [...requestsState, request];
      return { ok: true, request, friend: befriend(user) };
    }
    const request = makeRequest(email, 'email', 'pending');
    requestsState = [...requestsState, request];
    return { ok: true, request };
  },

  async acceptInviteLink(link) {
    await wait(400);
    const slug = parseInviteLink(link);
    if (!slug) return { ok: false, error: "That doesn't look like a Cambuzz invite link." };
    if (slug === me.inviteSlug) return { ok: false, error: "That's your own link." };
    if (friendsState.some((f) => f.inviteSlug === slug)) return { ok: false, error: "You're already friends." };
    const user = directory.find((u) => u.inviteSlug === slug);
    if (!user) return { ok: false, error: 'Invite not found.' };
    const request = makeRequest(user.email, 'link', 'accepted');
    requestsState = [...requestsState, request];
    return { ok: true, request, friend: befriend(user) };
  },
};

/** O serviço que o app usa. Troque aqui quando existir o backend. */
export const friendsService: FriendsService = mockFriendsService;
