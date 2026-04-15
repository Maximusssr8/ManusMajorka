/**
 * /app/lists — user's named product collections (Engagement Director).
 * Grid of lists (emoji, name, count, 4-thumb preview). Click → filtered grid.
 */
import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Plus, Trash2, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { proxyImage } from '@/lib/imageProxy';

interface ProductList {
  id: string;
  name: string;
  emoji: string;
  created_at: string;
  item_count: number;
  thumbnails: string[];
}

interface ListItem {
  id: string;
  product_id: string;
  product_data: Record<string, unknown>;
  saved_at: string;
}

const EMOJIS = ['📦', '🔥', '⭐', '💡', '🎯', '🏆', '💰', '🚀'];

export default function Lists() {
  const [, setLocation] = useLocation();
  const [lists, setLists] = useState<ProductList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState<string>('📦');
  const [selected, setSelected] = useState<ProductList | null>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<ProductList | null>(null);

  const loadLists = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/lists');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { success: boolean; data: ProductList[] };
      setLists(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lists');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLists();
  }, [loadLists]);

  const openList = useCallback(async (list: ProductList) => {
    setSelected(list);
    try {
      const res = await apiFetch(`/api/lists/${list.id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as {
        success: boolean;
        data: { list: ProductList; items: ListItem[] };
      };
      setItems(json.data.items ?? []);
    } catch {
      setItems([]);
    }
  }, []);

  const handleCreate = useCallback(async () => {
    const name = newName.trim();
    if (!name) return;
    const res = await apiFetch('/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, emoji: newEmoji }),
    });
    if (res.ok) {
      setCreating(false);
      setNewName('');
      setNewEmoji('📦');
      void loadLists();
    }
  }, [newName, newEmoji, loadLists]);

  const handleDelete = useCallback(
    async (list: ProductList) => {
      const res = await apiFetch(`/api/lists/${list.id}`, { method: 'DELETE' });
      if (res.ok) {
        setConfirmDelete(null);
        setSelected(null);
        void loadLists();
      }
    },
    [loadLists],
  );

  return (
    <div style={{ padding: '32px 24px', minHeight: '100vh', background: '#080808' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: '#f5f5f5', margin: 0 }}>
              My Lists
            </h1>
            <p style={{ color: '#9a9a9a', fontSize: 14, margin: '6px 0 0 0' }}>
              Named collections of saved products. Organise wins by theme.
            </p>
          </div>
          <button
            onClick={() => setCreating(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              background: '#d4af37',
              color: '#080808',
              border: 'none',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              minHeight: 44,
            }}
          >
            <Plus size={16} /> New list
          </button>
        </div>

        {loading ? (
          <div style={{ color: '#6b6b6b', padding: 32 }}>Loading…</div>
        ) : error ? (
          <div style={{ color: '#f97316', padding: 16 }}>Failed to load lists: {error}</div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 16,
            }}
          >
            {lists.length === 0 ? (
              <div
                style={{
                  gridColumn: '1 / -1',
                  padding: 48,
                  textAlign: 'center',
                  color: '#6b6b6b',
                  background: '#111',
                  border: '1px dashed #1f1f1f',
                  borderRadius: 12,
                }}
              >
                No lists yet. Save a product from the Products page to get started.
              </div>
            ) : (
              lists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => openList(list)}
                  style={{
                    textAlign: 'left',
                    background: '#111',
                    border: '1px solid #1f1f1f',
                    borderRadius: 14,
                    padding: 16,
                    cursor: 'pointer',
                    color: '#f5f5f5',
                    transition: 'border-color 160ms',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1f1f1f')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 22 }}>{list.emoji || '📦'}</span>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{list.name}</span>
                    </div>
                    <span style={{ color: '#9a9a9a', fontSize: 12 }}>{list.item_count}</span>
                  </div>
                  <div
                    style={{
                      marginTop: 12,
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: 6,
                    }}
                  >
                    {Array.from({ length: 4 }).map((_, i) => {
                      const t = list.thumbnails[i];
                      return t ? (
                        <img
                          key={i}
                          src={proxyImage(t) ?? ''}
                          alt=""
                          style={{
                            width: '100%',
                            aspectRatio: '1',
                            borderRadius: 6,
                            objectFit: 'cover',
                            background: '#0a0a0a',
                          }}
                        />
                      ) : (
                        <div
                          key={i}
                          style={{
                            width: '100%',
                            aspectRatio: '1',
                            borderRadius: 6,
                            background: '#0a0a0a',
                            border: '1px solid #141414',
                          }}
                        />
                      );
                    })}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Create-list modal */}
      {creating && (
        <Modal onClose={() => setCreating(false)}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: '#f5f5f5', margin: '0 0 16px 0' }}>
            New list
          </h2>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Q2 Winter Picks"
            style={{
              width: '100%',
              padding: '12px 14px',
              fontSize: 16, // >=16px to avoid iOS zoom
              background: '#0a0a0a',
              border: '1px solid #1f1f1f',
              borderRadius: 8,
              color: '#f5f5f5',
              outline: 'none',
              marginBottom: 16,
            }}
            autoFocus
          />
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setNewEmoji(e)}
                style={{
                  width: 44,
                  height: 44,
                  minWidth: 44,
                  fontSize: 20,
                  background: newEmoji === e ? 'rgba(212,175,55,0.15)' : '#0a0a0a',
                  border: `1px solid ${newEmoji === e ? '#d4af37' : '#1f1f1f'}`,
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                {e}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={() => setCreating(false)}
              style={{
                padding: '10px 16px',
                background: 'transparent',
                color: '#9a9a9a',
                border: '1px solid #1f1f1f',
                borderRadius: 8,
                cursor: 'pointer',
                minHeight: 44,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              style={{
                padding: '10px 16px',
                background: '#d4af37',
                color: '#080808',
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                cursor: newName.trim() ? 'pointer' : 'not-allowed',
                opacity: newName.trim() ? 1 : 0.5,
                minHeight: 44,
              }}
            >
              Create list
            </button>
          </div>
        </Modal>
      )}

      {/* List detail */}
      {selected && (
        <Modal onClose={() => setSelected(null)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}>{selected.emoji || '📦'}</span>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: '#f5f5f5', margin: 0 }}>
                {selected.name}
              </h2>
            </div>
            <button
              onClick={() => setConfirmDelete(selected)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                background: 'transparent',
                color: '#f97316',
                border: '1px solid rgba(249,115,22,0.25)',
                borderRadius: 8,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              <Trash2 size={13} /> Delete list
            </button>
          </div>
          <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            {items.length === 0 ? (
              <div style={{ color: '#6b6b6b', padding: 24, textAlign: 'center' }}>
                This list is empty.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                {items.map((item) => {
                  const pd = item.product_data ?? {};
                  const img = (pd.image_url as string | undefined) ?? null;
                  const title = (pd.product_title as string | undefined) ?? (pd.title as string | undefined) ?? 'Untitled';
                  const price = pd.price_aud as number | undefined;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setLocation(`/app/products/${item.product_id}`)}
                      style={{
                        textAlign: 'left',
                        background: '#0a0a0a',
                        border: '1px solid #1f1f1f',
                        borderRadius: 10,
                        padding: 8,
                        cursor: 'pointer',
                        color: '#f5f5f5',
                      }}
                    >
                      {img ? (
                        <img
                          src={proxyImage(img) ?? ''}
                          alt=""
                          style={{ width: '100%', aspectRatio: '1', borderRadius: 6, objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '100%', aspectRatio: '1', borderRadius: 6, background: '#111' }} />
                      )}
                      <div style={{ fontSize: 12, fontWeight: 600, margin: '8px 0 4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {title}
                      </div>
                      {price != null && (
                        <div style={{ color: '#d4af37', fontSize: 12, fontWeight: 700 }}>
                          ${Number(price).toFixed(2)}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <Modal onClose={() => setConfirmDelete(null)}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: '#f5f5f5', margin: '0 0 12px 0' }}>
            Delete "{confirmDelete.name}"?
          </h2>
          <p style={{ color: '#9a9a9a', fontSize: 14, margin: '0 0 20px 0' }}>
            This removes the list and all {confirmDelete.item_count} saved products in it. Can't be undone.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={() => setConfirmDelete(null)}
              style={{
                padding: '10px 16px',
                background: 'transparent',
                color: '#9a9a9a',
                border: '1px solid #1f1f1f',
                borderRadius: 8,
                cursor: 'pointer',
                minHeight: 44,
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => void handleDelete(confirmDelete)}
              style={{
                padding: '10px 16px',
                background: '#f97316',
                color: '#080808',
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                cursor: 'pointer',
                minHeight: 44,
              }}
            >
              Delete list
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#111',
          border: '1px solid #1f1f1f',
          borderRadius: 14,
          padding: 24,
          maxWidth: 720,
          width: '100%',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 44,
            height: 44,
            minWidth: 44,
            minHeight: 44,
            background: 'transparent',
            border: 'none',
            color: '#9a9a9a',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  );
}
