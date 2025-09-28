# GenBooth Lab Design Token Naming Conventions

## Overview

This document defines the naming conventions and token taxonomy for the GenBooth Idea Lab design system. All tokens follow a hierarchical structure from primitives to component-specific tokens.

## Naming Convention

- **JSON/YAML Files**: camelCase (e.g., `primaryBlue`, `textSecondary`)
- **CSS Custom Properties**: kebab-case with `gbl-` prefix (e.g., `--gbl-color-primary-blue`, `--gbl-text-secondary`)
- **Component Classes**: kebab-case with `gbl-` prefix (e.g., `.gbl-button-primary`, `.gbl-input-focus`)

## Token Hierarchy

### 1. Primitive Tokens
Base values that form the foundation of the design system.

**Categories:**
- `color` - Raw color values (hex, rgb, hsl)
- `typography` - Font families, weights, sizes, line heights
- `spacing` - Margins, padding, gaps (px, rem)
- `radius` - Border radius values
- `shadow` - Box shadow definitions
- `motion` - Animation durations, timing functions
- `zIndex` - Z-index layering values

**Example:**
```json
{
  "color": {
    "black": "#000000",
    "white": "#ffffff",
    "blue": {
      "500": "#1e88e5",
      "600": "#1976d2"
    },
    "gray": {
      "100": "#f0f2f5",
      "200": "#e4e6e9",
      "300": "#ced0d4",
      "400": "#bbb",
      "500": "#888",
      "600": "#666",
      "700": "#333",
      "800": "#2a2a2a",
      "900": "#1a1a1a"
    }
  }
}
```

### 2. Semantic Tokens
Theme-aware tokens that map to primitives and provide meaning.

**Categories:**
- `surface` - Background colors for different surfaces
- `text` - Text colors for different hierarchies
- `border` - Border colors and styles
- `state` - Success, error, warning, info colors
- `interactive` - Link, button, and interactive element colors

**Example:**
```json
{
  "surface": {
    "primary": "{color.black}",
    "secondary": "{color.gray.900}",
    "tertiary": "{color.gray.800}"
  },
  "text": {
    "primary": "{color.white}",
    "secondary": "{color.gray.400}",
    "tertiary": "{color.gray.500}",
    "inverse": "{color.black}"
  }
}
```

### 3. Component Tokens
Tokens specific to individual components and their states.

**Naming Pattern:** `{component}.{property}.{state|variant}`

**Example:**
```json
{
  "button": {
    "background": {
      "primary": "{surface.interactive.primary}",
      "secondary": "{surface.secondary}"
    },
    "text": {
      "primary": "{text.inverse}",
      "secondary": "{text.primary}"
    },
    "padding": {
      "small": "{spacing.2} {spacing.4}",
      "medium": "{spacing.3} {spacing.6}",
      "large": "{spacing.4} {spacing.8}"
    },
    "borderRadius": "{radius.medium}"
  }
}
```

## Theme Structure

Themes override semantic tokens while keeping primitives constant.

**Theme Files:**
- `tokens/themes/dark.json` (default)
- `tokens/themes/light.json`

**CSS Output:**
```css
:root {
  /* Primitive tokens (theme-agnostic) */
  --gbl-color-blue-500: #1e88e5;
}

:root[data-theme="dark"] {
  /* Dark theme semantic tokens */
  --gbl-surface-primary: var(--gbl-color-black);
  --gbl-text-primary: var(--gbl-color-white);
}

:root[data-theme="light"] {
  /* Light theme semantic tokens */
  --gbl-surface-primary: var(--gbl-color-white);
  --gbl-text-primary: var(--gbl-color-gray-900);
}
```

## Component States

Standard states for interactive components:

- `default` - Base state
- `hover` - Hover state
- `active` - Active/pressed state
- `focus` - Focused state
- `disabled` - Disabled state
- `selected` - Selected state (for toggles, tabs)

## Size Variants

Standard size scale for components:

- `xs` - Extra small
- `sm` - Small
- `md` - Medium (default)
- `lg` - Large
- `xl` - Extra large

## Token Reference Format

Tokens can reference other tokens using curly brace notation:

```json
{
  "surface": {
    "primary": "{color.black}",
    "overlay": "{color.black.alpha.80}"
  },
  "button": {
    "background": {
      "primary": "{surface.interactive.primary}",
      "primaryHover": "{surface.interactive.primary.hover}"
    }
  }
}
```

## File Organization

```
tokens/
├── primitives/
│   ├── color.json
│   ├── typography.json
│   ├── spacing.json
│   ├── radius.json
│   ├── shadow.json
│   ├── motion.json
│   └── zIndex.json
├── themes/
│   ├── dark.json
│   └── light.json
├── components/
│   ├── button.json
│   ├── input.json
│   ├── card.json
│   ├── modal.json
│   └── ...
└── build/
    ├── css/
    ├── js/
    └── figma/
```

## Build Output

The token system generates multiple output formats:

1. **CSS Custom Properties** (`build/css/tokens.css`)
2. **JavaScript/TypeScript** (`build/js/tokens.js`)
3. **JSON** (`build/json/tokens.json`)
4. **Figma Tokens** (`build/figma/tokens.json`)

## Usage Examples

### In CSS
```css
.my-component {
  background: var(--gbl-surface-primary);
  color: var(--gbl-text-primary);
  padding: var(--gbl-spacing-4);
  border-radius: var(--gbl-radius-medium);
}
```

### In JavaScript/React
```javascript
import { tokens } from '../styles/tokens';

const Button = styled.button`
  background: ${tokens.surface.primary};
  color: ${tokens.text.primary};
  padding: ${tokens.spacing[4]};
`;
```

### With Utility Classes
```html
<div class="gbl-bg-surface-primary gbl-text-primary gbl-p-4 gbl-rounded-md">
  Content
</div>
```

## Versioning

Design tokens follow semantic versioning:

- **Major**: Breaking changes to token names or structure
- **Minor**: New tokens added, non-breaking changes
- **Patch**: Value updates, bug fixes

## Migration Strategy

When updating tokens:

1. Add new tokens alongside existing ones
2. Mark old tokens as deprecated with `@deprecated` comments
3. Provide migration guide in changelog
4. Remove deprecated tokens in next major version