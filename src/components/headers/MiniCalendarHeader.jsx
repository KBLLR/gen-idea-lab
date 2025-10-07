import React from 'react';

export default function MiniCalendarHeader({ monthLabel, onPrev, onNext, onToday }) {
  return (
    <div className="calendar-header">
      <button className="nav-btn icon" onClick={onPrev} title="Previous month">chevron_left</button>
      <button className="month-label" onClick={onToday}>{monthLabel}</button>
      <button className="nav-btn icon" onClick={onNext} title="Next month">chevron_right</button>
    </div>
  );
}

