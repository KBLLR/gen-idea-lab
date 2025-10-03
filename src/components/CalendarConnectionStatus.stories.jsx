import React from 'react';
import { CalendarConnectionStatus } from './CalendarAISidebar.jsx';
import useStore from '../lib/store.js';

export default {
  title: 'Sidebar/CalendarConnectionStatus',
  component: CalendarConnectionStatus,
  parameters: { layout: 'centered' }
};

export const Connected = {
  render: () => {
    useStore.setState((s) => {
      s.connectedServices.googleCalendar = { connected: true, status: 'connected', info: { name: 'googleCalendar' } };
    });
    return <div style={{ width: 360 }}><CalendarConnectionStatus /></div>;
  }
};

export const Disconnected = {
  render: () => {
    useStore.setState((s) => {
      s.connectedServices.googleCalendar = { connected: false, status: 'disconnected', info: null };
    });
    return <div style={{ width: 360 }}><CalendarConnectionStatus /></div>;
  }
};

