import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { friends as initialFriends, me as initialMe } from '../../../data';
import type { Friend, FriendRequest, UserProfile } from '../../types';
import { friendsService, type AddFriendResult } from './friendsService';
import { buildInviteLink } from './invite';

interface FriendsContextValue {
  me: UserProfile;
  friends: Friend[];
  pendingRequests: FriendRequest[];
  inviteLink: string;
  addFriendByEmail: (email: string) => Promise<AddFriendResult>;
  acceptInviteLink: (link: string) => Promise<AddFriendResult>;
  removeFriend: (friendId: string) => Promise<boolean>;
  /** Nova ordem da lista de amigos (arrastar na aba Friends). */
  reorderFriends: (friendIds: string[]) => void;
  /** Settings → "Edit name & email". Retorna a mensagem de erro, ou null se deu certo. */
  updateProfile: (changes: Pick<UserProfile, 'name' | 'email'>) => Promise<string | null>;
}

const FriendsContext = createContext<FriendsContextValue | null>(null);

/**
 * "Contexto" do React: guarda os amigos num lugar só e deixa qualquer tela
 * ler/alterar com `useFriends()` (popup de adicionar, filtro People, eventos...).
 * Fica em volta do app inteiro, no App.tsx.
 */
export function FriendsProvider({ children }: { children: ReactNode }) {
  // Começa com os dados locais para não "piscar" vazio; depois confirma com o serviço.
  const [me, setMe] = useState(initialMe);
  const [friends, setFriends] = useState(initialFriends);
  const [pendingRequests, setPending] = useState<FriendRequest[]>([]);

  const refresh = useCallback(async () => {
    const [m, f, p] = await Promise.all([
      friendsService.getMe(),
      friendsService.getFriends(),
      friendsService.getPendingRequests(),
    ]);
    setMe(m);
    setFriends(f);
    setPending(p);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addFriendByEmail = useCallback(
    async (email: string) => {
      const result = await friendsService.sendFriendRequest(email);
      if (result.ok) await refresh();
      return result;
    },
    [refresh],
  );

  const acceptInviteLink = useCallback(
    async (link: string) => {
      const result = await friendsService.acceptInviteLink(link);
      if (result.ok) await refresh();
      return result;
    },
    [refresh],
  );

  const removeFriend = useCallback(
    async (friendId: string) => {
      // Some da lista na hora (resposta rápida na tela); depois confirma com o serviço.
      setFriends((prev) => prev.filter((f) => f.id !== friendId));
      const result = await friendsService.removeFriend(friendId);
      await refresh();
      return result.ok;
    },
    [refresh],
  );

  const reorderFriends = useCallback((friendIds: string[]) => {
    // Muda na tela na hora; o serviço guarda a ordem.
    const position = new Map(friendIds.map((id, i) => [id, i]));
    setFriends((prev) => [...prev].sort((a, b) => (position.get(a.id) ?? 999) - (position.get(b.id) ?? 999)));
    friendsService.reorderFriends(friendIds);
  }, []);

  const updateProfile = useCallback(async (changes: Pick<UserProfile, 'name' | 'email'>) => {
    const result = await friendsService.updateProfile(changes);
    if (!result.ok) return result.error;
    setMe(result.me);
    return null;
  }, []);

  const value = useMemo(
    () => ({
      me,
      friends,
      pendingRequests,
      inviteLink: buildInviteLink(me.inviteSlug),
      addFriendByEmail,
      acceptInviteLink,
      removeFriend,
      reorderFriends,
      updateProfile,
    }),
    [me, friends, pendingRequests, addFriendByEmail, acceptInviteLink, removeFriend, reorderFriends, updateProfile],
  );

  return <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>;
}

export function useFriends(): FriendsContextValue {
  const ctx = useContext(FriendsContext);
  if (!ctx) throw new Error('useFriends() must be used inside <FriendsProvider> (see App.tsx)');
  return ctx;
}
