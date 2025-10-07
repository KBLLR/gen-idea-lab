/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
export default function FormField({
  label,
  htmlFor,
  secondary = false,
  children,
  hint,
  error,
  style
}) {
  return (
    <div className="form-field" style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {label && (
        <label
          htmlFor={htmlFor}
          className={`provider-label${secondary ? ' secondary' : ''}`}
          style={{ margin: 0 }}
        >
          {label}
        </label>
      )}
      {children}
      {hint ? <small style={{ color: 'var(--text-secondary)' }}>{hint}</small> : null}
      {error ? <small style={{ color: 'var(--color-error, #d33)' }}>{error}</small> : null}
    </div>
  );
}

