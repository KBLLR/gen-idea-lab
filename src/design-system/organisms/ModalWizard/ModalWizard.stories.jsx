import React, { useState } from 'react';
import ModalWizard from './ModalWizard.jsx';

export default { title: 'UI/Organisms/ModalWizard', component: ModalWizard, parameters: { layout: 'centered' } };

export const Basic = () => {
  const [open, setOpen] = useState(true);
  const steps = [
    { title: 'Welcome to GenBooth', desc: 'Your Generative Research Suite.' },
    { title: 'Micro‑apps', desc: 'Switch between focused tools like Chat, Planner, and Mind Map.' },
    { title: 'Research workflows', desc: 'Capture, plan, and document your projects end‑to‑end.' },
  ];
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      <ModalWizard isOpen={open} steps={steps} onClose={() => setOpen(false)} />
    </>
  );
};