/* ==========================================
   Chatbot Widget (Frontend) - Restaurant/Bar Edition
   - Floating chat widget with FAQ intent matching
   - Clickable suggestion chips
   - Basic multi-turn memory (lastTopic)
   - Backend-ready (swap to /api/chat later)
========================================== */

/* ---------------------------
   1) Widget configuration
---------------------------- */
const CHATBOT_CONFIG = {
  botName: "Site Assistant",
  botSubtitle: "Quick answers: hours • menu • reservations",
  // Later, when backend exists, set useBackend = true
  useBackend: false,
  endpoint: "/api/chat",
};

/* ---------------------------
   2) Boot the widget
---------------------------- */
initChatbotWidget();

function initChatbotWidget() {
  const root = document.getElementById("chatbot-root");
  if (!root) {
    console.warn("Chatbot root element not found (#chatbot-root).");
    return;
  }

  root.innerHTML = `
    <button class="chatbot-launcher" id="chatbot-launcher" aria-label="Open chat">
      Chat
    </button>

    <section class="chatbot-panel" id="chatbot-panel" aria-live="polite">
      <header class="chatbot-header">
        <div class="chatbot-title">
          <strong>${escapeHtml(CHATBOT_CONFIG.botName)}</strong>
          <span>${escapeHtml(CHATBOT_CONFIG.botSubtitle)}</span>
        </div>
        <button class="chatbot-close" id="chatbot-close" aria-label="Close chat">✕</button>
      </header>

      <div class="chatbot-messages" id="chatbot-messages"></div>

      <form class="chatbot-inputbar" id="chatbot-form">
        <input
          class="chatbot-input"
          id="chatbot-input"
          type="text"
          placeholder="Ask about hours, menu, reservations..."
          autocomplete="off"
        />
        <button class="chatbot-send" id="chatbot-send" type="submit">Send</button>
      </form>
    </section>
  `;

  const launcher = document.getElementById("chatbot-launcher");
  const panel = document.getElementById("chatbot-panel");
  const closeBtn = document.getElementById("chatbot-close");
  const form = document.getElementById("chatbot-form");
  const input = document.getElementById("chatbot-input");

  launcher.addEventListener("click", () => {
    const isOpen = panel.classList.contains("is-open");

    // Toggle panel
    panel.classList.toggle("is-open");

    // Only focus + greet when opening
    if (!isOpen) {
      input.focus();

      if (!panel.dataset.greeted) {
        panel.dataset.greeted = "true";
        addBotMessage({
          text: "Hey! I can help with <strong>hours</strong>, <strong>menu</strong>, <strong>reservations</strong>, <strong>happy hour</strong>, and <strong>events</strong>. What do you need?",
          suggestions: [
            { label: "Hours", message: "What are your hours?" },
            { label: "Menu", message: "Can I see the menu?" },
            { label: "Reservations", message: "Do you take reservations?" },
            { label: "Happy Hour", message: "When is happy hour?" },
            { label: "Events", message: "Any events tonight?" },
          ],
        });
      }
    }
  });

  closeBtn.addEventListener("click", () => {
    panel.classList.remove("is-open");
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    await handleSendMessage(text);
  });
}

/* Reusable send (also used by suggestion chips) */
async function handleSendMessage(text) {
  const input = document.getElementById("chatbot-input");

  addUserMessage(text);

  const typingId = addTypingIndicator();

  try {
    const reply = await chatProvider(text);
    removeTypingIndicator(typingId);
    addBotMessage(reply);
  } catch (err) {
    removeTypingIndicator(typingId);
    addBotMessage("Sorry — something went wrong. Try again.");
    console.error(err);
  } finally {
    input?.focus();
  }
}

/* ---------------------------
   3) UI helpers
---------------------------- */
function addUserMessage(text) {
  addMessageRow("user", text);
}

function addBotMessage(content) {
  addMessageRow("bot", content);
}

function addMessageRow(role, content) {
  const messages = document.getElementById("chatbot-messages");
  const time = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const row = document.createElement("div");
  row.className = `chatbot-row ${role}`;

  const payload = typeof content === "string" ? { text: content } : content;

  const bubbleHtml =
    role === "user" ? escapeHtml(payload.text) : renderBotText(payload.text);

  const suggestionsHtml =
    role === "bot" && Array.isArray(payload.suggestions)
      ? renderSuggestions(payload.suggestions)
      : "";

  row.innerHTML = `
    <div>
      <div class="chatbot-bubble">
        <div>${bubbleHtml}</div>
        ${suggestionsHtml}
      </div>
      <div class="chatbot-meta">${time}</div>
    </div>
  `;

  messages.appendChild(row);
  messages.scrollTop = messages.scrollHeight;

  if (role === "bot" && Array.isArray(payload.suggestions)) {
    row.querySelectorAll("[data-suggest]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const suggestedText = btn.getAttribute("data-suggest");
        await handleSendMessage(suggestedText);
      });
    });
  }
}

