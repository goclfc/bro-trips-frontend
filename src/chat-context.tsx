import { createContext, useContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { api, type Contact } from './api';
import { useAuth } from './auth';

type ChatState = {
  contacts: Contact[];
  globalUnread: number;
  totalUnread: number;
  refresh: () => void;
};

const Ctx = createContext<ChatState | null>(null);

const CONTACTS_POLL_MS = 5000;
const HEARTBEAT_MS = 20000;

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [globalUnread, setGlobalUnread] = useState(0);

  // Keep the latest refresh in a ref so the polling interval never goes stale.
  const refresh = useCallback(async () => {
    try {
      const d = await api<{ contacts: Contact[]; global_unread: number }>('/chat/contacts');
      setContacts(d.contacts);
      setGlobalUnread(d.global_unread);
    } catch {
      /* transient network errors are fine; next tick retries */
    }
  }, []);
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    if (!user) {
      setContacts([]);
      setGlobalUnread(0);
      return;
    }
    const tick = () => refreshRef.current();
    const beat = () => {
      api('/chat/heartbeat', { method: 'POST' }).catch(() => {});
    };
    tick();
    beat();
    const c = setInterval(tick, CONTACTS_POLL_MS);
    const h = setInterval(beat, HEARTBEAT_MS);
    return () => {
      clearInterval(c);
      clearInterval(h);
    };
  }, [user]);

  const totalUnread = globalUnread + contacts.reduce((sum, c) => sum + c.unread, 0);

  return (
    <Ctx.Provider value={{ contacts, globalUnread, totalUnread, refresh }}>{children}</Ctx.Provider>
  );
}

export function useChat(): ChatState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useChat outside provider');
  return v;
}
