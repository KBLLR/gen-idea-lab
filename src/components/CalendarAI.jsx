/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import useStore from '../lib/store';
import '../styles/components/calendar-ai.css';

const CalendarAI = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [imageFit, setImageFit] = useState('contain'); // 'contain' or 'cover'
  const [gridMode, setGridMode] = useState('single'); // 'single' or 'multi'

  const fileInputRef = useRef(null);
  const icsInputRef = useRef(null);
  const jsonInputRef = useRef(null);

  const isCalendarConnected = useStore(useCallback(
    (state) => state.connectedServices?.googleCalendar?.connected,
    []
  ));

  // Load events from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('calendarai.events.v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        setEvents(parsed);
      }

      const storedFit = localStorage.getItem('calendarai.prefs.fit');
      if (storedFit) setImageFit(storedFit);
    } catch (err) {
      console.error('Failed to load CalendarAI data:', err);
    }
  }, []);

  // Update grid mode based on event count
  useEffect(() => {
    setGridMode(events.length <= 1 ? 'single' : 'multi');
  }, [events.length]);

  // Save events to localStorage
  const saveEvents = useCallback((newEvents) => {
    try {
      localStorage.setItem('calendarai.events.v1', JSON.stringify(newEvents));
      setEvents(newEvents);
    } catch (err) {
      console.error('Failed to save events:', err);
    }
  }, []);

  // Fetch events from Google Calendar if connected
  const fetchGoogleCalendarEvents = useCallback(async () => {
    if (!isCalendarConnected) return;

    try {
      console.log('[CalendarAI] Fetching Google Calendar events...');

      const response = await fetch('/api/services/googleCalendar/events?maxResults=50', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch calendar events');
      }

      const data = await response.json();
      const calendarEvents = data.events || [];

      // Convert Google Calendar events to CalendarAI format
      const formattedEvents = calendarEvents.map(event => ({
        id: event.id,
        title: event.summary,
        where: event.location || '',
        when: event.start,
        description: event.description || '',
        image: '', // Google Calendar events don't have images by default
        source: 'google-calendar',
        htmlLink: event.htmlLink,
        organizer: event.organizer,
        attendees: event.attendees || [],
      }));

      // Merge with existing local events (keep non-Google events)
      const localEvents = events.filter(e => e.source !== 'google-calendar');
      saveEvents([...localEvents, ...formattedEvents]);

      console.log(`[CalendarAI] Fetched ${formattedEvents.length} events from Google Calendar`);
    } catch (err) {
      console.error('Failed to fetch Google Calendar events:', err);
    }
  }, [isCalendarConnected, events, saveEvents]);

  useEffect(() => {
    if (isCalendarConnected) {
      fetchGoogleCalendarEvents();
    }
  }, [isCalendarConnected, fetchGoogleCalendarEvents]);

  // Create or update event
  const saveEvent = useCallback((eventData) => {
    if (editingEvent) {
      // Update existing
      const updated = events.map(e =>
        e.id === editingEvent.id ? { ...e, ...eventData } : e
      );
      saveEvents(updated);
    } else {
      // Create new
      const newEvent = {
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        ...eventData,
        createdAt: new Date().toISOString()
      };
      saveEvents([...events, newEvent]);
    }
    setShowEventModal(false);
    setEditingEvent(null);
  }, [events, editingEvent, saveEvents]);

  // Delete event
  const deleteEvent = useCallback((eventId) => {
    const updated = events.filter(e => e.id !== eventId);
    saveEvents(updated);
    setSelectedEvent(null);
    setEditingEvent(null);
    setShowEventModal(false);
  }, [events, saveEvents]);

  // Import from .ics file
  const handleIcsImport = useCallback(async (file) => {
    try {
      const text = await file.text();
      const imported = parseICS(text);
      const newEvents = imported.map(evt => ({
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: evt.name || 'Imported Event',
        when: evt.when,
        where: evt.where || '',
        src: null,
        createdAt: new Date().toISOString()
      }));
      saveEvents([...events, ...newEvents]);
    } catch (err) {
      console.error('Failed to import .ics:', err);
      alert('Failed to import calendar file');
    }
  }, [events, saveEvents]);

  // Export event as .ics
  const exportAsICS = useCallback((event) => {
    if (!event.when) return;

    const dt = new Date(event.when);
    const dtEnd = new Date(dt.getTime() + 3600000); // +1 hour

    const toICS = (d) => {
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
    };

    const esc = (s) => String(s || '').replace(/([,;])/g, ' ').replace(/\n/g, ' ');

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CalendarAI//GenBooth//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${event.id}@calendagai`,
      `DTSTAMP:${toICS(new Date())}`,
      `DTSTART:${toICS(dt)}`,
      `DTEND:${toICS(dtEnd)}`,
      `SUMMARY:${esc(event.name)}`,
      `LOCATION:${esc(event.where)}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.name || 'event'}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, []);

  // Export all data as JSON
  const exportJSON = useCallback(() => {
    const data = { events, prefs: { fit: imageFit } };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'calendarai_backup.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [events, imageFit]);

  // Import from JSON
  const importJSON = useCallback(async (file) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.events && Array.isArray(data.events)) {
        saveEvents(data.events);
      }
      if (data.prefs?.fit) {
        setImageFit(data.prefs.fit);
        localStorage.setItem('calendarai.prefs.fit', data.prefs.fit);
      }
      setShowSettings(false);
    } catch (err) {
      console.error('Failed to import JSON:', err);
      alert('Import failed: invalid JSON');
    }
  }, [saveEvents]);

  // Reset all data
  const resetAll = useCallback(() => {
    if (!confirm('This will remove all events and preferences. Continue?')) return;
    localStorage.removeItem('calendarai.events.v1');
    localStorage.removeItem('calendarai.prefs.fit');
    setEvents([]);
    setImageFit('contain');
    setShowSettings(false);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't interfere with typing
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // ? - Toggle help
      if (e.key === '?') {
        setShowHelp(h => !h);
        e.preventDefault();
      }

      // N - New event
      if (e.key === 'n' || e.key === 'N') {
        setEditingEvent(null);
        setShowEventModal(true);
        e.preventDefault();
      }

      // I - Import .ics
      if (e.key === 'i' || e.key === 'I') {
        icsInputRef.current?.click();
        e.preventDefault();
      }

      // Cmd/Ctrl+, - Settings
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        setShowSettings(true);
        e.preventDefault();
      }

      // Escape - Close modals
      if (e.key === 'Escape') {
        setShowHelp(false);
        setShowSettings(false);
        setShowEventModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="calendar-ai">
      {/* Top toolbar */}
      <div className="calendar-ai-topbar">
        <button
          className="icon-btn"
          onClick={() => icsInputRef.current?.click()}
          data-tip="Import from Calendar (.ics)"
        >
          <svg viewBox="0 0 24 24">
            <path d="M20 16.5a3.5 3.5 0 0 0-1-6.9 5 5 0 0 0-9.7-1.7A4 4 0 0 0 4 11.5a4 4 0 0 0 1 7.9h12"/>
          </svg>
        </button>
        <button
          className="icon-btn"
          onClick={() => setShowHelp(true)}
          data-tip="Shortcuts (?)"
        >
          <svg viewBox="0 0 24 24">
            <path d="M9 9a3 3 0 1 1 3 3v2M12 17h.01"/>
          </svg>
        </button>
        <button
          className="icon-btn"
          onClick={() => {
            setEditingEvent(null);
            setShowEventModal(true);
          }}
          data-tip="New Event (N)"
        >
          <svg viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </button>
        {isCalendarConnected && (
          <button
            className="icon-btn"
            onClick={fetchGoogleCalendarEvents}
            data-tip="Sync Google Calendar"
          >
            <svg viewBox="0 0 24 24">
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
            </svg>
          </button>
        )}
      </div>

      {/* Event grid */}
      <main className={`calendar-ai-grid ${gridMode}`}>
        {events.length === 0 && (
          <div className="empty-state">
            <p>
              Create your first event (it will fill the screen). Add more and the grid will auto-fit each image.
              <br />
              Press <kbd>N</kbd> or click <kbd>New Event</kbd>. Press <kbd>?</kbd> for keyboard help.
              {!isCalendarConnected && (
                <>
                  <br /><br />
                  Connect Google Calendar in Settings to import your events automatically.
                </>
              )}
            </p>
          </div>
        )}

        {events.map(event => (
          <EventCard
            key={event.id}
            event={event}
            imageFit={imageFit}
            onEdit={() => {
              setEditingEvent(event);
              setShowEventModal(true);
            }}
            onExport={() => exportAsICS(event)}
            onSelect={() => setSelectedEvent(event)}
            isSelected={selectedEvent?.id === event.id}
          />
        ))}
      </main>

      {/* Settings FAB */}
      <div className="calendar-ai-fab">
        <button
          className="icon-btn"
          onClick={() => setShowSettings(true)}
          data-tip="Settings (⌘,)"
        >
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 3v2M12 19v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M3 12h2M19 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
        </button>
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <EventModal
          event={editingEvent}
          onSave={saveEvent}
          onDelete={deleteEvent}
          onClose={() => {
            setShowEventModal(false);
            setEditingEvent(null);
          }}
          fileInputRef={fileInputRef}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          imageFit={imageFit}
          onImageFitChange={(fit) => {
            setImageFit(fit);
            localStorage.setItem('calendarai.prefs.fit', fit);
          }}
          onExportJSON={exportJSON}
          onImportJSON={() => jsonInputRef.current?.click()}
          onReset={resetAll}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Help Modal */}
      {showHelp && (
        <HelpModal onClose={() => setShowHelp(false)} />
      )}

      {/* Hidden file inputs */}
      <input
        ref={icsInputRef}
        type="file"
        accept=".ics,text/calendar"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleIcsImport(file);
          e.target.value = '';
        }}
      />
      <input
        ref={jsonInputRef}
        type="file"
        accept="application/json"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) importJSON(file);
          e.target.value = '';
        }}
      />
    </div>
  );
};

// Event Card Component
const EventCard = ({ event, imageFit, onEdit, onExport, onSelect, isSelected }) => {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const updateCountdown = () => {
      if (!event.when) return;

      const target = new Date(event.when).getTime();
      const now = Date.now();
      const diff = Math.max(0, target - now);

      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [event.when]);

  const getImageSrc = () => {
    if (event.src) return event.src;
    // Generate gradient based on event name
    const hue = Math.abs(hashCode(event.name || 'event')) % 360;
    const color = `hsl(${hue}, 40%, 22%)`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop offset='0%' stop-color='${color}'/><stop offset='100%' stop-color='#0a0d14'/></linearGradient></defs><rect width='100%' height='100%' fill='url(#g)'/></svg>`
    )}`;
  };

  return (
    <article
      className={`event-card ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
      onDoubleClick={onEdit}
      tabIndex={0}
      style={{ '--fit': imageFit }}
    >
      <div className="media">
        <img src={getImageSrc()} alt={event.name || 'Event'} />
        <div className="vignette" />
      </div>

      <div className="meta">
        <div className="title">{event.name || 'Untitled Event'}</div>
        {event.where && <div className="where">{event.where}</div>}
      </div>

      <div className="countdown">
        <CountdownPart label="Days" value={countdown.days} />
        <span className="dot">:</span>
        <CountdownPart label="Hours" value={String(countdown.hours).padStart(2, '0')} />
        <span className="dot">:</span>
        <CountdownPart label="Minutes" value={String(countdown.minutes).padStart(2, '0')} />
        <span className="dot">:</span>
        <CountdownPart label="Seconds" value={String(countdown.seconds).padStart(2, '0')} />
      </div>

      <div className="card-actions">
        <button className="mini" onClick={(e) => { e.stopPropagation(); onEdit(); }} data-tip="Edit">
          <svg viewBox="0 0 24 24">
            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>
          </svg>
        </button>
        <button className="mini" onClick={(e) => { e.stopPropagation(); onExport(); }} data-tip="Save to Calendar">
          <svg viewBox="0 0 24 24">
            <path d="M8 2v4M16 2v4M4 10h16M6 6h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/>
          </svg>
        </button>
      </div>
    </article>
  );
};

