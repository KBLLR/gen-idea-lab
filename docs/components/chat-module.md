# Chat Module Component Specification

## 🏗️ Component Architecture

The chat module is composed of four main sections:

```
┌─────────────────────────────────────────┐
│                HEADER                   │ ← Chat Header (Agent info + actions)
├─────────────────────────────────────────┤
│                                         │
│                                         │
│            CHAT WINDOW                  │ ← Messages container (scrollable)
│          (Message history)              │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│        FOOTER INPUT BAR                 │ ← Input + action buttons
└─────────────────────────────────────────┘
```

## 🎨 Design Token Specifications

### Container Structure

```css
.chat-container {
  /* Layout */
  display: flex;
  flex-direction: column;
  height: 100%;
  
  /* Surface & Border */
  background: rgba(10, 10, 10, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-xl); /* 12px */
  
  /* Shadow & Animation */
  box-shadow: var(--shadow-xl);
  
  /* Overflow */
  overflow: hidden;
}

[data-theme="light"] .chat-container {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.12);
}
```

### 1. Header Section

```css
.chat-header {
  /* Layout */
  display: flex;
  align-items: center;
  gap: var(--spacing-8); /* 15px */
  padding: var(--spacing-9) var(--spacing-10); /* 16px 20px */
  
  /* Surface & Border */
  background: rgba(26, 26, 26, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  
  /* Behavior */
  flex-shrink: 0;
}

[data-theme="light"] .chat-header {
  background: rgba(255, 255, 255, 0.8);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
```

#### Header Elements:
- **Agent Icon**: `var(--typography-font-size-icon-lg)` (28px)
- **Agent Name**: `var(--typography-font-size-lg)` (16px), `var(--typography-font-weight-semibold)` (600)
- **Agent Title**: `var(--typography-font-size-md)` (13px), `var(--text-secondary)`
- **Action Buttons**: Close, minimize, etc.

### 2. Chat Window (Messages Container)

```css
.chat-window {
  /* Layout */
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-10); /* 20px */
  
  /* Scroll behavior */
  scroll-behavior: smooth;
}

.chat-messages {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-8); /* 15px */
}
```

#### Message Types:

**User Messages:**
```css
.message-user {
  /* Layout */
  align-self: flex-end;
  max-width: 85%;
  padding: var(--spacing-7) var(--spacing-9); /* 12px 16px */
  
  /* Surface & Border */
  background: var(--interactive-primary-default);
  color: var(--text-on-primary);
  border-radius: var(--radius-3xl) var(--radius-3xl) var(--radius-xs) var(--radius-3xl); /* 18px 18px 4px 18px */
  
  /* Typography */
  font-size: var(--typography-font-size-normal); /* 14px */
  line-height: var(--typography-line-height-relaxed); /* 1.5 */
}
```

**Assistant Messages:**
```css
.message-assistant {
  /* Layout */
  align-self: flex-start;
  max-width: 85%;
  padding: var(--spacing-7) var(--spacing-9); /* 12px 16px */
  
  /* Surface & Border */
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(10px);
  color: var(--text-primary);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-3xl) var(--radius-3xl) var(--radius-3xl) var(--radius-xs); /* 18px 18px 18px 4px */
  
  /* Typography */
  font-size: var(--typography-font-size-normal); /* 14px */
  line-height: var(--typography-line-height-relaxed); /* 1.5 */
}

[data-theme="light"] .message-assistant {
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.08);
}
```

**Agent Task Messages:**
```css
.message-task {
  /* Layout */
  align-self: flex-start;
  max-width: 90%;
  padding: var(--spacing-9); /* 16px */
  
  /* Surface & Border */
  background: rgba(26, 26, 26, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-xl); /* 12px */
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

[data-theme="light"] .message-task {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}
```

### 3. Footer Input Bar

```css
.chat-footer {
  /* Layout */
  display: flex;
  gap: var(--spacing-5); /* 8px */
  padding: var(--spacing-10); /* 20px */
  
  /* Surface & Border */
  background: rgba(26, 26, 26, 0.6);
  backdrop-filter: blur(8px);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  
  /* Behavior */
  flex-shrink: 0;
}

[data-theme="light"] .chat-footer {
  background: rgba(255, 255, 255, 0.6);
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}
```

