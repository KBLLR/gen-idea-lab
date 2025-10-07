import React from 'react';
import AssistantCard from '@components/cards/AssistantCard.jsx';
import { personalities } from '@shared/lib/assistant/personalities.js';

const AssistantsBar = () => {
  return (
    <div className="assistants-bar">
      <div className="assistants-list">
        {Object.entries(personalities).map(([id, { name, title, icon }]) => (
          <AssistantCard key={id} name={name} title={title} icon={icon} />
        ))}
      </div>
    </div>
  );
};

export default AssistantsBar;