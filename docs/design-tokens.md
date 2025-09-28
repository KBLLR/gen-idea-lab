# GenBooth Lab Design System Documentation

## 🎨 Design Tokens

This documentation provides comprehensive guidelines for using the GenBooth Lab design token system. Our tokens ensure consistent, maintainable, and scalable styling across the application.

## 📚 Table of Contents

- [Token Categories](#token-categories)
- [Naming Conventions](#naming-conventions)
- [Usage Guidelines](#usage-guidelines)
- [Migration Guide](#migration-guide)
- [Utility Classes](#utility-classes)
- [Development Workflow](#development-workflow)

## Token Categories

### 🎯 Primitive Tokens
Base values that form the foundation of our design system:

```css
/* Colors */
--color-blue-500: #1e88e5;
--color-gray-900: #000000;

/* Spacing */
--spacing-5: 8px;
--spacing-10: 20px;

/* Typography */
--typography-font-size-lg: 16px;
--typography-font-weight-semibold: 600;
```

### 🎨 Semantic Tokens
Contextual tokens that map to design intentions:

```css
/* Surfaces */
--surface-primary: #000000;
--surface-secondary: #0a0a0a;

/* Text */
--text-primary: #ffffff;
--text-secondary: #bbbbbb;

/* Interactive */
--interactive-primary-default: #1e88e5;
--interactive-primary-hover: #1976d2;
```

### 🧩 Component Tokens
Component-specific styling tokens:

```css
/* Buttons */
--button-primary-background-default: #1e88e5;
--button-padding-md: 8px 15px;
--button-border-radius-default: 5px;
```

## Naming Conventions

Our tokens follow a structured naming pattern:

```
--{prefix}-{category}-{subcategory}-{variant}-{state}
```

### Examples:
- `--gbl-color-blue-500` (primitive color)
- `--surface-primary` (semantic surface)
- `--button-primary-background-hover` (component state)

### Prefixes:
- `gbl-` for all tokens (GenBooth Lab namespace)
- No prefix for commonly used semantic tokens

## Usage Guidelines

### ✅ DO

```css
/* Use semantic tokens for component styling */
.my-component {
  background-color: var(--surface-primary);
  color: var(--text-primary);
  padding: var(--spacing-10);
  border-radius: var(--radius-lg);
}

/* Use utility classes for quick styling */
.quick-style {
  @apply bg-surface-primary text-primary p-10 radius-lg;
}
```

### ❌ DON'T

```css
/* Avoid hardcoded values */
.bad-component {
  background-color: #000000;
  color: #ffffff;
  padding: 20px;
  border-radius: 8px;
}

/* Don't use primitive tokens directly in components */
.also-bad {
  background-color: var(--color-gray-900);
  color: var(--color-white);
}
```

## Migration Guide

### From Legacy CSS Variables

The system provides backward compatibility through `legacy.css`:

```css
/* Legacy (deprecated) */
--bg-main: var(--surface-primary);
--text-primary: var(--text-primary);

/* New (recommended) */
--surface-primary: #000000;
--text-primary: #ffffff;
```

### Migration Steps:

1. **Identify Legacy Usage**: Run `npm run tokens:audit` to find hardcoded values
2. **Replace Gradually**: Use semantic tokens for new components
3. **Update Existing**: Replace legacy variables with new tokens
4. **Test Thoroughly**: Ensure visual consistency

## Utility Classes

Our utility system provides atomic styling capabilities:

### Color Classes
```html
<div class="bg-surface-primary text-primary">
  Primary surface with primary text
</div>

<button class="bg-interactive-primary text-on-primary">
  Interactive button
</button>
```

### Spacing Classes
```html
<div class="p-10 m-5">Padding 20px, margin 8px</div>
<div class="px-7 py-5">Horizontal 12px, vertical 8px</div>
```

### Typography Classes
```html
<h1 class="text-2xl font-bold leading-tight">Large, bold heading</h1>
<p class="text-normal font-normal leading-normal">Body text</p>
```

### Layout Classes
```html
<div class="radius-lg shadow-md backdrop-blur">
  Rounded, shadowed, blurred container
</div>
```

### Button Classes
```html
<button class="btn btn-primary btn-md">Primary Button</button>
<button class="btn btn-secondary btn-sm btn-pill">Small Pill Button</button>
<button class="btn btn-icon">
  <span class="icon">settings</span>
</button>
```

### Responsive Classes
```html
<div class="p-10 md:p-5 sm:p-2">
  Responsive padding that decreases on smaller screens
</div>
```

## Development Workflow

### Building Tokens
```bash
# Build all tokens
npm run tokens:build

# Watch for changes
npm run tokens:watch

# Clean generated files
npm run tokens:clean

# Audit codebase for token usage
npm run tokens:audit
```

### Adding New Tokens

1. **Edit Source Files**: Update JSON files in `/tokens/`
2. **Build**: Run `npm run tokens:build`
3. **Test**: Verify in browser
4. **Document**: Update this guide if needed

### Token File Structure
```
tokens/
├── primitives/
│   ├── color.json
│   ├── spacing.json
│   ├── typography.json
│   └── ...
├── themes/
│   ├── light.json
│   └── dark.json
├── components/
│   ├── button.json
│   ├── input.json
│   └── ...
└── config.json
```

## Theme Switching

Our system supports multiple themes through CSS custom properties:

```css
/* Default (dark) theme */
:root {
  --surface-primary: #000000;
  --text-primary: #ffffff;
}

/* Light theme */
:root[data-theme="light"] {
  --surface-primary: #ffffff;
  --text-primary: #000000;
}
```

### JavaScript Theme Toggle
```javascript
// Toggle theme
const toggleTheme = () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
};
```

## Token Reference

### Most Used Tokens

Based on our audit findings, these tokens are used most frequently:

1. `--surface-primary` - Main background color
2. `--text-primary` - Primary text color
3. `--spacing-10` - Standard spacing (20px)
4. `--radius-lg` - Large border radius (8px)
5. `--interactive-primary-default` - Primary button color

### Color Palette

| Token | Light Value | Dark Value | Usage |
|-------|-------------|------------|-------|
| `--surface-primary` | `#ffffff` | `#000000` | Main backgrounds |
| `--surface-secondary` | `#f0f2f5` | `#0a0a0a` | Panel backgrounds |
| `--text-primary` | `#1c1e21` | `#ffffff` | Primary text |
| `--text-secondary` | `#65676b` | `#bbbbbb` | Secondary text |
| `--interactive-primary` | `#1e88e5` | `#1e88e5` | Primary actions |

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--spacing-1` | `2px` | Fine adjustments |
| `--spacing-5` | `8px` | Small spacing |
| `--spacing-10` | `20px` | Standard spacing |
| `--spacing-13` | `40px` | Large spacing |

## Best Practices

### Performance
- Tokens are compiled to CSS custom properties for optimal performance
- Utility classes are tree-shakeable (unused classes removed in production)
- Use semantic tokens over primitives for better maintainability

### Accessibility
- Color tokens maintain WCAG contrast requirements
- Focus states use consistent `--shadow-focus` token
- Typography scale provides readable font sizes

### Maintenance
- Run `npm run tokens:audit` regularly to identify inconsistencies
- Update tokens in source JSON files, never in generated CSS
- Document new token additions in this file

## Support & Contribution

### Reporting Issues
If you find inconsistencies or missing tokens:
1. Run the audit script to identify specific problems
2. Create detailed issue reports with examples
3. Suggest improvements or additions

### Contributing
1. Follow existing naming conventions
2. Add appropriate documentation
3. Test across light/dark themes
4. Update this documentation

---

**Last Updated**: Generated from design token audit on ${new Date().toISOString()}

For technical support, contact the design system team.