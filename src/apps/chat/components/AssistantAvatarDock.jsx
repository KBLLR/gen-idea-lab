import React, { useRef, useState, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { personalities } from '@shared/lib/assistant/personalities.js';
import { getAssistantShader, generateShaderKeyframes } from '../lib/assistantShaders.js';
import styles from './AssistantAvatarDock.module.css';

function AssistantAvatar({ assistant, onSelect }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `assistant-${assistant.id}`,
    data: {
      type: 'assistant',
      assistant,
    },
  });

  const wrapperStyle = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  // Get unique shader for this assistant
  const shader = getAssistantShader(assistant.id);

  // Simulate working status (can be connected to store later)
  const isWorking = false; // TODO: connect to actual agent status
  const hasNotification = false; // TODO: connect to actual notification status

  return (
    <div
      ref={setNodeRef}
      style={wrapperStyle}
      className={styles.avatarWrapper}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => onSelect?.(assistant)}
      {...attributes}
      {...listeners}
    >
      <div className={`${styles.avatar} ${isWorking ? styles.working : ''}`}>
        {/* Animated shader background */}
        <div
          className={styles.shaderBackground}
          style={{
            background: shader.gradient,
            animation: shader.animation,
          }}
        />

        {/* Module code badge */}
        <div className={styles.moduleCodeBadge}>{assistant.id}</div>

        {/* Icon */}
        <span className="material-icons-round">{assistant.icon}</span>

        {hasNotification && <div className={styles.notification} />}
        {isWorking && <div className={styles.workingRing} />}
      </div>

      {showTooltip && (
        <div className={styles.tooltip}>
          <div className={styles.tooltipName}>{assistant.name}</div>
          <div className={styles.tooltipTitle}>{assistant.title}</div>
        </div>
      )}
    </div>
  );
}

export default function AssistantAvatarDock() {
  const scrollRef = useRef(null);
  const [isDraggingScroll, setIsDraggingScroll] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const assistants = Object.values(personalities);

  // Inject shader keyframe animations on mount
  useEffect(() => {
    const styleId = 'assistant-shader-animations';
    if (!document.getElementById(styleId)) {
      const styleElement = document.createElement('style');
      styleElement.id = styleId;
      styleElement.textContent = generateShaderKeyframes();
      document.head.appendChild(styleElement);
    }
  }, []);

  const handleAssistantSelect = (assistant) => {
    // TODO: Invite assistant to chat
    console.log('Assistant clicked:', assistant.name);
    // Could trigger a message like "/invite @assistant.id"
  };

  // Manual scroll drag
  const handleMouseDown = (e) => {
    setIsDraggingScroll(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDraggingScroll) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDraggingScroll(false);
  };

  const handleMouseLeave = () => {
    setIsDraggingScroll(false);
  };

  return (
    <div className={styles.dock}>
      <div className={styles.dockLabel}>
        <span className="material-icons-round" style={{ fontSize: 16, marginRight: 6 }}>groups</span>
        <span>AI Assistants</span>
      </div>
      <div
        ref={scrollRef}
        className={styles.scrollContainer}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div className={styles.avatarList}>
          {assistants.map((assistant) => (
            <AssistantAvatar
              key={assistant.id}
              assistant={assistant}
              onSelect={handleAssistantSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
