import React, { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import './ModalWizard.css';

export default function ModalWizard({
  isOpen,
  steps = [],
  initialStep = 0,
  onNext,
  onPrev,
  onClose,
  className,
}) {
  const [index, setIndex] = useState(initialStep);
  const overlayRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => { setIndex(initialStep); }, [initialStep, isOpen]);

  // Focus trap: keep focus within dialog while open
  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusable = () => Array.from(dialog.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )).filter(el => !el.hasAttribute('disabled'));

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
        return;
      }
      if (e.key !== 'Tab') return;
      const nodes = focusable();
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    dialog.addEventListener('keydown', onKeyDown);
    // Initial focus
    requestAnimationFrame(() => {
      const nodes = focusable();
      (nodes.find(n => n.getAttribute('autofocus') !== null) || nodes[0])?.focus();
    });

    return () => dialog.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const step = steps[index] || {};

  const closeOnOverlay = (e) => {
    if (e.target === overlayRef.current) onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div className="ui-ModalWizard__overlay" ref={overlayRef} onClick={closeOnOverlay} role="dialog" aria-modal="true" aria-label={step.title || 'Welcome'}>
      <div className={clsx('ui-ModalWizard', className)} ref={dialogRef}>
        <div className="ui-ModalWizard__left">
          <h2 className="ui-ModalWizard__title">{step.title}</h2>
          {step.desc && <p className="ui-ModalWizard__desc">{step.desc}</p>}
          <div className="ui-ModalWizard__actions">
            <button type="button" className="ui-ModalWizard__btn" onClick={() => { onPrev?.(index); setIndex(Math.max(0, index - 1)); }} disabled={index === 0} aria-label="Previous">
              ←
            </button>
            <div className="ui-ModalWizard__dots" aria-label="Progress">
              {steps.map((_, i) => (
                <span key={i} className={clsx('ui-ModalWizard__dot', i === index && 'is-active')} aria-current={i === index ? 'step' : undefined} />
              ))}
            </div>
            <button type="button" className="ui-ModalWizard__btn" onClick={() => { onNext?.(index); setIndex(Math.min(steps.length - 1, index + 1)); }} disabled={index === steps.length - 1} aria-label="Next">
              →
            </button>
            <button type="button" className="ui-ModalWizard__btn ui-ModalWizard__close" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
        </div>
        <div className="ui-ModalWizard__right">
          {step.image ? (
            typeof step.image === 'string' ? <img src={step.image} alt="" /> : step.image
          ) : null}
        </div>
      </div>
    </div>
  );
}