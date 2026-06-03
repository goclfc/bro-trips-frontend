import { useEffect, useRef, useState } from 'react';
import { api, type ChatMessage, type Contact } from '../api';
import { useAuth } from '../auth';
import { useChat } from '../chat-context';

type Active = { kind: 'global' } | { kind: 'dm'; id: string; name: string };

function activeKey(a: Active | null) {
  if (!a) return '';
  return a.kind === 'global' ? 'global' : `dm:${a.id}`;
}

function initials(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || '?';
}

function Avatar({ name, picture, online }: { name: string; picture: string | null; online?: boolean | null }) {
  return (
    <span className="avatar-wrap">
      {picture ? (
        <img className="avatar" src={picture} alt="" />
      ) : (
        <span className="avatar avatar-fallback">{initials(name)}</span>
      )}
      {online != null && <span className={`dot ${online ? 'on' : 'off'}`} />}
    </span>
  );
}

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Chat() {
  const { user } = useAuth();
  const { contacts, globalUnread, refresh } = useChat();
  const [active, setActive] = useState<Active | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [menuId, setMenuId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const key = activeKey(active);

  async function load(a: Active) {
    const path = a.kind === 'global' ? '/chat/global' : `/chat/dm/${a.id}`;
    const d = await api<{ messages: ChatMessage[] }>(path);
    setMessages(d.messages);
    const lastId = d.messages.length ? d.messages[d.messages.length - 1].id : '0';
    api('/chat/read', {
      method: 'POST',
      body: JSON.stringify({ peer: a.kind === 'dm' ? Number(a.id) : null, last_read_id: Number(lastId) }),
    }).catch(() => {});
  }

  // Poll the open conversation every 3s.
  useEffect(() => {
    if (!active) return;
    let alive = true;
    const run = () => load(active).catch((e) => alive && setErr((e as Error).message));
    run();
    const t = setInterval(run, 3000);
    return () => {
      alive = false;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Stick to the bottom unless the user has scrolled up.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  function open(a: Active) {
    setActive(a);
    setMessages([]);
    setMenuId(null);
    setEditingId(null);
    stickRef.current = true;
  }

  async function send() {
    const text = draft.trim();
    if (!text || !active) return;
    setDraft('');
    stickRef.current = true;
    const path = active.kind === 'global' ? '/chat/global' : `/chat/dm/${active.id}`;
    try {
      await api(path, { method: 'POST', body: JSON.stringify({ body: text }) });
      await load(active);
      refresh();
    } catch (e) {
      setErr((e as Error).message);
      setDraft(text);
    }
  }

  async function saveEdit(id: string) {
    const text = editText.trim();
    if (!text) return;
    await api(`/chat/messages/${id}`, { method: 'PATCH', body: JSON.stringify({ body: text }) }).catch((e) =>
      setErr((e as Error).message),
    );
    setEditingId(null);
    setMenuId(null);
    if (active) await load(active);
  }

  async function del(id: string) {
    setMenuId(null);
    await api(`/chat/messages/${id}`, { method: 'DELETE' }).catch((e) => setErr((e as Error).message));
    if (active) await load(active);
  }

  const peerOnline =
    active?.kind === 'dm' ? contacts.find((c) => c.id === active.id)?.online ?? false : null;

  return (
    <div className={`chat ${active ? 'has-open' : ''}`}>
      {/* Conversation list */}
      <aside className="chat-list">
        <button className={`conv ${active?.kind === 'global' ? 'sel' : ''}`} onClick={() => open({ kind: 'global' })}>
          <span className="avatar avatar-fallback hash">#</span>
          <span className="conv-main">
            <span className="conv-name">Global chat</span>
            <span className="muted">Everyone</span>
          </span>
          {globalUnread > 0 && <span className="badge">{globalUnread}</span>}
        </button>

        <div className="list-label">Direct messages</div>
        {contacts.length === 0 && <p className="muted empty">No other users yet.</p>}
        {contacts.map((c: Contact) => (
          <button
            key={c.id}
            className={`conv ${active?.kind === 'dm' && active.id === c.id ? 'sel' : ''}`}
            onClick={() => open({ kind: 'dm', id: c.id, name: c.name })}
          >
            <Avatar name={c.name} picture={c.picture} online={c.online} />
            <span className="conv-main">
              <span className="conv-name">{c.name}</span>
              <span className="muted">{c.online ? 'online' : 'offline'}</span>
            </span>
            {c.unread > 0 && <span className="badge">{c.unread}</span>}
          </button>
        ))}
      </aside>

      {/* Thread */}
      <section className="chat-thread">
        {!active ? (
          <div className="thread-empty muted">Select a conversation</div>
        ) : (
          <>
            <header className="thread-head">
              <button className="back" onClick={() => setActive(null)} aria-label="Back">
                ‹
              </button>
              {active.kind === 'global' ? (
                <>
                  <span className="avatar avatar-fallback hash">#</span>
                  <span className="thread-title">Global chat</span>
                </>
              ) : (
                <>
                  <Avatar name={active.name} picture={null} online={peerOnline} />
                  <span className="thread-title">
                    {active.name}
                    <span className="muted thread-sub">{peerOnline ? 'online' : 'offline'}</span>
                  </span>
                </>
              )}
            </header>

            <div className="thread-body" ref={scrollRef} onScroll={onScroll}>
              {messages.length === 0 && <p className="muted empty">No messages yet. Say hi 👋</p>}
              {messages.map((m) => {
                const mine = m.sender_id === String(user?.id);
                return (
                  <div key={m.id} className={`msg ${mine ? 'mine' : ''}`}>
                    {active.kind === 'global' && !mine && !m.deleted && (
                      <span className="msg-author">{m.sender_name}</span>
                    )}
                    {editingId === m.id ? (
                      <div className="edit-row">
                        <input
                          value={editText}
                          autoFocus
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit(m.id)}
                        />
                        <button onClick={() => saveEdit(m.id)}>Save</button>
                        <button className="secondary" onClick={() => setEditingId(null)}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        className="bubble"
                        onClick={() => mine && !m.deleted && setMenuId(menuId === m.id ? null : m.id)}
                      >
                        {m.deleted ? (
                          <span className="deleted">message deleted</span>
                        ) : (
                          <span className="body">{m.body}</span>
                        )}
                        <span className="meta">
                          {timeOf(m.created_at)}
                          {m.edited_at && !m.deleted && ' · edited'}
                        </span>
                      </button>
                    )}
                    {mine && !m.deleted && menuId === m.id && editingId !== m.id && (
                      <div className="msg-actions">
                        <button
                          className="secondary"
                          onClick={() => {
                            setEditingId(m.id);
                            setEditText(m.body ?? '');
                          }}
                        >
                          Edit
                        </button>
                        <button className="danger" onClick={() => del(m.id)}>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="composer">
              <input
                placeholder="Message…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
              />
              <button onClick={send} disabled={!draft.trim()}>
                Send
              </button>
            </div>
          </>
        )}
      </section>
      {err && <p className="error chat-err">{err}</p>}
    </div>
  );
}
