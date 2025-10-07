import React from 'react';

export default function DayActionsTooltip({ onCreate, onSee, style, role = 'dialog' }) {
  return (
    <div className="calendar-day-tooltip" style={style} role={role} aria-label="Day actions">
      <button className="action" onClick={onCreate} type="button">
        <span className="icon">add</span>
        Create event
      </button>
      <button className="action" onClick={onSee} type="button">
        <span className="icon">event</span>
        See events
      </button>
    </div>
  );
}

