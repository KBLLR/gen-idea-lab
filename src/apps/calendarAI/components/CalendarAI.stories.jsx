import React from 'react';
import ActionBar from '../ui/molecules/ActionBar.jsx';
import { EventCard } from './CalendarAI.jsx';
import '../styles/components/calendar-ai.css';

export default {
  title: 'Apps/CalendarAI',
  tags: ['component', 'docs']
};

const Chip = ({ label, value }) => (
  <div className="cd-part">
    <div className="cd-num">{value}</div>
    <div className="cd-lbl">{label}</div>
  </div>
);

export const CountdownAsActionBar = () => (
  <div style={{ padding: 24 }}>
    <div className="countdown">
      <ActionBar
        ariaLabel="Event countdown"
        items={[
          { key: 'd', title: 'Days', content: <Chip label="Days" value={3} /> },
          { key: 'h', title: 'Hours', content: <Chip label="Hours" value={'12'} /> },
          { key: 'm', title: 'Minutes', content: <Chip label="Minutes" value={'45'} /> },
          { key: 's', title: 'Seconds', content: <Chip label="Seconds" value={'09'} /> }
        ]}
      />
    </div>
  </div>
);

export const EventCardBasic = () => {
  const event = {
    id: 'evt-demo',
    name: 'Demo Launch Event',
    when: new Date(Date.now() + 86400000 * 3 + 3600000 * 12).toISOString(), // 3d 12h ahead
    where: 'Berlin, DE',
    src: ''
  };
  return (
    <div style={{ padding: 24, maxWidth: 380 }}>
      <EventCard
        event={event}
        imageFit={'cover'}
        onEdit={() => {}}
        onExport={() => {}}
        onSelect={() => {}}
        isSelected={false}
      />
    </div>
  );
};