function addTypingIndicator() {
  const messages = document.getElementById("chatbot-messages");
  const id = `typing-${crypto.randomUUID()}`;

  const row = document.createElement("div");
  row.className = "chatbot-row bot";
  row.id = id;

  row.innerHTML = `
    <div class="chatbot-bubble">
      <span class="typing" aria-label="Bot is typing">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </span>
    </div>
  `;

  messages.appendChild(row);
  messages.scrollTop = messages.scrollHeight;
  return id;
}

function removeTypingIndicator(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* Allow only minimal HTML we generate (<strong>, <a>) */
function renderBotText(text) {
  return escapeHtml(text)
    .replaceAll("&lt;strong&gt;", "<strong>")
    .replaceAll("&lt;/strong&gt;", "</strong>")
    .replaceAll("&lt;a ", "<a ")
    .replaceAll("&lt;/a&gt;", "</a>")
    .replaceAll("&gt;", ">");
}

function renderSuggestions(suggestions) {
  const buttons = suggestions
    .map(
      (s) =>
        `<button type="button" class="chatbot-suggest" data-suggest="${escapeHtml(
          s.message
        )}">${escapeHtml(s.label)}</button>`
    )
    .join("");

  return `<div class="chatbot-suggest-row">${buttons}</div>`;
}

/* ---------------------------
   4) Chat provider (architecture seam)
---------------------------- */
async function chatProvider(userText) {
  if (CHATBOT_CONFIG.useBackend) return backendChat(userText);
  return fakeApiChat(userText);
}

async function backendChat(userText) {
  const res = await fetch(CHATBOT_CONFIG.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: userText }),
  });

  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  return data.reply || "No reply field returned.";
}

/* ==========================================
   FREE FAQ response engine (Restaurant/Bar)
========================================== */

/* Tip: Replace these placeholders per client:
   - hours text
   - reservation link
   - menu link
   - phone number
*/
const RESTAURANT_INFO = {
  name: "Your Restaurant",
  menuUrl: "#", // e.g. "/menu" or external menu link
  reservationsUrl: "#", // e.g. OpenTable link
  phone: "(555) 555-5555",
};

const FAQ_KB = [
  {
    topic: "hours",
    keywords: [
      "hours",
      "open",
      "close",
      "closing",
      "when are you open",
      "time",
      "today",
      "tonight",
    ],
    answer:
      "We’re open Sun–Thu 11am–10pm and Fri–Sat 11am–12am. Kitchen closes 30 minutes before close.",
  },
  {
    topic: "menu",
    keywords: [
      "menu",
      "food",
      "eat",
      "drinks",
      "cocktails",
      "beer",
      "wine",
      "what do you have",
      "items",
    ],
    answer: `You can view our menu here: <a href="${RESTAURANT_INFO.menuUrl}" target="_blank" rel="noopener">Menu</a>. Want food, drinks, or both?`,
  },
  {
    topic: "reservations",
    keywords: [
      "reservation",
      "reservations",
      "reserve",
      "book a table",
      "table",
      "party",
      "waitlist",
    ],
    answer: `Yes — you can reserve here: <a href="${RESTAURANT_INFO.reservationsUrl}" target="_blank" rel="noopener">Reservations</a>. What day/time and party size?`,
  },
  {
    topic: "happyhour",
    keywords: [
      "happy hour",
      "happyhour",
      "specials",
      "deals",
      "discount",
      "hh",
    ],
    answer:
      "Happy hour is Mon–Fri 3pm–6pm. Drink specials + select appetizers.",
  },
  {
    topic: "events",
    keywords: [
      "events",
      "live music",
      "music",
      "dj",
      "trivia",
      "karaoke",
      "tonight",
      "this weekend",
    ],
    answer:
      "We run events weekly (trivia, live music, or karaoke depending on the night). Want to know what’s happening tonight or this weekend?",
  },
  {
    topic: "dietary",
    keywords: [
      "vegan",
      "vegetarian",
      "gluten",
      "gluten-free",
      "allergy",
      "dairy-free",
      "dietary",
    ],
    answer:
      "We have vegetarian options and can accommodate many dietary needs. Tell me your restriction (gluten-free, dairy-free, etc.) and I’ll point you to good choices.",
  },
  {
    topic: "parking",
    keywords: [
      "parking",
      "park",
      "where do i park",
      "garage",
      "street parking",
    ],
    answer:
      "Street parking is available nearby, and there’s usually a public lot within a short walk. If you tell me what time you’re coming, I can suggest the easiest option.",
  },
  {
    topic: "dresscode",
    keywords: [
      "dress",
      "dress code",
      "dresscode",
      "attire",
      "what should i wear",
    ],
    answer:
      "Dress code is casual. If there’s a special event night, it may be slightly elevated — but no need to dress up unless you want to.",
  },
  {
    topic: "contact",
    keywords: ["phone", "call", "contact", "number", "how do i reach you"],
    answer: `You can reach us at <strong>${RESTAURANT_INFO.phone}</strong>. Want me to help with reservations or directions?`,
  },
];

