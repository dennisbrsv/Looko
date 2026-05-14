import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Plus, GripVertical, Clock, StickyNote, BarChart3, Calendar } from 'lucide-react';

const WIDGETS_KEY = 'looko-home-widgets';
const NOTES_KEY = 'looko-quicknotes';

const AVAILABLE_WIDGETS = [
  { id: 'clock', label: 'Clock', icon: Clock },
  { id: 'notes', label: 'Quick Notes', icon: StickyNote },
  { id: 'stats', label: 'Search Stats', icon: BarChart3 },
  { id: 'calendar', label: 'Date', icon: Calendar },
];

function getActiveWidgets() {
  try {
    const stored = JSON.parse(localStorage.getItem(WIDGETS_KEY));
    if (Array.isArray(stored)) return stored;
  } catch {}
  return ['clock', 'notes']; // defaults
}
function saveActiveWidgets(ids) {
  try { localStorage.setItem(WIDGETS_KEY, JSON.stringify(ids)); } catch {}
}

// ── Clock Widget ──
function ClockWidgetContent() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const time = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const date = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  return (
    <div className="hw-clock">
      <div className="hw-clock-time">{time}</div>
      <div className="hw-clock-date">{date}</div>
    </div>
  );
}

// ── Quick Notes Widget ──
function NotesWidgetContent() {
  const [text, setText] = useState(() => {
    try { return localStorage.getItem(NOTES_KEY) || ''; } catch { return ''; }
  });
  const saveTimer = useRef(null);
  const handleChange = (e) => {
    setText(e.target.value);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try { localStorage.setItem(NOTES_KEY, e.target.value); } catch {}
    }, 400);
  };
  return (
    <textarea
      className="hw-notes-input"
      value={text}
      onChange={handleChange}
      placeholder="Type quick notes here…"
      spellCheck="false"
    />
  );
}

// ── Search Stats Widget ──
function StatsWidgetContent() {
  const [history, setHistory] = useState([]);
  useEffect(() => {
    try { setHistory(JSON.parse(localStorage.getItem('looko-history') || '[]')); } catch {}
  }, []);
  return (
    <div className="hw-stats">
      <div className="hw-stats-row">
        <span className="hw-stats-num">{history.length}</span>
        <span className="hw-stats-label">recent searches</span>
      </div>
      {history.length > 0 && (
        <div className="hw-stats-latest">
          Latest: <strong>{history[0]}</strong>
        </div>
      )}
    </div>
  );
}

// ── Calendar/Date Widget ──
function CalendarWidgetContent() {
  const now = new Date();
  const day = now.getDate();
  const month = now.toLocaleDateString(undefined, { month: 'long' });
  const year = now.getFullYear();
  const weekday = now.toLocaleDateString(undefined, { weekday: 'long' });
  return (
    <div className="hw-cal">
      <div className="hw-cal-day">{day}</div>
      <div className="hw-cal-details">
        <span className="hw-cal-month">{month} {year}</span>
        <span className="hw-cal-weekday">{weekday}</span>
      </div>
    </div>
  );
}

const WIDGET_CONTENT = {
  clock: ClockWidgetContent,
  notes: NotesWidgetContent,
  stats: StatsWidgetContent,
  calendar: CalendarWidgetContent,
};

// ── Draggable Widget Card ──
function WidgetCard({ id, label, editing, onRemove, onDragStart, onDragOver, onDrop, children }) {
  return (
    <div
      className={`hw-card${editing ? ' hw-card-editing' : ''}`}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      draggable={editing}
      onDragStart={(e) => onDragStart?.(e, id)}
      onDragOver={(e) => { e.preventDefault(); onDragOver?.(e, id); }}
      onDrop={(e) => onDrop?.(e, id)}
    >
      {editing && (
        <div className="hw-card-toolbar">
          <div className="hw-drag-handle">
            <GripVertical size={14} />
          </div>
          <span className="hw-card-label">{label}</span>
          <button className="hw-card-remove" onClick={() => onRemove(id)}>
            <X size={13} />
          </button>
        </div>
      )}
      <div className="hw-card-content">
        {children}
      </div>
    </div>
  );
}

// ── Main HomeWidgets ──
export function HomeWidgets() {
  const [activeIds, setActiveIds] = useState(() => getActiveWidgets());
  const [editing, setEditing] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const dragItem = useRef(null);

  const persist = useCallback((ids) => {
    setActiveIds(ids);
    saveActiveWidgets(ids);
  }, []);

  const removeWidget = useCallback((id) => {
    persist(activeIds.filter(w => w !== id));
  }, [activeIds, persist]);

  const addWidget = useCallback((id) => {
    if (!activeIds.includes(id)) {
      persist([...activeIds, id]);
    }
    setShowPicker(false);
  }, [activeIds, persist]);

  const handleDragStart = (e, id) => {
    dragItem.current = id;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, id) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    const fromId = dragItem.current;
    if (!fromId || fromId === targetId) return;
    const arr = [...activeIds];
    const fromIdx = arr.indexOf(fromId);
    const toIdx = arr.indexOf(targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    arr.splice(fromIdx, 1);
    arr.splice(toIdx, 0, fromId);
    persist(arr);
    dragItem.current = null;
  };

  const available = AVAILABLE_WIDGETS.filter(w => !activeIds.includes(w.id));

  if (activeIds.length === 0 && !editing) {
    return (
      <div
        className="hw-empty"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <button className="hw-add-first" onClick={() => { setEditing(true); setShowPicker(true); }}>
          <Plus size={15} />
          <span>Add widgets</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className="hw-wrap"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="hw-row">
          {activeIds.map(id => {
            const def = AVAILABLE_WIDGETS.find(w => w.id === id);
            const Content = WIDGET_CONTENT[id];
            if (!def || !Content) return null;
            return (
              <WidgetCard
                key={id}
                id={id}
                label={def.label}
                editing={editing}
                onRemove={removeWidget}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <Content />
              </WidgetCard>
            );
          })}
      </div>

      <div className="hw-controls">
        <button
          className={`hw-edit-btn${editing ? ' hw-edit-btn-active' : ''}`}
          onClick={() => { setEditing(!editing); setShowPicker(false); }}
        >
          {editing ? 'Done' : 'Customize'}
        </button>

        {editing && available.length > 0 && (
          <div className="hw-picker-wrap">
            <button
              className="hw-add-btn"
              onClick={() => setShowPicker(!showPicker)}
            >
              <Plus size={14} />
              <span>Add widget</span>
            </button>
              {showPicker && (
                <div
                  className="hw-picker"
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                >
                  {available.map(w => (
                    <button key={w.id} className="hw-picker-item" onClick={() => addWidget(w.id)}>
                      <w.icon size={15} />
                      <span>{w.label}</span>
                    </button>
                  ))}
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
