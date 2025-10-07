import React, { useState } from 'react';
import MiniCalendarHeader from './MiniCalendarHeader.jsx';

export default {
  title: 'Sidebar/MiniCalendarHeader',
  component: MiniCalendarHeader,
  parameters: { layout: 'centered' }
};

export const Default = () => {
  const [date, setDate] = useState(new Date());
  const monthLabel = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  return (
    <div style={{ width: 320 }}>
      <MiniCalendarHeader
        monthLabel={monthLabel}
        onPrev={() => setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1))}
        onNext={() => setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1))}
        onToday={() => setDate(new Date())}
      />
    </div>
  );
};

