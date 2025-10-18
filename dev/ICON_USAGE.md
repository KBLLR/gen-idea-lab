# Icon Usage Guide

## Overview

The app now uses **Material Icons Round** as the unified icon system. All icons should render properly as graphics, not text.

## How to Use Icons

### Option 1: Using the Icon Component (Recommended)

```jsx
import Icon from '@shared/components/Icon';

// Basic usage
<Icon name="home" />

// With custom size
<Icon name="search" size={20} />

// With custom color
<Icon name="settings" color="#4a9eff" />

// With className and style
<Icon
  name="favorite"
  size={32}
  className="my-custom-class"
  style={{ marginRight: 8 }}
/>
```

### Option 2: Using className directly

```jsx
// Standard size (24px)
<span className="material-icons-round">home</span>

// Or using the .icon class
<span className="icon">search</span>

// With custom size via style
<span className="material-icons-round" style={{ fontSize: 20 }}>
  settings
</span>
```

## Available Icon Names

Browse all available icons at:
https://fonts.google.com/icons?icon.set=Material+Icons&icon.style=Rounded

Common icons:
- `home`, `search`, `settings`, `menu`, `close`
- `favorite`, `star`, `bookmark`, `check`, `add`
- `person`, `group`, `chat`, `notifications`, `mail`
- `edit`, `delete`, `save`, `upload`, `download`
- `arrow_back`, `arrow_forward`, `expand_more`, `expand_less`

## Migration from Old Code

### Before (may show text):
```jsx
<span className="material-icons-round">home</span>  // ❌ May not work
<i className="material-symbols-outlined">search</i> // ❌ Wrong font
```

### After (works correctly):
```jsx
<Icon name="home" />                                // ✅ Recommended
<span className="material-icons-round">home</span>  // ✅ Works now
```

## Troubleshooting

**Icons still showing as text?**
1. Hard refresh the browser (Cmd/Ctrl + Shift + R)
2. Check browser console for font loading errors
3. Ensure you're using `material-icons-round` class, not `material-symbols-outlined`
4. Use the Icon component to avoid class name mistakes

**Icon not found?**
- Verify the icon name exists in Material Icons Round
- Icon names use underscores: `arrow_back` not `arrow-back`
- Names are case-sensitive and lowercase

## Best Practices

1. **Use the Icon component** for new code
2. **Always specify size** when different from 24px
3. **Use semantic names** - if an icon represents "close", name it "close" not "x"
4. **Avoid inline styles** when possible - use className instead
5. **Keep icons accessible** - add aria-label when icon-only buttons are used

## Examples

```jsx
// Icon-only button (needs aria-label)
<button aria-label="Close modal">
  <Icon name="close" />
</button>

// Button with icon and text
<button>
  <Icon name="save" size={18} />
  <span>Save Changes</span>
</button>

// List item with icon
<li>
  <Icon name="check_circle" color="var(--color-success)" />
  <span>Task completed</span>
</li>
```
