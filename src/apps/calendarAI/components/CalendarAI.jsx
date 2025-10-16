/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import useStore from '@store';
import BoothHeader from '@components/ui/organisms/BoothHeader.jsx';
import { ActionBar } from '@ui';
import CalendarRightPane from './CalendarRightPane.jsx';
import { useRightPane } from '@shared/lib/layoutSlots';
import '../styles/calendar-ai.css';
import AppHomeBlock from '@components/ui/organisms/AppHomeBlock.jsx';
import { appHomeContent } from '@components/ui/organisms/appHomeContent.js';

const CalendarAI = () => {
  // Use Zustand store for persistent data
  const events = useStore.use.calendarAI()?.events || [];
  const imageFit = useStore.use.calendarAI()?.preferences?.imageFit || 'contain';
  const storeFilterDate = useStore.use.calendarAI()?.ui?.filterDate || null;
  const storeNewEventDate = useStore.use.calendarAI()?.ui?.newEventDate || '';

  // Local UI state (not persisted)
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [gridMode, setGridMode] = useState('single'); // 'single' or 'multi'
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [dayFilter, setDayFilter] = useState(storeFilterDate);
  const [calendarPopover, setCalendarPopover] = useState({ open: false, x: 0, y: 0, date: null });
  const [newEventDefaultWhen, setNewEventDefaultWhen] = useState(storeNewEventDate);
  const [showDataPane, setShowDataPane] = useState(false);
  const { setRightPane, clearRightPane } = useRightPane();

  const fileInputRef = useRef(null);
  const icsInputRef = useRef(null);
  const jsonInputRef = useRef(null);

  const isCalendarConnected = useStore(useCallback(
    (state) => state.connectedServices?.googleCalendar?.connected,
    []
  ));
  const connectService = useStore((state) => state.actions.connectService);
  const isDriveConnected = useStore(useCallback((s) => s.connectedServices?.googleDrive?.connected, []));
  const isPhotosConnected = useStore(useCallback((s) => s.connectedServices?.googlePhotos?.connected, []));
  const isGmailConnected = useStore(useCallback((s) => s.connectedServices?.gmail?.connected, []));
  const fetchGooglePhotosAlbums = useStore((s) => s.actions?.fetchGooglePhotosAlbums);
  const fetchGoogleDriveFiles = useStore((s) => s.actions?.fetchGoogleDriveFiles);
  const fetchGmailMessages = useStore((s) => s.actions?.fetchGmailMessages);

  // One-time migration from localStorage to Zustand (runs once per user)
  useEffect(() => {
    const migrateFromLocalStorage = () => {
      try {
        // Check if migration already happened (if store has data, skip)
        if (events.length > 0) {
          console.log('[CalendarAI] Store already has events, skipping migration');
          return;
        }

        const storedEvents = localStorage.getItem('calendarai.events.v1');
        const storedFit = localStorage.getItem('calendarai.prefs.fit');
        const storedFilterDate = localStorage.getItem('calendarai.ui.filterDate');
        const storedNewEventDate = localStorage.getItem('calendarai.ui.newEventDate');

        if (storedEvents || storedFit || storedFilterDate || storedNewEventDate) {
          console.log('[CalendarAI] Migrating from localStorage to Zustand...');

          useStore.setState((state) => {
            // Migrate events
            if (storedEvents) {
              try {
                const parsed = JSON.parse(storedEvents);
                if (Array.isArray(parsed)) {
                  state.calendarAI.events = parsed;
                  console.log(`[CalendarAI] Migrated ${parsed.length} events`);
                }
              } catch (parseErr) {
                console.warn('[CalendarAI] Corrupted events data, skipping migration');
              }
            }

            // Migrate preferences
            if (storedFit) {
              state.calendarAI.preferences.imageFit = storedFit;
            }

            // Migrate UI state
            if (storedFilterDate) {
              state.calendarAI.ui.filterDate = storedFilterDate;
              setDayFilter(storedFilterDate);
            }
            if (storedNewEventDate) {
              state.calendarAI.ui.newEventDate = storedNewEventDate;
              setNewEventDefaultWhen(storedNewEventDate);
            }
          });

          // Clean up localStorage after successful migration
          localStorage.removeItem('calendarai.events.v1');
          localStorage.removeItem('calendarai.prefs.fit');
          localStorage.removeItem('calendarai.ui.filterDate');
          localStorage.removeItem('calendarai.ui.newEventDate');

          console.log('[CalendarAI] Migration complete, localStorage cleaned up');
        }
      } catch (err) {
        console.error('[CalendarAI] Migration failed:', err);
      }
    };

    migrateFromLocalStorage();
  }, []); // Run once on mount

  // Update grid mode based on event count
  useEffect(() => {
    const list = dayFilter
      ? events.filter((e) => isSameDay(getEventDate(e), new Date(dayFilter)))
      : events;
    setGridMode(list.length <= 1 ? 'single' : 'multi');
  }, [events.length, dayFilter]);

  // Date helpers and event filtering
  const pad2 = (n) => String(n).padStart(2, '0');
  const toYMD = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  function isSameDay(a, b) {
    if (!a || !b) return false;
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }
  function getEventDate(e) {
    if (!e) return null;
    if (typeof e.when === 'string') return e.when ? new Date(e.when) : null;
    if (e.when?.dateTime) return new Date(e.when.dateTime);
    if (e.when?.date) return new Date(e.when.date);
    return null;
  }

  const eventsByDay = useMemo(() => {
    const map = new Map();
    for (const e of events) {
      const d = getEventDate(e);
      if (!d) continue;
      const key = toYMD(d);
      map.set(key, (map.get(key) || 0) + 1);
    }
    return map;
  }, [events]);

  const eventsToRender = useMemo(() => {
    if (!dayFilter) return events;
    const day = new Date(dayFilter);
    return events.filter((e) => isSameDay(getEventDate(e), day));
  }, [events, dayFilter]);

  // Save events to Zustand store (persisted automatically)
  const saveEvents = useCallback((newEvents) => {
    useStore.setState((state) => {
      state.calendarAI.events = newEvents;
    });
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
        if (response.status === 400 || response.status === 401) {
          console.warn('[CalendarAI] Google Calendar not connected. Please connect in Settings.');
          return;
        }
        throw new Error(`Failed to fetch calendar events: ${response.statusText}`);
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
      useStore.setState((state) => {
        const localEvents = state.calendarAI.events.filter(e => e.source !== 'google-calendar');
        state.calendarAI.events = [...localEvents, ...formattedEvents];
      });

      console.log(`[CalendarAI] Fetched ${formattedEvents.length} events from Google Calendar`);
    } catch (err) {
      console.error('Failed to fetch Google Calendar events:', err);
    }
  }, [isCalendarConnected, saveEvents]);

  useEffect(() => {
    if (isCalendarConnected) {
      fetchGoogleCalendarEvents();
    }
  }, [isCalendarConnected, fetchGoogleCalendarEvents]);

  // Listen for sidebar-initiated actions (filter or create) from store
  useEffect(() => {
    // Sync filter date from store to local state
    if (storeFilterDate) {
      setDayFilter(storeFilterDate);
    }

    // Sync new event date from store to local state
    if (storeNewEventDate) {
      setNewEventDefaultWhen(storeNewEventDate);
      setEditingEvent(null);
      setShowEventModal(true);
      // Clear the pending action after handling
      useStore.setState((state) => {
        state.calendarAI.ui.newEventDate = '';
      });
    }
  }, [storeFilterDate, storeNewEventDate]);

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

      useStore.setState((state) => {
        if (data.events && Array.isArray(data.events)) {
          state.calendarAI.events = data.events;
        }
        if (data.prefs?.fit) {
          state.calendarAI.preferences.imageFit = data.prefs.fit;
        }
      });

      setShowSettings(false);
    } catch (err) {
      console.error('Failed to import JSON:', err);
      alert('Import failed: invalid JSON');
    }
  }, []);

  // Reset all data
  const resetAll = useCallback(() => {
    if (!confirm('This will remove all events and preferences. Continue?')) return;
    useStore.setState((state) => {
      state.calendarAI.events = [];
      state.calendarAI.preferences.imageFit = 'contain';
      state.calendarAI.ui.filterDate = null;
      state.calendarAI.ui.newEventDate = '';
    });
    setShowSettings(false);
  }, []);

  // Toggle right pane when showDataPane changes
  useEffect(() => {
    if (showDataPane) setRightPane(<CalendarRightPane />);
    else clearRightPane();
  }, [showDataPane, setRightPane, clearRightPane]);

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
      {/* Header (shared BoothHeader) */}
      <BoothHeader
        icon="calendar_month"
        title="CalendarAI"
        typeText="Event Planner"
        status={isCalendarConnected ? 'ready' : 'pending'}
        description={
          isCalendarConnected
            ? 'Connected to Google Calendar. Create, import, and sync events.'
            : 'Create, import, and preview events. Connect Google Calendar to sync.'
        }
        align="top"
        actions={(
          <ActionBar
            separators
            items={[
              { id: 'new', icon: 'add', label: 'New Event', onClick: () => { setEditingEvent(null); setShowEventModal(true); } },
              { id: 'import', icon: 'upload', label: 'Import .ics', onClick: () => icsInputRef.current?.click() },
              isCalendarConnected
                ? { id: 'sync', icon: 'sync', label: 'Sync Calendar', onClick: fetchGoogleCalendarEvents }
                : { id: 'connect', icon: 'link', label: 'Connect Google Calendar', onClick: async () => {
                    try {
                      await connectService('googleCalendar');
                    } catch (err) {
                      console.error('Failed to connect Google Calendar:', err);
                      // Fallback to settings if OAuth fails
                      setShowSettings(true);
                    }
                  } },
              { id: 'toggle-pane', icon: 'view_sidebar', label: showDataPane ? 'Hide Data Pane' : 'Show Data Pane', onClick: () => setShowDataPane(v => !v) },
              { id: 'settings', icon: 'settings', label: 'Settings', onClick: () => setShowSettings(true) },
              ...(isPhotosConnected ? [{ id: 'photos-sync', icon: 'photo_library', label: 'Sync Photos', onClick: () => fetchGooglePhotosAlbums?.() }] : []),
              ...(isDriveConnected ? [{ id: 'drive-sync', icon: 'cloud', label: 'Sync Drive', onClick: () => fetchGoogleDriveFiles?.() }] : []),
              ...(isGmailConnected ? [{ id: 'gmail-sync', icon: 'mark_email_unread', label: 'Sync Gmail', onClick: () => fetchGmailMessages?.() }] : []),
            ]}
            aria-label="Calendar actions"
          />
        )}
      >
        {selectedEvent ? (
          <div className="prompt-info">
            <h4>Selected Event</h4>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
              {selectedEvent.name || selectedEvent.title}
            </p>
            {selectedEvent.when && (
              <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '12px' }}>{new Date(selectedEvent.when).toLocaleString()}</p>
            )}
            {selectedEvent.where && (
              <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '12px' }}>{selectedEvent.where}</p>
            )}
          </div>
        ) : (
          <div className="prompt-info">
            <h4>Quick Tips</h4>
            <ul style={{ margin: 0, paddingLeft: '18px' }}>
              <li>Press N to create a new event</li>
              <li>Press I to import a .ics file</li>
              <li>Press ⌘, (Ctrl,) to open Settings; ? for help</li>
            </ul>
          </div>
        )}
      </BoothHeader>

      {/* Calendar grid removed (lives in sidebar). */}

      {/* Event grid */}
      <main className={`calendar-ai-grid ${gridMode}`}>
        {eventsToRender.length === 0 && (
          <div className="empty-state">
            {(() => { const c = appHomeContent.calendarAI; const tips = isCalendarConnected ? c.tips : [...c.tips, 'Connect Google Calendar in Settings to import events']; return (
              <AppHomeBlock icon={c.icon} subtitle={c.subtitle} title={c.title} description={c.description} tips={tips} />
            ); })()}
          </div>
        )}

        {eventsToRender.map(event => (
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

      {/* Settings FAB removed: settings moved into countdown actions toolbar */}

      {/* Event Modal */}
      {showEventModal && (
        <EventModal
          event={editingEvent}
          defaultWhen={newEventDefaultWhen}
          onSave={saveEvent}
          onDelete={deleteEvent}
          onClose={() => {
            setShowEventModal(false);
            setNewEventDefaultWhen('');
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
            useStore.setState((state) => {
              state.calendarAI.preferences.imageFit = fit;
            });
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

  const hasImage = Boolean(event.src);
  const getPlaceholderStyle = () => {
    const hue = Math.abs(hashCode(event.name || 'event')) % 360;
    const colorA = `hsl(${hue}, 48%, 22%)`;
    const colorB = `hsl(${(hue + 22) % 360}, 38%, 12%)`;
    return {
      background: `linear-gradient(135deg, ${colorA}, ${colorB})`,
    };
  };

  return (
    <article
      className={`event-card ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
      onDoubleClick={onEdit}
      tabIndex={0}
    >
      <div className={`media${hasImage ? '' : ' placeholder'}`} style={hasImage ? undefined : getPlaceholderStyle()}>
        {hasImage ? (
          <img src={event.src} alt={event.name || 'Event'} loading="lazy" />
        ) : null}
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
        {/* Overlay content (title + countdown) over image */}
        <div className="media-overlay">
          <div className="overlay-meta">
            <div className="title">{event.name || event.title || 'Untitled Event'}</div>
            {event.where && <div className="where">{event.where}</div>}
          </div>
          <div className="countdown countdown-overlay">
            <ActionBar className="countdown-stats" aria-label="Event countdown" as="div">
              <div className="ui-ActionBar__btn" role="button" tabIndex={0} aria-label="Days">
                <CountdownPart label="Days" value={countdown.days} />
              </div>
              <div className="ui-ActionBar__btn" role="button" tabIndex={0} aria-label="Hours">
                <CountdownPart label="Hours" value={String(countdown.hours).padStart(2, '0')} />
              </div>
              <div className="ui-ActionBar__btn" role="button" tabIndex={0} aria-label="Minutes">
                <CountdownPart label="Minutes" value={String(countdown.minutes).padStart(2, '0')} />
              </div>
              <div className="ui-ActionBar__btn" role="button" tabIndex={0} aria-label="Seconds">
                <CountdownPart label="Seconds" value={String(countdown.seconds).padStart(2, '0')} />
              </div>
            </ActionBar>
          </div>
        </div>
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
const EventModal = ({ event, defaultWhen, onSave, onDelete, onClose, fileInputRef }) => {
  const [name, setName] = useState(event?.name || '');
  const [when, setWhen] = useState(
    event?.when ? new Date(event.when).toISOString().slice(0, 16) : (defaultWhen || '')
  );
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
    <div className="ui-ModalWizard__overlay" onClick={(e) => e.currentTarget === e.target && onClose()}>
      <div className="ui-ModalWizard" role="dialog" aria-modal="true">
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
  <div className="ui-ModalWizard__overlay" onClick={(e) => e.currentTarget === e.target && onClose()}>
    <div className="ui-ModalWizard" role="dialog" aria-modal="true">
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
  <div className="ui-ModalWizard__overlay" onClick={(e) => e.currentTarget === e.target && onClose()}>
    <div className="ui-ModalWizard" role="dialog" aria-modal="true">
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

// Named export for Storybook reuse
export { EventCard };

// Calendar grid component
function CalendarGrid({ monthDate, eventsByDay, onPrevMonth, onNextMonth, onDayClick }) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const startOfMonth = new Date(year, month, 1);
  const startDay = startOfMonth.getDay(); // 0 (Sun) - 6 (Sat)
  const gridStart = new Date(year, month, 1 - startDay);

  const weeks = [];
  for (let w = 0; w < 6; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      const index = w * 7 + d;
      const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
      days.push(date);
    }
    weeks.push(days);
  }

  const monthLabel = monthDate.toLocaleString(undefined, { month: 'long', year: 'numeric' });

  const pad2 = (n) => String(n).padStart(2, '0');
  const toYMD = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="calendar-grid-wrapper">
      <div className="calendar-grid-header">
        <button className="nav" onClick={onPrevMonth} title="Previous month">
          <span className="icon">chevron_left</span>
        </button>
        <h3>{monthLabel}</h3>
        <button className="nav" onClick={onNextMonth} title="Next month">
          <span className="icon">chevron_right</span>
        </button>
      </div>
      <div className="calendar-grid">
        {weekdayLabels.map((lbl) => (
          <div key={lbl} className="calendar-weekday">{lbl}</div>
        ))}
        {weeks.flat().map((date) => {
          const isCurrentMonth = date.getMonth() === month;
          const key = toYMD(date);
          const count = eventsByDay.get(key) || 0;
          return (
            <button
              key={key}
              className={`calendar-cell ${isCurrentMonth ? '' : 'muted'}`}
              onClick={(e) => onDayClick(date, e)}
              title={count ? `${count} event${count > 1 ? 's' : ''}` : 'No events'}
            >
              <span className="date-num">{date.getDate()}</span>
              {count > 0 && <span className="event-dot" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