const CHAT_MEMORY = { lastTopic: null };

async function fakeApiChat(userText) {
  await sleep(300);
  const input = normalize(userText);

  // Quick “help” shortcut
  if (input === "help" || input === "menu" || input === "hours") {
    return {
      text: "Here are the main things I can help with:",
      suggestions: [
        { label: "Hours", message: "What are your hours today?" },
        { label: "Menu", message: "Can I see the menu?" },
        { label: "Reservations", message: "Do you take reservations?" },
        { label: "Happy Hour", message: "When is happy hour?" },
        { label: "Dietary", message: "Do you have gluten-free options?" },
      ],
    };
  }

  // Short follow-up: try last topic
  if (isShortFollowUp(input) && CHAT_MEMORY.lastTopic) {
    const follow = answerFromTopic(CHAT_MEMORY.lastTopic, input);
    if (follow) return follow;
  }

  const best = findBestFaqMatch(input);

  if (best && best.score >= 1) {
    CHAT_MEMORY.lastTopic = best.faq.topic;

    // Topic-based extra helpfulness
    if (best.faq.topic === "menu") {
      return {
        text: best.faq.answer,
        suggestions: [
          { label: "Food options", message: "What food is popular?" },
          { label: "Drinks", message: "What drinks do you have?" },
          { label: "Happy Hour", message: "When is happy hour?" },
        ],
      };
    }

    if (best.faq.topic === "reservations") {
      return {
        text: best.faq.answer,
        suggestions: [
          { label: "Reserve now", message: "Reservations" },
          { label: "Large party", message: "Do you take large parties?" },
          { label: "Wait time", message: "What’s the wait time tonight?" },
        ],
      };
    }

    return best.faq.answer;
  }

  // Fallback with guidance
  return {
    text: "I can help faster if you pick a topic:",
    suggestions: [
      { label: "Hours", message: "What are your hours?" },
      { label: "Menu", message: "Can I see the menu?" },
      { label: "Reservations", message: "Do you take reservations?" },
      { label: "Happy Hour", message: "When is happy hour?" },
      { label: "Events", message: "Any events tonight?" },
    ],
  };
}

/* ---------------------------
   Matching helpers
---------------------------- */
function findBestFaqMatch(input) {
  let best = null;

  for (const faq of FAQ_KB) {
    let score = 0;

    for (const kw of faq.keywords) {
      const kwNorm = normalize(kw);

      // phrase gets more weight
      if (kwNorm.includes(" ")) {
        if (input.includes(kwNorm)) score += 2;
      } else {
        if (hasWord(input, kwNorm)) score += 1;
      }
    }

    if (!best || score > best.score) best = { faq, score };
  }

  return best;
}

function answerFromTopic(topic, input) {
  const faq = FAQ_KB.find((f) => f.topic === topic);
  if (!faq) return null;

  // If they mention a keyword, answer
  for (const kw of faq.keywords) {
    const kwNorm = normalize(kw);
    if (kwNorm.includes(" ")) {
      if (input.includes(kwNorm)) return faq.answer;
    } else {
      if (hasWord(input, kwNorm)) return faq.answer;
    }
  }

  // Gentle confirmation for short follow-ups
  if (isShortFollowUp(input)) {
    return {
      text: `Are you asking about <strong>${topic}</strong>? If yes: ${faq.answer}`,
      suggestions: [
        { label: "Yes", message: `Tell me about ${topic}` },
        { label: "Show topics", message: "help" },
      ],
    };
  }

  return null;
}

function normalize(str) {
  return String(str).toLowerCase().trim();
}

function hasWord(text, word) {
  const pattern = new RegExp(`\\b${escapeRegex(word)}\\b`, "i");
  return pattern.test(text);
}

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isShortFollowUp(input) {
  const wordCount = input.split(/\s+/).filter(Boolean).length;
  return wordCount <= 4;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
