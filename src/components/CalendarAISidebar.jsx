/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import useStore from '../lib/store';
import '../styles/components/calendar-ai-sidebar.css';

const CalendarAISidebar = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get events from localStorage (we'll need to sync this with CalendarAI component state)
  const events = useMemo(() => {
    try {
      const stored = localStorage.getItem('calendarai.events.v1');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  const categories = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 86400000);
    const weekEnd = new Date(today.getTime() + 7 * 86400000);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const categorized = {
      all: events.length,
      today: 0,
      tomorrow: 0,
      thisWeek: 0,
      thisMonth: 0,
      upcoming: 0,
      past: 0,
    };

    events.forEach(event => {
      if (!event.when) return;
      const eventDate = new Date(event.when);
      const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());

      if (eventDay.getTime() === today.getTime()) {
        categorized.today++;
      } else if (eventDay.getTime() === tomorrow.getTime()) {
        categorized.tomorrow++;
      }

      if (eventDate >= now && eventDate <= weekEnd) {
        categorized.thisWeek++;
      }

      if (eventDate >= now && eventDate <= monthEnd) {
        categorized.thisMonth++;
      }

      if (eventDate >= now) {
        categorized.upcoming++;
      } else {
        categorized.past++;
      }
    });

    return categorized;
  }, [events]);

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Previous month's days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthLastDay - i)
      });
    }

    // Current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(year, month, i)
      });
    }

    // Next month's days
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i)
      });
    }

    return days;
  }, [currentMonth]);

  const hasEventOnDay = (date) => {
    return events.some(event => {
      if (!event.when) return false;
      const eventDate = new Date(event.when);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="calendar-ai-sidebar">
      {/* Mini Calendar */}
      <div className="mini-calendar">
        <div className="calendar-header">
          <button className="nav-btn icon" onClick={goToPreviousMonth} title="Previous month">
            chevron_left
          </button>
          <button className="month-label" onClick={goToToday}>
            {monthName}
          </button>
          <button className="nav-btn icon" onClick={goToNextMonth} title="Next month">
            chevron_right
          </button>
        </div>

        <div className="calendar-grid">
          <div className="weekday-header">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="weekday">{day}</div>
            ))}
          </div>

          <div className="days-grid">
            {calendarDays.map((dayInfo, i) => (
              <div
                key={i}
                className={`day ${!dayInfo.isCurrentMonth ? 'other-month' : ''} ${isToday(dayInfo.date) ? 'today' : ''} ${hasEventOnDay(dayInfo.date) ? 'has-event' : ''}`}
              >
                {dayInfo.day}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="category-filters">
        <h3 className="section-title">Categories</h3>

        <button
          className={`category-item ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          <span className="icon">calendar_month</span>
          <span className="category-name">All Events</span>
          <span className="category-count">{categories.all}</span>
        </button>

        <button
          className={`category-item ${selectedCategory === 'today' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('today')}
        >
          <span className="icon">today</span>
          <span className="category-name">Today</span>
          <span className="category-count">{categories.today}</span>
        </button>

        <button
          className={`category-item ${selectedCategory === 'tomorrow' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('tomorrow')}
        >
          <span className="icon">event</span>
          <span className="category-name">Tomorrow</span>
          <span className="category-count">{categories.tomorrow}</span>
        </button>

        <button
          className={`category-item ${selectedCategory === 'thisWeek' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('thisWeek')}
        >
          <span className="icon">view_week</span>
          <span className="category-name">This Week</span>
          <span className="category-count">{categories.thisWeek}</span>
        </button>

        <button
          className={`category-item ${selectedCategory === 'thisMonth' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('thisMonth')}
        >
          <span className="icon">date_range</span>
          <span className="category-name">This Month</span>
          <span className="category-count">{categories.thisMonth}</span>
        </button>

        <button
          className={`category-item ${selectedCategory === 'upcoming' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('upcoming')}
        >
          <span className="icon">schedule</span>
          <span className="category-name">Upcoming</span>
          <span className="category-count">{categories.upcoming}</span>
        </button>

        <button
          className={`category-item ${selectedCategory === 'past' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('past')}
        >
          <span className="icon">history</span>
          <span className="category-name">Past</span>
          <span className="category-count">{categories.past}</span>
        </button>
      </div>

      {/* Connection Status */}
      <div className="connection-status">
        <CalendarConnectionStatus />
      </div>
    </div>
  );
};

const CalendarConnectionStatus = () => {
  const isCalendarConnected = useStore(state => state.connectedServices?.googleCalendar?.connected);
  const setIsSettingsOpen = useStore.use.actions().setIsSettingsOpen;

  if (isCalendarConnected) {
    return (
      <div className="status-card connected">
        <span className="icon">check_circle</span>
        <div className="status-text">
          <div className="status-title">Google Calendar</div>
          <div className="status-subtitle">Connected</div>
        </div>
      </div>
    );
  }

  return (
    <div className="status-card disconnected">
      <span className="icon">cloud_off</span>
      <div className="status-text">
        <div className="status-title">Not Connected</div>
        <div className="status-subtitle">
          <button
            className="connect-link"
            onClick={() => setIsSettingsOpen(true)}
          >
            Connect Google Calendar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalendarAISidebar;