const CountdownPart = ({ label, value }) => (
  <div className="cd-part">
    <div className="cd-num">{value}</div>
    <div className="cd-lbl">{label}</div>
  </div>
);

// Event Modal Component
const EventModal = ({ event, onSave, onDelete, onClose, fileInputRef }) => {
  const [name, setName] = useState(event?.name || '');
  const [when, setWhen] = useState(event?.when ? new Date(event.when).toISOString().slice(0, 16) : '');
  const [where, setWhere] = useState(event?.where || '');
  const [imageFile, setImageFile] = useState(null);

  const isValid = name.trim() && when;

  const handleSubmit = async () => {
    if (!isValid) return;

    let src = event?.src || null;
    if (imageFile) {
      src = await readFileAsDataURL(imageFile);
    }

    onSave({
      name: name.trim(),
      when: new Date(when).toISOString(),
      where: where.trim(),
      src
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [name, when, where, imageFile]);

  return (
    <div className="modal show" onClick={(e) => e.target.className.includes('modal') && onClose()}>
      <div className="card">
        <h2>{event ? 'Edit Event' : 'Create Event'}</h2>

        <div className="row">
          <label>Event name</label>
          <input
            type="text"
            placeholder="e.g., CODE Demo Day"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div className="grid2">
          <div className="row">
            <label>Date & time</label>
            <input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
            />
          </div>
          <div className="row">
            <label>Location</label>
            <input
              type="text"
              placeholder="e.g., Berlin, Germany"
              value={where}
              onChange={(e) => setWhere(e.target.value)}
            />
          </div>
        </div>

        <div className="row">
          <label>Background image (optional)</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          />
        </div>

        <div className="actions">
          {event && (
            <button className="btn danger" onClick={() => onDelete(event.id)}>
              Delete
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={!isValid} onClick={handleSubmit}>
            {event ? 'Update' : 'Save'}
          </button>
        </div>

        <div style={{ marginTop: '6px', color: 'var(--muted)', fontSize: '12px' }}>
          Tip: <kbd>Cmd/Ctrl + Enter</kbd> to save
        </div>
      </div>
    </div>
  );
};

// Settings Modal Component
const SettingsModal = ({ imageFit, onImageFitChange, onExportJSON, onImportJSON, onReset, onClose }) => (
  <div className="modal show" onClick={(e) => e.target.className.includes('modal') && onClose()}>
    <div className="card">
      <h2>Settings</h2>

      <div className="row">
        <label>Image fit</label>
        <div className="seg">
          <button
            className={imageFit !== 'cover' ? 'active' : ''}
            onClick={() => onImageFitChange('contain')}
          >
            Contain
          </button>
          <button
            className={imageFit === 'cover' ? 'active' : ''}
            onClick={() => onImageFitChange('cover')}
          >
            Fill
          </button>
        </div>
      </div>

      <div className="row" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button className="btn" onClick={onExportJSON}>Export JSON</button>
        <button className="btn" onClick={onImportJSON}>Import JSON</button>
        <div style={{ flex: 1 }} />
        <button className="btn danger" onClick={onReset}>Reset All</button>
      </div>

      <div className="actions">
        <div style={{ flex: 1 }} />
        <button className="btn" onClick={onClose}>Close</button>
      </div>

      <div style={{ marginTop: '6px', color: 'var(--muted)', fontSize: '12px' }}>
        Shortcut: <kbd>Cmd/Ctrl + ,</kbd> opens Settings
      </div>
    </div>
  </div>
);

// Help Modal Component
const HelpModal = ({ onClose }) => (
  <div id="help" className="show" onClick={(e) => e.target.id === 'help' && onClose()}>
    <div className="panel">
      <h3>Keyboard Shortcuts</h3>
      <div className="grid">
        <div>
          <div className="row"><span>New event</span><kbd>N</kbd></div>
          <div className="row"><span>Import .ics</span><kbd>I</kbd></div>
          <div className="row"><span>Edit selected</span><kbd>E</kbd></div>
        </div>
        <div>
          <div className="row"><span>Open Settings</span><kbd>Cmd/Ctrl + ,</kbd></div>
          <div className="row"><span>Save in dialog</span><kbd>Cmd/Ctrl + Enter</kbd></div>
          <div className="row"><span>Help</span><kbd>?</kbd></div>
        </div>
      </div>
    </div>
  </div>
);

// Helper functions
const hashCode = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
};

const readFileAsDataURL = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = reject;
  reader.onload = () => resolve(reader.result);
  reader.readAsDataURL(file);
});

const parseICS = (text) => {
  const lines = text.split(/\r?\n/);
  const events = [];
  let current = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === 'BEGIN:VEVENT') {
      current = {};
    } else if (trimmed === 'END:VEVENT' && current) {
      events.push(current);
      current = null;
    } else if (current) {
      const idx = trimmed.indexOf(':');
      if (idx < 0) continue;

      const rawKey = trimmed.slice(0, idx);
      const value = trimmed.slice(idx + 1);
      const key = rawKey.split(';')[0].toUpperCase();

      if (key === 'SUMMARY') current.name = value;
      if (key === 'LOCATION') current.where = value;
      if (key === 'DTSTART') current.when = icsToLocal(value);
    }
  }

  return events;
};

const icsToLocal = (value) => {
  if (!value) return '';

  const isUTC = value.endsWith('Z');
  const core = value.replace('Z', '');

  const y = parseInt(core.slice(0, 4));
  const m = parseInt(core.slice(4, 6)) - 1;
  const d = parseInt(core.slice(6, 8));
  const H = parseInt(core.slice(9, 11)) || 0;
  const M = parseInt(core.slice(11, 13)) || 0;
  const S = parseInt(core.slice(13, 15)) || 0;

  const dt = isUTC
    ? new Date(Date.UTC(y, m, d, H, M, S))
    : new Date(y, m, d, H, M, S);

  return dt.toISOString();
};

export default CalendarAI;
