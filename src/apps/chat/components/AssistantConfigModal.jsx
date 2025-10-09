/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect } from 'react';
import { getAssistantShader } from '../lib/assistantShaders.js';
import styles from './AssistantConfigModal.module.css';

export default function AssistantConfigModal({ assistant, isOpen, onClose, onSave }) {
  const [personality, setPersonality] = useState('');
  const [responsibility, setResponsibility] = useState('');

  useEffect(() => {
    if (assistant) {
      // Initialize with assistant's system instruction or default
      setPersonality(assistant.systemInstruction || '');
      // Extract a brief responsibility from the title or create one
      setResponsibility(assistant.title || '');
    }
  }, [assistant]);

  const handleSave = () => {
    onSave?.({
      assistantId: assistant.id,
      personality,
      responsibility,
    });
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !assistant) return null;

  const shader = getAssistantShader(assistant.id);

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <button className={styles.closeButton} onClick={onClose} title="Close">
          <span className="material-icons-round">close</span>
        </button>

        <div className={styles.content}>
          {/* Left side: Large shader preview */}
          <div className={styles.shaderPreview}>
            <div
              className={styles.shaderBackground}
              style={{
                background: shader.gradient,
                animation: shader.animation,
              }}
            />
            <div className={styles.shaderOverlay}>
              <div className={styles.moduleCode}>{assistant.id}</div>
              <div className={styles.assistantName}>{assistant.name}</div>
            </div>
          </div>

          {/* Right side: Editable fields */}
          <div className={styles.form}>
            <div className={styles.header}>
              <span className="material-icons-round" style={{ fontSize: 28 }}>
                {assistant.icon}
              </span>
              <div>
                <h2 className={styles.title}>{assistant.name}</h2>
                <p className={styles.subtitle}>{assistant.id}</p>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                <span className="material-icons-round">badge</span>
                <span>Responsibility</span>
              </label>
              <input
                type="text"
                className={styles.input}
                value={responsibility}
                onChange={(e) => setResponsibility(e.target.value)}
                placeholder="e.g., Editorial Design, Software Architecture..."
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                <span className="material-icons-round">psychology</span>
                <span>Personality & Expertise</span>
              </label>
              <textarea
                className={styles.textarea}
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                placeholder="Describe the assistant's personality, expertise, and approach..."
                rows={12}
              />
            </div>

            <div className={styles.actions}>
              <button className={styles.cancelButton} onClick={onClose}>
                Cancel
              </button>
              <button className={styles.saveButton} onClick={handleSave}>
                <span className="material-icons-round">save</span>
                <span>Save Configuration</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
