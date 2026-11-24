/**
 * Grok Student Assistant — Client-side Application Logic
 * Manages chat interactions, input handling, markdown formatting,
 * error handling, and communicates with the /api/chat serverless endpoint.
 */

(function () {
  'use strict';

  // DOM Elements
  const chatForm = document.getElementById('chat-form');
  const questionInput = document.getElementById('question-input');
  const sendButton = document.getElementById('send-button');
  const messagesContainer = document.getElementById('messages-container');
  const charCounter = document.getElementById('char-counter');
  const clearChatBtn = document.getElementById('clear-chat-btn');
  const heroSection = document.getElementById('hero-section');
  const welcomeCard = document.getElementById('welcome-card');
  const chipButtons = document.querySelectorAll('.chip-btn');

  const MAX_CHARS = 2000;
  let isSubmitting = false;
  let hasUserInteracted = false;

  // Initialize
  function init() {
    setupEventListeners();
    updateCharCounter();
    autoResizeTextarea();
  }

  function setupEventListeners() {
    // Form submission
    chatForm.addEventListener('submit', handleSubmit);

    // Textarea input and key handling
    questionInput.addEventListener('input', () => {
      updateCharCounter();
      autoResizeTextarea();
    });

    questionInput.addEventListener('keydown', (e) => {
      // Enter without Shift sends the message
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!isSubmitting) {
          chatForm.requestSubmit();
        }
      }
    });

    // Suggestion chips
    chipButtons.forEach((chip) => {
      chip.addEventListener('click', () => {
        const prompt = chip.getAttribute('data-prompt');
        if (prompt) {
          questionInput.value = prompt;
          updateCharCounter();
          autoResizeTextarea();
          questionInput.focus();
          // Directly submit the selected chip prompt
          chatForm.requestSubmit();
        }
      });
    });

    // Clear conversation
    clearChatBtn.addEventListener('click', handleClearChat);
  }

  // Update character count and apply warning styling
  function updateCharCounter() {
    const length = questionInput.value.length;
    charCounter.textContent = `${length.toLocaleString()} / ${MAX_CHARS.toLocaleString()}`;

    if (length > MAX_CHARS) {
      charCounter.className = 'char-counter error';
      sendButton.disabled = true;
    } else if (length > MAX_CHARS * 0.85) {
      charCounter.className = 'char-counter warning';
      sendButton.disabled = isSubmitting;
    } else {
      charCounter.className = 'char-counter';
      sendButton.disabled = isSubmitting || length === 0;
    }
  }

  // Auto-resize textarea to fit content up to max-height
  function autoResizeTextarea() {
    questionInput.style.height = 'auto';
    questionInput.style.height = Math.min(questionInput.scrollHeight, 160) + 'px';
  }

  // Handle form submission
  async function handleSubmit(e) {
    e.preventDefault();

    const rawMessage = questionInput.value;
    const message = rawMessage.trim();

    if (!message) {
      showError('Please enter a question before sending.');
      questionInput.focus();
      return;
    }

    if (message.length > MAX_CHARS) {
      showError(`Your question is ${message.length} characters long. Please keep it under ${MAX_CHARS} characters.`);
      return;
    }

    if (isSubmitting) return;

    // Transition UI from landing state to active chat
    if (!hasUserInteracted) {
      hasUserInteracted = true;
      if (welcomeCard) {
        welcomeCard.style.display = 'none';
      }
    }

    // Append User Message to UI
    appendUserMessage(message);

    // Reset input
    questionInput.value = '';
    updateCharCounter();
    autoResizeTextarea();

    // Set loading state
    setSubmittingState(true);
    const loadingRow = showLoadingIndicator();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      });

      const data = await response.json().catch(() => null);

      // Remove loading indicator
      loadingRow.remove();

      if (!response.ok) {
        const errorMsg = data?.error || `Server responded with status ${response.status}. Please try again.`;
        appendAssistantError(errorMsg, message);
        return;
      }

      if (!data || !data.answer) {
        appendAssistantError('No response returned by the assistant. Please try again.', message);
        return;
      }

      // Append Assistant Message to UI
      appendAssistantMessage(data.answer);

    } catch (err) {
      console.error('Fetch error:', err);
      loadingRow.remove();
      appendAssistantError(
        'Unable to connect to the assistant. Check your internet connection or try again later.',
        message
      );
    } finally {
      setSubmittingState(false);
      questionInput.focus();
    }
  }

  // Manage submitting UI state
  function setSubmittingState(loading) {
    isSubmitting = loading;
    sendButton.disabled = loading || questionInput.value.trim().length === 0;
    questionInput.disabled = loading;
  }

  // Append user message bubble
  function appendUserMessage(text) {
    const row = document.createElement('div');
    row.className = 'message-row user';

    const avatar = document.createElement('div');
    avatar.className = 'avatar user-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = 'You';

    const content = document.createElement('div');
    content.className = 'message-content';

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text; // Secure textContent against XSS

    const meta = document.createElement('div');
    meta.className = 'message-meta';
    meta.textContent = formatTime(new Date());

    content.appendChild(bubble);
    content.appendChild(meta);
    row.appendChild(avatar);
    row.appendChild(content);

    messagesContainer.appendChild(row);
    scrollToBottom();
  }

  // Append assistant response bubble
  function appendAssistantMessage(text) {
    const row = document.createElement('div');
    row.className = 'message-row assistant';

    const avatar = document.createElement('div');
    avatar.className = 'avatar ai-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = 'G';

    const content = document.createElement('div');
    content.className = 'message-content';

    const bubble = document.createElement('div');
    bubble.className = 'bubble formatted-content';
    bubble.innerHTML = formatMarkdown(text);

    const meta = document.createElement('div');
    meta.className = 'message-meta';
    meta.textContent = `Grok • ${formatTime(new Date())}`;

    // Copy button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.setAttribute('type', 'button');
    copyBtn.setAttribute('aria-label', 'Copy answer to clipboard');
    copyBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      <span>Copy</span>
    `;

    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(text);
        copyBtn.classList.add('copied');
        copyBtn.querySelector('span').textContent = 'Copied!';
        setTimeout(() => {
          copyBtn.classList.remove('copied');
          copyBtn.querySelector('span').textContent = 'Copy';
        }, 2000);
      } catch {
        copyBtn.querySelector('span').textContent = 'Failed';
      }
    });

    content.appendChild(bubble);
    content.appendChild(meta);
    content.appendChild(copyBtn);

    row.appendChild(avatar);
    row.appendChild(content);

    messagesContainer.appendChild(row);
    scrollToBottom();
  }

  // Display loading indicator
  function showLoadingIndicator() {
    const row = document.createElement('div');
    row.className = 'loading-row';
    row.setAttribute('aria-live', 'polite');

    const avatar = document.createElement('div');
    avatar.className = 'avatar ai-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = 'G';

    const typing = document.createElement('div');
    typing.className = 'typing-indicator';
    typing.innerHTML = `
      <span>Thinking</span>
      <div class="typing-dots" aria-hidden="true">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `;

    row.appendChild(avatar);
    row.appendChild(typing);
    messagesContainer.appendChild(row);
    scrollToBottom();
    return row;
  }

  // Display inline assistant error with retry option
  function appendAssistantError(errorMsg, originalMessage) {
    const errorCard = document.createElement('div');
    errorCard.className = 'error-card';
    errorCard.setAttribute('role', 'alert');

    const errorText = document.createElement('span');
    errorText.textContent = errorMsg;
    errorCard.appendChild(errorText);

    if (originalMessage) {
      const retryBtn = document.createElement('button');
      retryBtn.setAttribute('type', 'button');
      retryBtn.textContent = 'Retry';
      retryBtn.addEventListener('click', () => {
        errorCard.remove();
        questionInput.value = originalMessage;
        updateCharCounter();
        autoResizeTextarea();
        chatForm.requestSubmit();
      });
      errorCard.appendChild(retryBtn);
    }

    messagesContainer.appendChild(errorCard);
    scrollToBottom();
  }

  // Toast / transient notification
  function showError(msg) {
    appendAssistantError(msg, null);
  }

  // Clear conversation history
  function handleClearChat() {
    messagesContainer.innerHTML = '';
    if (welcomeCard) {
      messagesContainer.appendChild(welcomeCard);
      welcomeCard.style.display = 'flex';
    }
    hasUserInteracted = false;
    questionInput.value = '';
    updateCharCounter();
    autoResizeTextarea();
    questionInput.focus();
  }

  // Helpers
  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Sanitize and format basic markdown: headings, bold, italics, code blocks, lists
  function formatMarkdown(raw) {
    if (!raw) return '';

    // Step 1: HTML escape
    let text = raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Step 2: Code blocks ```lang ... ```
    text = text.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre><code>${code.trim()}</code></pre>`;
    });

    // Step 3: Inline code `code`
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Step 4: Headings ### Heading
    text = text.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    text = text.replace(/^## (.*$)/gim, '<h3>$1</h3>');
    text = text.replace(/^# (.*$)/gim, '<h3>$1</h3>');

    // Step 5: Bold and Italic
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Step 6: Lists
    // Bullet list items
    text = text.replace(/^\s*[-*]\s+(.*)$/gim, '<li>$1</li>');
    // Numbered list items
    text = text.replace(/^\s*(\d+)\.\s+(.*)$/gim, '<li>$2</li>');

    // Wrap contiguous <li> with <ul>
    text = text.replace(/(<li>.*<\/li>(\s*<li>.*<\/li>)*)/g, '<ul>$1</ul>');

    // Step 7: Paragraphs (split by double newline if not inside list/pre)
    const blocks = text.split(/\n\n+/);
    return blocks.map((block) => {
      block = block.trim();
      if (!block) return '';
      if (block.startsWith('<h') || block.startsWith('<ul') || block.startsWith('<pre')) {
        return block;
      }
      return `<p>${block.replace(/\n/g, '<br>')}</p>`;
    }).join('');
  }

  // Start app
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