#### Footer Elements:

**Action Buttons:**
```css
.action-button {
  /* Layout */
  padding: var(--spacing-5); /* 8px */
  
  /* Surface & Border */
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-md); /* 6px */
  
  /* Interaction */
  cursor: pointer;
  transition: all var(--motion-duration-fast) var(--motion-easing-ease);
}

.action-button:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}
```

**Text Input:**
```css
.chat-input {
  /* Layout */
  flex: 1;
  padding: var(--spacing-7) var(--spacing-8); /* 12px 15px */
  
  /* Surface & Border */
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-pill); /* 20px */
  
  /* Typography */
  font-family: var(--typography-font-family-primary);
  font-size: var(--typography-font-size-normal); /* 14px */
  color: var(--text-primary);
  
  /* Behavior */
  outline: none;
  transition: all var(--motion-duration-fast) var(--motion-easing-ease);
}

.chat-input:focus {
  border-color: var(--text-accent);
  box-shadow: var(--shadow-focus);
}

.chat-input::placeholder {
  color: var(--text-tertiary);
}
```

**Send Button:**
```css
.send-button {
  /* Layout */
  padding: var(--spacing-6); /* 10px */
  
  /* Surface & Border */
  background: var(--interactive-primary-default);
  border: none;
  border-radius: var(--radius-full); /* 50% */
  
  /* Interaction */
  cursor: pointer;
  transition: all var(--motion-duration-fast) var(--motion-easing-ease);
}

.send-button:hover:not(:disabled) {
  background: var(--interactive-primary-hover);
  transform: scale(1.05);
  box-shadow: var(--shadow-md);
}

.send-button:disabled {
  opacity: var(--button-disabled-opacity);
  cursor: not-allowed;
}

.send-button .icon {
  font-size: var(--typography-font-size-icon-md); /* 24px */
  color: var(--text-on-primary);
}
```

## 📐 Dimensions & Spacing

### Modal/Overlay Dimensions:
- **Width**: 90% of viewport, max 600px
- **Height**: 80% of viewport, max 700px
- **Padding**: None (handled by children)

### Section Heights:
- **Header**: Auto height, padding `var(--spacing-9) var(--spacing-10)`
- **Chat Window**: Flex: 1 (fills available space)
- **Footer**: Auto height, padding `var(--spacing-10)`

### Message Spacing:
- **Gap between messages**: `var(--spacing-8)` (15px)
- **Message padding**: `var(--spacing-7) var(--spacing-9)` (12px 16px)
- **Max message width**: 85% of container

### Border Radius Hierarchy:
- **Container**: `var(--radius-xl)` (12px)
- **Messages**: `var(--radius-3xl)` (18px) with corner cuts
- **Input field**: `var(--radius-pill)` (20px)
- **Action buttons**: `var(--radius-md)` (6px)
- **Send button**: `var(--radius-full)` (50%)

## 🎭 Animation & Transitions

### Modal Animations:
```css
@keyframes chat-fade-in {
  from {
    opacity: 0;
    backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(8px);
  }
}

@keyframes chat-slide-up {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
```

### Interaction Animations:
- **Hover transitions**: `var(--motion-duration-fast)` (200ms)
- **Focus transitions**: `var(--motion-duration-fast)` (200ms)
- **Modal entrance**: `var(--motion-duration-slow)` (400ms)

## 🔧 Component Props/States

### Chat Container States:
- **Loading**: Show typing indicators
- **Error**: Error message display
- **Empty**: Initial welcome state

### Message Types:
- **User message**: `message-user`
- **Assistant message**: `message-assistant` 
- **System message**: `message-system`
- **Task message**: `message-task`
- **Loading message**: `message-loading`

### Input States:
- **Default**: Normal input state
- **Focused**: Highlighted border
- **Disabled**: Loading/processing state
- **Error**: Validation error state

## 🎨 Theme Support

All components support both light and dark themes through:
- `[data-theme="light"]` selectors
- Transparent backgrounds with theme-aware opacity
- Consistent glass morphism effects
- Proper contrast ratios for accessibility

This specification ensures consistent, beautiful, and functional chat interfaces across all module assistants in the GenBooth Idea Lab.