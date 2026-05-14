import React, { useState, useRef } from 'react';
import { Plus, X, Pencil } from 'lucide-react';

const STORAGE_KEY = 'looko-quicklinks';
const MAX_LINKS = 12;

// Deterministic color from string
function linkColor(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return `hsl(${Math.abs(h) % 360}, 50%, 55%)`;
}

function faviconUrl(url) {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return null;
  }
}

export function getQuickLinks() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

export function saveQuickLinks(links) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(links.slice(0, MAX_LINKS))); } catch {}
}

export function QuickLinks({ onNavigate }) {
  const [links, setLinks] = useState(() => getQuickLinks());
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [editIdx, setEditIdx] = useState(-1);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const persist = (updated) => {
    setLinks(updated);
    saveQuickLinks(updated);
  };

  const handleAdd = () => {
    if (!newName.trim() || !newUrl.trim()) return;
    let url = newUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    persist([...links, { name: newName.trim(), url }]);
    setNewName('');
    setNewUrl('');
    setAdding(false);
  };

  const handleDelete = (idx) => {
    persist(links.filter((_, i) => i !== idx));
  };

  const handleEditSave = () => {
    if (editIdx < 0 || !editName.trim() || !editUrl.trim()) return;
    let url = editUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    const updated = [...links];
    updated[editIdx] = { name: editName.trim(), url };
    persist(updated);
    setEditIdx(-1);
  };

  const startEdit = (idx) => {
    setEditIdx(idx);
    setEditName(links[idx].name);
    setEditUrl(links[idx].url);
  };

  const handleDragStart = (idx) => {
    dragItem.current = idx;
  };

  const handleDragEnter = (idx) => {
    dragOverItem.current = idx;
  };

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) { dragItem.current = null; dragOverItem.current = null; return; }
    const arr = [...links];
    const item = arr.splice(dragItem.current, 1)[0];
    arr.splice(dragOverItem.current, 0, item);
    persist(arr);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  if (links.length === 0 && !adding) {
    return (
      <div
        className="ql-empty"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.3 }}
      >
        <button className="ql-add-first" onClick={() => setAdding(true)}>
          <Plus size={16} />
          <span>Add a shortcut</span>
        </button>

          {adding && (
            <div
              className="ql-add-form"
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <input
                className="ql-input"
                type="text"
                placeholder="Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                autoFocus
              />
              <input
                className="ql-input"
                type="text"
                placeholder="URL"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <div className="ql-add-actions">
                <button className="ql-btn ql-btn-primary" onClick={handleAdd}>Add</button>
                <button className="ql-btn" onClick={() => { setAdding(false); setNewName(''); setNewUrl(''); }}>Cancel</button>
              </div>
            </div>
          )}
      </div>
    );
  }

  return (
    <div
      className="ql-wrap"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="ql-grid">
          {links.map((link, idx) => (
            <div
              key={link.url + idx}
              className="ql-item-wrap"
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.2 }}
              draggable={editing}
              onDragStart={() => handleDragStart(idx)}
              onDragEnter={() => handleDragEnter(idx)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
            >
              {editIdx === idx ? (
                <div className="ql-edit-inline">
                  <input
                    className="ql-input ql-input-sm"
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleEditSave()}
                    autoFocus
                  />
                  <input
                    className="ql-input ql-input-sm"
                    type="text"
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleEditSave()}
                  />
                  <div className="ql-edit-actions">
                    <button className="ql-btn ql-btn-sm ql-btn-primary" onClick={handleEditSave}>Save</button>
                    <button className="ql-btn ql-btn-sm" onClick={() => setEditIdx(-1)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <a
                  href={link.url}
                  className="ql-item"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={editing ? (e) => { e.preventDefault(); startEdit(idx); } : undefined}
                >
                  <div className="ql-icon-wrap">
                    <img
                      src={faviconUrl(link.url)}
                      alt=""
                      className="ql-icon"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="ql-icon-fallback" style={{ background: linkColor(link.url), display: 'none' }}>
                      {link.name[0]?.toUpperCase() || '?'}
                    </div>
                  </div>
                  <span className="ql-name">{link.name}</span>
                  {editing && (
                    <button
                      className="ql-delete"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(idx); }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </a>
              )}
            </div>
          ))}

        {/* Add button tile */}
        {links.length < MAX_LINKS && (
          <div className="ql-item-wrap">
            {adding ? (
              <div
                className="ql-add-form ql-add-form-tile"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15 }}
              >
                <input
                  className="ql-input ql-input-sm"
                  type="text"
                  placeholder="Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  autoFocus
                />
                <input
                  className="ql-input ql-input-sm"
                  type="text"
                  placeholder="URL"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
                <div className="ql-edit-actions">
                  <button className="ql-btn ql-btn-sm ql-btn-primary" onClick={handleAdd}>Add</button>
                  <button className="ql-btn ql-btn-sm" onClick={() => { setAdding(false); setNewName(''); setNewUrl(''); }}>Cancel</button>
                </div>
              </div>
            ) : (
              <button className="ql-item ql-item-add" onClick={() => setAdding(true)}>
                <div className="ql-icon-wrap ql-icon-add">
                  <Plus size={18} />
                </div>
                <span className="ql-name">Add</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Edit toggle */}
      {links.length > 0 && (
        <button
          className={`ql-edit-toggle${editing ? ' ql-edit-toggle-active' : ''}`}
          onClick={() => { setEditing(!editing); setEditIdx(-1); }}
        >
          <Pencil size={13} />
          <span>{editing ? 'Done' : 'Edit shortcuts'}</span>
        </button>
      )}
    </div>
  );
}
