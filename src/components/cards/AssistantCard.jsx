import React from 'react';

const AssistantCard = ({ icon, name, title, active }) => {
  return (
    <div className={`assistant-card ${active ? 'active' : ''}`}>
      <div className="assistant-card-icon">
        <span className="icon">{icon}</span>
      </div>
      <div className="assistant-card-info">
        <div className="assistant-card-name">{name}</div>
        <div className="assistant-card-title">{title}</div>
      </div>
    </div>
  );
};

export default AssistantCard;
