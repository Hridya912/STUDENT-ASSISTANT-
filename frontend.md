# FRONTEND.md — Interface and Visual Design

## 1. Design direction

The interface should feel like a modern AI product: minimal, focused, premium, and easy to use.

**Primary style:** black-focused dark UI with white and soft-grey text.

**Accent colours:** a restrained violet-to-blue gradient, with a subtle cyan highlight. The gradient should add depth without making the interface look colourful or busy.

## 2. Colour palette

| Purpose | Colour | Hex |
|---|---|---|
| Main page background | Near black | `#08090D` |
| Secondary background | Deep charcoal | `#101116` |
| Cards / panels | Dark grey | `#151720` |
| Borders | Muted grey | `#292C38` |
| Main text | Soft white | `#F5F6FA` |
| Secondary text | Cool grey | `#A4A8B5` |
| Accent violet | Violet | `#8B5CF6` |
| Accent blue | Blue | `#3B82F6` |
| Accent cyan | Cyan | `#22D3EE` |

Suggested gradient:

```css
linear-gradient(110deg, #8B5CF6 0%, #3B82F6 55%, #22D3EE 100%)
```

Use the gradient for the main call-to-action, a small logo detail, focus rings, or a subtle background glow. Do not use it behind every card.

## 3. Page layout

### Header

- Small product mark and the name **Grok Student Assistant** on the left.
- A small status label such as **AI study assistant**.
- Keep the header simple and avoid unnecessary navigation links.

### Main hero area

- Main heading: **Your study companion, powered by Grok.**
- Supporting text: **Ask a question. Get a clear explanation. Keep learning.**
- A subtle violet/blue radial glow behind the heading.
- Avoid oversized illustrations; the chat interface should be the main focus.

### Chat panel

- A centred chat container with a maximum width around 800–900px.
- Dark charcoal surface, thin border, and rounded corners.
- User messages aligned to the right with a subtle tinted background.
- AI answers aligned to the left with a slightly different dark surface.
- Preserve line breaks and readable spacing in answers.
- Show a small loading indicator while waiting for Grok.

### Input area

- Multiline text box with placeholder: **Ask anything about your studies...**
- Send button with a violet-blue gradient.
- Enter sends the message; Shift + Enter inserts a new line.
- Disable the send button while a request is in progress.
- Keep the input usable on narrow screens.

### Footer note

Display a small disclaimer:

> AI-generated answers may contain mistakes. Verify important information with trusted learning resources.

## 4. Interaction states

1. **Empty state:** Show the hero message and optional example question chips.
2. **Typing state:** The text area accepts the question.
3. **Loading state:** Show “Thinking…” and prevent duplicate submissions.
4. **Success state:** Add the user's question and the AI answer to the conversation.
5. **Error state:** Show a short, readable error and allow the user to retry.
6. **Mobile state:** Stack elements vertically and keep the input within the viewport.

## 5. Accessibility and usability

- Use semantic HTML elements such as `header`, `main`, `section`, `form`, and `footer`.
- Provide a visible label or accessible name for the question input.
- Maintain strong contrast between text and backgrounds.
- Use keyboard focus styles; do not remove outlines without providing a replacement.
- Make buttons large enough to tap comfortably.
- Use `aria-live="polite"` for the response area or status messages.
- Respect `prefers-reduced-motion` and avoid excessive animation.

## 6. Suggested CSS foundation

```css
:root {
  color-scheme: dark;
  --bg: #08090D;
  --surface: #101116;
  --panel: #151720;
  --border: #292C38;
  --text: #F5F6FA;
  --muted: #A4A8B5;
  --violet: #8B5CF6;
  --blue: #3B82F6;
  --cyan: #22D3EE;
  --accent: linear-gradient(110deg, var(--violet), var(--blue), var(--cyan));
}

body {
  margin: 0;
  min-height: 100vh;
  background:
    radial-gradient(ellipse at 50% 0%, rgba(91, 63, 180, 0.20), transparent 42%),
    var(--bg);
  color: var(--text);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
}

.chat-panel {
  background: rgba(21, 23, 32, 0.92);
  border: 1px solid var(--border);
  border-radius: 20px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
}

.send-button {
  color: white;
  background: var(--accent);
  border: 0;
  border-radius: 12px;
}

:focus-visible {
  outline: 2px solid var(--cyan);
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 7. Frontend-to-backend contract

The browser sends:

```http
POST /api/chat
Content-Type: application/json
```

```json
{
  "message": "What is a cloud server?"
}
```

On success, the browser receives:

```json
{
  "answer": "A cloud server is..."
}
```

On failure, it receives:

```json
{
  "error": "Please try again."
}
```

The frontend must never call `https://api.x.ai` directly. It calls only the same-origin `/api/chat` endpoint so the API key remains on the server.
