export default {
  title: 'Tokens/Overview'
};

export const Colors = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}>
    {[
      '--text-primary', '--text-secondary', '--text-tertiary', '--text-accent',
      '--color-surface', '--bg-panel', '--bg-item', '--glass-panel-bg'
    ].map((v) => (
      <div key={v} style={{ border: '1px solid var(--border-secondary)', borderRadius: 8, padding: 12 }}>
        <div style={{ fontSize: 12, marginBottom: 8 }}>{v}</div>
        <div style={{ background: `var(${v})`, height: 40, borderRadius: 6, border: '1px solid var(--border-secondary)' }} />
      </div>
    ))}
  </div>
);

export const Typography = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <h1>Heading 1</h1>
    <h2>Heading 2</h2>
    <h3>Heading 3</h3>
    <p>Body text — primary tone</p>
    <p style={{ color: 'var(--text-secondary)' }}>Body text — secondary tone</p>
  </div>
);

