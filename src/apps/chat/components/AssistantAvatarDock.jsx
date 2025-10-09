import React, { useRef, useState, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { personalities } from '@shared/lib/assistant/personalities.js';
import { getAssistantShader, generateShaderKeyframes } from '../lib/assistantShaders.js';
import AssistantConfigModal from './AssistantConfigModal.jsx';
import styles from './AssistantAvatarDock.module.css';

function AssistantAvatar({ assistant, onSelect }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [mouseDownPos, setMouseDownPos] = useState(null);
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

  const handleMouseDown = (e) => {
    setMouseDownPos({ x: e.clientX, y: e.clientY });
  };

  const handleClick = (e) => {
    // Only trigger modal if mouse didn't move (wasn't a drag)
    if (mouseDownPos) {
      const dx = Math.abs(e.clientX - mouseDownPos.x);
      const dy = Math.abs(e.clientY - mouseDownPos.y);
      console.log('[AssistantAvatar] Click detected, movement:', { dx, dy });
      if (dx < 5 && dy < 5) {
        console.log('[AssistantAvatar] Triggering onSelect for:', assistant.name);
        onSelect?.(assistant);
      } else {
        console.log('[AssistantAvatar] Movement too large, treating as drag');
      }
    }
    setMouseDownPos(null);
  };

  return (
    <div
      ref={setNodeRef}
      style={wrapperStyle}
      className={styles.avatarWrapper}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssistant, setSelectedAssistant] = useState(null);

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
    console.log('[AssistantDock] Opening modal for:', assistant.name);
    setSelectedAssistant(assistant);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedAssistant(null);
  };

  const handleConfigSave = (config) => {
    console.log('Saving config for', config.assistantId, config);
    // TODO: Save to store or backend
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
    <>
      <div className={styles.dock}>
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

      <AssistantConfigModal
        assistant={selectedAssistant}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleConfigSave}
      />
    </>
  );
}
