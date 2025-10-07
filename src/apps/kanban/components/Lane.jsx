import React from 'react';

export default function Lane({ title, items }) {
  return (
    <section className="lane">
      <header className="lane__hdr">{title} <span className="badge">{items.length}</span></header>
      <div className="lane__body">
        {items.map(t => (
          <article key={t.id} className={`card action-${(t.action || 'do').toLowerCase()}`}>
            <div className="card__title">{t.title}</div>
            <div className="card__meta">
              {t.category}{t.subcategory ? ` · ${t.subcategory}` : ''}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
