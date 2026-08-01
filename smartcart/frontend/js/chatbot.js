/* =====================================================
   SmartCart AI Assistant — Floating Chatbot Widget
   Powered by Groq (llama-3.3-70b) via /api/chat
   ===================================================== */

(function () {
  'use strict';

  // ── State ──────────────────────────────────────────
  let scChatHistory = [];
  let scIsLoading = false;
  let scIsOpen = false;
  let scGreeted = false;

  // ── Build HTML ─────────────────────────────────────
  function buildWidget() {
    const widget = document.createElement('div');
    widget.id = 'sc-chat-widget';
    widget.innerHTML = `
      <!-- Floating Action Button -->
      <button id="sc-chat-fab" title="Chat with SmartAssist AI" aria-label="Open AI Assistant">
        <span class="fab-icon">🤖</span>
        <span class="fab-close">✕</span>
        <span class="fab-badge" id="sc-fab-badge" style="display:none">1</span>
      </button>

      <!-- Chat Window -->
      <div id="sc-chat-window" role="dialog" aria-label="SmartCart AI Assistant">

        <!-- Header -->
        <div class="sc-chat-header">
          <div class="sc-chat-avatar">🤖</div>
          <div class="sc-chat-header-info">
            <div class="sc-chat-header-name">SmartAssist AI</div>
            <div class="sc-chat-header-sub">
              <span class="sc-online-dot"></span> Online · SmartCart Support
            </div>
          </div>
          <div class="sc-chat-header-actions">
            <button class="sc-header-btn" id="sc-clear-btn" title="New Chat">🔄</button>
            <button class="sc-header-btn" id="sc-close-btn" title="Close">✕</button>
          </div>
        </div>

        <!-- Quick Action Chips -->
        <div class="sc-quick-chips" id="sc-chips">
          <button class="sc-chip" data-msg="Track my order">📦 Track Order</button>
          <button class="sc-chip" data-msg="I want to return a product">↩️ Return Product</button>
          <button class="sc-chip" data-msg="What are today's best deals?">🏷️ Best Deals</button>
          <button class="sc-chip" data-msg="Help me with payment issue">💳 Payment Help</button>
          <button class="sc-chip" data-msg="What is the delivery time?">🚚 Delivery Info</button>
          <button class="sc-chip" data-msg="Show me product recommendations">⭐ Recommendations</button>
        </div>

        <!-- Messages -->
        <div class="sc-messages" id="sc-messages">
          <div class="sc-welcome" id="sc-welcome">
            <div class="sc-welcome-emoji">🛒</div>
            <h4>Hi! I'm SmartAssist 👋</h4>
            <p>Your 24/7 AI shopping helper for SmartCart.<br/>Ask me anything about orders, products, returns or deals!</p>
          </div>
        </div>

        <!-- Input -->
        <div class="sc-input-area">
          <div class="sc-input-wrap">
            <textarea
              id="sc-user-input"
              placeholder="Ask me anything..."
              rows="1"
              aria-label="Type your message"
            ></textarea>
            <button id="sc-send-btn" title="Send message" aria-label="Send">
              ➤
            </button>
          </div>
          <p class="sc-input-note">Powered by Groq AI · Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    `;
    document.body.appendChild(widget);
  }

  // ── Toggle chat window ─────────────────────────────
  function toggleChat() {
    scIsOpen = !scIsOpen;
    const fab = document.getElementById('sc-chat-fab');
    const win = document.getElementById('sc-chat-window');
    fab.classList.toggle('open', scIsOpen);
    win.classList.toggle('open', scIsOpen);

    // Hide notification badge when opened
    if (scIsOpen) {
      hideBadge();
      if (!scGreeted) {
        scGreeted = true;
        // Auto-greet after a short delay
        setTimeout(() => {
          const user = getUserInfo();
          const greeting = user
            ? `Namaste ${user.name.split(' ')[0]}! 👋 SmartCart mein aapka swagat hai. Main aapki kaise madad kar sakta hoon aaj?`
            : `Namaste! 👋 Welcome to SmartCart. How can I assist you today?`;
          addBotMessage(greeting);
        }, 600);
      }
      setTimeout(() => document.getElementById('sc-user-input')?.focus(), 350);
    }
  }

  function closeChat() {
    scIsOpen = false;
    document.getElementById('sc-chat-fab').classList.remove('open');
    document.getElementById('sc-chat-window').classList.remove('open');
  }

  // ── Badge ──────────────────────────────────────────
  function showBadge() {
    const b = document.getElementById('sc-fab-badge');
    if (b && !scIsOpen) b.style.display = 'flex';
  }
  function hideBadge() {
    const b = document.getElementById('sc-fab-badge');
    if (b) b.style.display = 'none';
  }

  // ── Get SmartCart user info if logged in ───────────
  function getUserInfo() {
    try {
      const u = localStorage.getItem('sc_user');
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  }

  // ── Build SmartCart-specific system prompt ─────────
  function buildSystemPrompt() {
    const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const user = getUserInfo();
    const userCtx = user
      ? `\n\nCurrently logged-in customer: ${user.name} (${user.email}). Address their queries personally.`
      : '\n\nCustomer is currently not logged in.';

    return `You are SmartAssist, a professional, warm, and highly intelligent AI customer service agent for SmartCart — India's smartest online shopping destination (similar to Flipkart/Amazon).

About SmartCart:
- India's leading e-commerce platform selling Electronics, Mobiles, Laptops, Fashion, Home & Kitchen, Beauty, Sports, Books, Toys, Grocery and more
- Features: Fast delivery (2-5 days), Easy returns within 30 days, Secure payment via UPI, Cards, COD, Razorpay
- Customer support available 24/7
- Free delivery on orders above ₹499${userCtx}

Your personality:
- Warm, empathetic, and professional at all times
- Proactively helpful — always offer next steps or suggestions
- Concise but thorough — give useful answers without being too long
- Use emojis naturally to be friendly and engaging
- Respond in the SAME language the customer uses (Hindi, English, or Hinglish mix)
- If they write in Hinglish, respond in Hinglish too!

Your capabilities:
- Help with order tracking, returns, refunds, payment issues, shipping queries
- Answer product questions and make recommendations
- Explain SmartCart policies (return policy, delivery, EMI, etc.)
- Guide customers through checkout, account, and wishlist
- Assist with promo codes and deals

Important guidelines:
- NEVER make up specific order IDs, tracking numbers, or personal data
- For real order/account issues, tell them to visit My Orders / contact official support at support@smartcart.com
- For payment issues, always suggest verifying with their bank as well
- Always end responses with an offer to help further
- Keep responses under 180 words unless more detail is truly needed
- Current date/time in India: ${now}

Start fresh conversations with a warm, helpful greeting.`;
  }

  // ── Send Message ───────────────────────────────────
  async function sendMessage() {
    if (scIsLoading) return;

    const input = document.getElementById('sc-user-input');
    const text = input.value.trim();
    if (!text) return;

    // Remove welcome card on first message
    const welcome = document.getElementById('sc-welcome');
    if (welcome) welcome.remove();

    addUserMessage(text);
    input.value = '';
    input.style.height = 'auto';

    scChatHistory.push({ role: 'user', parts: [{ text }] });

    const typingId = showTyping();
    scIsLoading = true;
    document.getElementById('sc-send-btn').disabled = true;

    try {
      const response = await callChatAPI();
      removeTyping(typingId);
      addBotMessage(response);
      scChatHistory.push({ role: 'model', parts: [{ text: response }] });
    } catch (err) {
      removeTyping(typingId);
      addBotMessage(getErrorMsg(err), true);
    } finally {
      scIsLoading = false;
      document.getElementById('sc-send-btn').disabled = false;
      input.focus();
    }
  }

  // ── Call /api/chat endpoint ────────────────────────
  async function callChatAPI() {
    const systemPrompt = buildSystemPrompt();
    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'Understood! I will follow these instructions as SmartAssist.' }] },
      ...scChatHistory
    ];

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
    });

    if (!res.ok) {
      let errMsg = 'API Error';
      try { const d = await res.json(); errMsg = d?.error?.message || errMsg; } catch (_) {}
      throw { status: res.status, message: errMsg };
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return "I'm sorry, I couldn't generate a response. Please try again.";
    return text;
  }

  // ── DOM Helpers ────────────────────────────────────
  function addUserMessage(text) {
    const container = document.getElementById('sc-messages');
    const time = getTime();
    const el = document.createElement('div');
    el.className = 'sc-msg user';
    el.innerHTML = `
      <div class="sc-msg-av">👤</div>
      <div class="sc-msg-wrap">
        <div class="sc-bubble">${escapeHtml(text)}</div>
        <div class="sc-msg-time">${time}</div>
      </div>`;
    container.appendChild(el);
    scrollBottom();
  }

  function addBotMessage(text, isError = false) {
    const container = document.getElementById('sc-messages');
    const time = getTime();
    const el = document.createElement('div');
    el.className = 'sc-msg bot';
    el.innerHTML = `
      <div class="sc-msg-av">🤖</div>
      <div class="sc-msg-wrap">
        <div class="sc-bubble${isError ? ' error' : ''}">${formatText(text)}</div>
        <div class="sc-msg-time">${time}</div>
      </div>`;
    container.appendChild(el);
    scrollBottom();
  }

  function showTyping() {
    const container = document.getElementById('sc-messages');
    const id = 'sc-typing-' + Date.now();
    const el = document.createElement('div');
    el.className = 'sc-typing';
    el.id = id;
    el.innerHTML = `
      <div class="sc-msg-av">🤖</div>
      <div class="sc-typing-bubble">
        <div class="sc-typing-dot"></div>
        <div class="sc-typing-dot"></div>
        <div class="sc-typing-dot"></div>
      </div>`;
    container.appendChild(el);
    scrollBottom();
    return id;
  }

  function removeTyping(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  function clearChat() {
    scChatHistory = [];
    scGreeted = false;
    const container = document.getElementById('sc-messages');
    container.innerHTML = `
      <div class="sc-welcome" id="sc-welcome">
        <div class="sc-welcome-emoji">🛒</div>
        <h4>Chat Cleared ✨</h4>
        <p>Starting a fresh conversation. How can I help you?</p>
      </div>`;
    setTimeout(() => {
      const user = getUserInfo();
      const greeting = user
        ? `Welcome back, ${user.name.split(' ')[0]}! 😊 What can I help you with?`
        : `Hello! 👋 How can I assist you with your SmartCart shopping today?`;
      addBotMessage(greeting);
    }, 500);
  }

  function scrollBottom() {
    const c = document.getElementById('sc-messages');
    if (c) c.scrollTop = c.scrollHeight;
  }

  function getTime() {
    return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  function escapeHtml(t) {
    return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function formatText(text) {
    return escapeHtml(text)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code style="background:rgba(40,116,240,0.1);padding:1px 5px;border-radius:3px;font-size:12px;">$1</code>')
      .replace(/\n/g, '<br>');
  }

  function getErrorMsg(err) {
    if (err?.status === 429) return '⏱️ Bahut zyada requests! Thoda wait karke try karein.';
    if (err?.status === 500) return '🔧 Server error: ' + (err?.message || 'Please try again in a moment.');
    if (err?.message?.includes('fetch')) return '📡 Network error. Please check your internet connection.';
    return `⚠️ Something went wrong: ${err?.message || 'Unknown error'}. Please try again.`;
  }

  // ── Auto-resize textarea ───────────────────────────
  function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 90) + 'px';
  }

  // ── Init ───────────────────────────────────────────
  function init() {
    buildWidget();

    // FAB click
    document.getElementById('sc-chat-fab').addEventListener('click', toggleChat);

    // Close button
    document.getElementById('sc-close-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      closeChat();
    });

    // Clear/New chat button
    document.getElementById('sc-clear-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      clearChat();
    });

    // Send button
    document.getElementById('sc-send-btn').addEventListener('click', sendMessage);

    // Enter to send
    document.getElementById('sc-user-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // Auto-resize textarea
    document.getElementById('sc-user-input').addEventListener('input', function () {
      autoResize(this);
    });

    // Quick chips
    document.getElementById('sc-chips').addEventListener('click', (e) => {
      const chip = e.target.closest('.sc-chip');
      if (!chip) return;
      const msg = chip.dataset.msg;
      if (!msg) return;
      document.getElementById('sc-user-input').value = msg;
      if (!scIsOpen) toggleChat();
      setTimeout(() => sendMessage(), 100);
    });

    // Close on outside click (only on mobile)
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 480 && scIsOpen) {
        const win = document.getElementById('sc-chat-window');
        const fab = document.getElementById('sc-chat-fab');
        if (!win.contains(e.target) && !fab.contains(e.target)) {
          closeChat();
        }
      }
    });

    // Show badge after 5 seconds to attract attention (first visit only)
    const hasSeenBadge = sessionStorage.getItem('sc_chat_badge_shown');
    if (!hasSeenBadge) {
      setTimeout(() => {
        if (!scIsOpen) {
          showBadge();
          sessionStorage.setItem('sc_chat_badge_shown', '1');
        }
      }, 5000);
    }
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
