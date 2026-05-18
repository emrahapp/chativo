/*! Chativo widget — Faz 1 MVP build
 *  Self-contained, no deps. Uses Shadow DOM for style isolation.
 *  Embed: <script src="/widget.js" data-chatbot-id="..." async defer></script>
 */
(function () {
  "use strict";

  // ── Read script attrs ────────────────────────────────────────
  var script =
    document.currentScript ||
    (function () {
      var s = document.querySelectorAll("script[data-chatbot-id]");
      return s[s.length - 1];
    })();
  if (!script) return;
  var CHATBOT_ID = script.getAttribute("data-chatbot-id");
  if (!CHATBOT_ID) return;

  var BASE = new URL(script.src, location.href).origin;
  var VISITOR_KEY = "chativo_visitor_id";
  var CONVO_KEY = "chativo_convo_" + CHATBOT_ID;
  var OPEN_KEY = "chativo_open_" + CHATBOT_ID;

  // ── Visitor / convo persistence ──────────────────────────────
  function uid() {
    return (
      Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
    );
  }
  function getVisitorId() {
    var id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = "v_" + uid();
      try { localStorage.setItem(VISITOR_KEY, id); } catch (_) {}
    }
    return id;
  }
  function getConvoId() { try { return localStorage.getItem(CONVO_KEY); } catch (_) { return null; } }
  function setConvoId(v) { try { localStorage.setItem(CONVO_KEY, v); } catch (_) {} }

  // ── Shadow host + styles ─────────────────────────────────────
  var host = document.createElement("div");
  host.id = "chativo-widget-root";
  host.style.cssText = "position:fixed;z-index:2147483646;pointer-events:none;inset:0;";
  document.body.appendChild(host);
  var root = host.attachShadow({ mode: "open" });

  var STYLES = "\n" +
    ":host,*{box-sizing:border-box;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}\n" +
    ".launcher{position:fixed;bottom:20px;width:56px;height:56px;border-radius:9999px;border:0;cursor:pointer;color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(0,0,0,.18);transition:transform .15s ease;pointer-events:auto}\n" +
    ".launcher:hover{transform:scale(1.06)}\n" +
    ".launcher svg{width:24px;height:24px}\n" +
    ".pos-right{right:20px}\n" +
    ".pos-left{left:20px}\n" +
    ".panel{position:fixed;bottom:88px;width:380px;max-width:calc(100vw - 24px);height:600px;max-height:calc(100vh - 120px);background:#fff;border-radius:18px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 24px 80px rgba(0,0,0,.18);pointer-events:auto;animation:cv-pop .18s ease-out}\n" +
    "@keyframes cv-pop{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}\n" +
    ".header{padding:14px 16px;color:#fff;display:flex;align-items:center;justify-content:space-between;gap:12px}\n" +
    ".header .meta{display:flex;align-items:center;gap:10px;min-width:0}\n" +
    ".avatar{width:36px;height:36px;border-radius:9999px;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex:none}\n" +
    ".meta h4{margin:0;font-size:14px;font-weight:600;line-height:1.1}\n" +
    ".meta p{margin:2px 0 0;font-size:11px;opacity:.85;display:flex;align-items:center;gap:6px}\n" +
    ".dot{width:6px;height:6px;border-radius:9999px;background:#10b981;display:inline-block;animation:cv-pulse 1.5s infinite}\n" +
    "@keyframes cv-pulse{0%,100%{opacity:1}50%{opacity:.4}}\n" +
    ".close{background:transparent;border:0;color:#fff;cursor:pointer;padding:6px;border-radius:8px;opacity:.85}\n" +
    ".close:hover{opacity:1;background:rgba(255,255,255,.15)}\n" +
    ".messages{flex:1;overflow-y:auto;padding:18px;background:#f8f8fc;display:flex;flex-direction:column;gap:10px;scroll-behavior:smooth}\n" +
    ".messages::-webkit-scrollbar{width:6px}\n" +
    ".messages::-webkit-scrollbar-thumb{background:#dadce6;border-radius:3px}\n" +
    ".msg{max-width:85%;padding:10px 14px;border-radius:16px;font-size:14px;line-height:1.5;word-wrap:break-word;white-space:pre-wrap}\n" +
    ".msg.user{align-self:flex-end;color:#fff;border-top-right-radius:4px}\n" +
    ".msg.bot{align-self:flex-start;background:#fff;color:#111827;border:1px solid #ececf4;border-top-left-radius:4px}\n" +
    ".msg.err{align-self:stretch;background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;text-align:center;font-size:13px}\n" +
    ".typing{align-self:flex-start;background:#fff;border:1px solid #ececf4;border-radius:16px;padding:10px 14px;display:flex;gap:4px}\n" +
    ".typing span{width:6px;height:6px;background:#9ca3af;border-radius:9999px;animation:cv-pulse 1.2s infinite}\n" +
    ".typing span:nth-child(2){animation-delay:.2s}\n" +
    ".typing span:nth-child(3){animation-delay:.4s}\n" +
    ".quick{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}\n" +
    ".quick button{background:transparent;border:1px solid;padding:6px 12px;border-radius:9999px;font-size:12px;font-weight:500;cursor:pointer;font-family:inherit}\n" +
    ".quick button:hover{filter:brightness(.97)}\n" +
    ".lead-cta{align-self:flex-start;margin-top:4px;background:#fff;border:1px solid #ececf4;padding:8px 12px;border-radius:10px;font-size:12px;color:#374151;cursor:pointer}\n" +
    ".lead-cta:hover{background:#f8f8fc}\n" +
    ".input{border-top:1px solid #ececf4;background:#fff;padding:10px}\n" +
    ".inputbox{display:flex;gap:8px;align-items:center;background:#f3f4f6;border-radius:12px;padding:6px 8px 6px 14px}\n" +
    ".inputbox input{flex:1;border:0;background:transparent;font-size:14px;outline:none;color:#111827;padding:8px 0;font-family:inherit}\n" +
    ".inputbox button{width:32px;height:32px;border-radius:8px;border:0;cursor:pointer;color:#fff;display:flex;align-items:center;justify-content:center;flex:none}\n" +
    ".inputbox button:disabled{opacity:.4;cursor:not-allowed}\n" +
    ".branding{text-align:center;font-size:10px;color:#9ca3af;padding:6px 0 0}\n" +
    ".branding a{color:inherit;font-weight:600;text-decoration:none}\n" +
    ".lead-form{padding:16px;background:#fff;border-top:1px solid #ececf4}\n" +
    ".lead-form h5{margin:0 0 4px;font-size:13px;font-weight:600;color:#111827}\n" +
    ".lead-form p{margin:0 0 12px;font-size:12px;color:#6b7280}\n" +
    ".lead-form input,.lead-form textarea{width:100%;border:1px solid #e5e7eb;border-radius:8px;padding:8px 10px;font-size:13px;margin-bottom:8px;outline:none;font-family:inherit}\n" +
    ".lead-form input:focus,.lead-form textarea:focus{border-color:var(--brand)}\n" +
    ".lead-form .row{display:flex;gap:8px}\n" +
    ".lead-form .row > *{flex:1}\n" +
    ".lead-form button{width:100%;padding:9px;color:#fff;border:0;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit}\n" +
    ".lead-form .cancel{background:transparent;color:#6b7280;margin-top:4px}\n" +
    ".lead-success{text-align:center;padding:18px 16px;color:#065f46;background:#ecfdf5}\n" +
    "@media (max-width:480px){.panel{width:calc(100vw - 24px);height:80vh;bottom:80px}}\n";

  var styleEl = document.createElement("style");
  styleEl.textContent = STYLES;
  root.appendChild(styleEl);

  // ── State ────────────────────────────────────────────────────
  var state = {
    config: null,
    open: false,
    messages: [],   // { role: 'user'|'bot'|'err'|'lead-cta', content, leadShown }
    streaming: false,
    leadOpen: false,
    leadSent: false,
  };

  // ── Render orchestration ─────────────────────────────────────
  var launcherEl = null;
  var panelEl = null;

  function ensureLauncher() {
    if (launcherEl) return;
    launcherEl = document.createElement("button");
    launcherEl.className = "launcher";
    launcherEl.setAttribute("aria-label", "Sohbet aç");
    launcherEl.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12c0-4.5 4-8 9-8s9 3.5 9 8-4 8-9 8c-1.4 0-2.7-.3-3.9-.7L3 21l1.3-4A8.5 8.5 0 0 1 3 12Z"/></svg>';
    launcherEl.style.background = state.config.primaryColor;
    launcherEl.classList.add(state.config.widgetPosition === "bottom-left" ? "pos-left" : "pos-right");
    launcherEl.addEventListener("click", togglePanel);
    root.appendChild(launcherEl);
  }

  function togglePanel() {
    if (state.open) closePanel();
    else openPanel();
  }

  function openPanel() {
    state.open = true;
    try { sessionStorage.setItem(OPEN_KEY, "1"); } catch (_) {}
    if (panelEl) { panelEl.style.display = "flex"; return; }
    renderPanel();
  }

  function closePanel() {
    state.open = false;
    try { sessionStorage.removeItem(OPEN_KEY); } catch (_) {}
    if (panelEl) panelEl.style.display = "none";
  }

  function renderPanel() {
    var cfg = state.config;
    var primary = cfg.primaryColor;
    panelEl = document.createElement("div");
    panelEl.className = "panel";
    panelEl.style.setProperty("--brand", primary);
    panelEl.classList.add(cfg.widgetPosition === "bottom-left" ? "pos-left" : "pos-right");
    panelEl.style[cfg.widgetPosition === "bottom-left" ? "left" : "right"] = "20px";

    panelEl.innerHTML = panelHTML(cfg);
    root.appendChild(panelEl);

    // Wire actions
    panelEl.querySelector(".close").addEventListener("click", closePanel);
    panelEl.querySelector("form.composer").addEventListener("submit", onSubmit);

    renderMessages();
  }

  function panelHTML(cfg) {
    var primary = cfg.primaryColor;
    var initials = (cfg.name || "?").slice(0, 2).toUpperCase();
    return (
      '<div class="header" style="background:' + primary + '">' +
        '<div class="meta">' +
          '<div class="avatar">' + escapeHtml(initials) + '</div>' +
          '<div><h4>' + escapeHtml(cfg.name) + '</h4><p><span class="dot"></span>Çevrimiçi</p></div>' +
        '</div>' +
        '<button class="close" aria-label="Kapat">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="messages" id="cv-msgs"></div>' +
      '<div id="cv-leadwrap"></div>' +
      '<form class="composer input" autocomplete="off">' +
        '<div class="inputbox">' +
          '<input id="cv-input" type="text" placeholder="Sorunuzu yazın..." maxlength="2000" />' +
          '<button type="submit" style="background:' + primary + '" id="cv-send" aria-label="Gönder">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' +
          '</button>' +
        '</div>' +
        (cfg.showBranding ? '<div class="branding">Powered by <a href="https://chativo.ai" target="_blank" rel="noopener">Chativo</a></div>' : '') +
      '</form>'
    );
  }

  function renderMessages() {
    if (!panelEl) return;
    var box = panelEl.querySelector("#cv-msgs");
    var cfg = state.config;
    var primary = cfg.primaryColor;
    var html = "";

    if (state.messages.length === 0) {
      html += '<div class="msg bot">' + escapeHtml(cfg.welcomeMessage || "Merhaba 👋 Size nasıl yardımcı olabilirim?") + '</div>';
      if (cfg.quickQuestions && cfg.quickQuestions.length) {
        html += '<div class="quick">';
        for (var i = 0; i < Math.min(cfg.quickQuestions.length, 4); i++) {
          var q = cfg.quickQuestions[i];
          html += '<button data-q="' + escapeAttr(q.label) + '" style="border-color:' + primary + '33;background:' + primary + '10;color:' + primary + '">' + escapeHtml(q.label) + '</button>';
        }
        html += '</div>';
      }
    } else {
      for (var j = 0; j < state.messages.length; j++) {
        var m = state.messages[j];
        if (m.role === "user") {
          html += '<div class="msg user" style="background:' + primary + '">' + escapeHtml(m.content) + '</div>';
        } else if (m.role === "bot") {
          html += '<div class="msg bot">' + (m.content ? escapeHtml(m.content) : '') + '</div>';
        } else if (m.role === "err") {
          html += '<div class="msg err">' + escapeHtml(m.content) + '</div>';
        } else if (m.role === "lead-cta") {
          html += '<button class="lead-cta" data-action="open-lead">📩 İletişim bilgilerimi bırak</button>';
        }
      }
      if (state.streaming && state.messages.length && state.messages[state.messages.length - 1].role !== "bot") {
        html += '<div class="typing"><span></span><span></span><span></span></div>';
      } else if (state.streaming) {
        // streaming inside an empty bot bubble — bubble exists already
      }
    }

    box.innerHTML = html;

    // Wire dynamic buttons
    var quicks = box.querySelectorAll(".quick button");
    quicks.forEach(function (b) {
      b.addEventListener("click", function () { sendMessage(b.getAttribute("data-q")); });
    });
    var leadCtas = box.querySelectorAll('[data-action="open-lead"]');
    leadCtas.forEach(function (b) { b.addEventListener("click", openLeadForm); });

    box.scrollTop = box.scrollHeight;
  }

  // ── Compose / send ───────────────────────────────────────────
  function onSubmit(e) {
    e.preventDefault();
    var input = panelEl.querySelector("#cv-input");
    var v = (input.value || "").trim();
    if (!v) return;
    input.value = "";
    sendMessage(v);
  }

  function sendMessage(text) {
    if (state.streaming) return;
    state.messages.push({ role: "user", content: text });
    state.streaming = true;
    renderMessages();

    var botMsg = { role: "bot", content: "" };
    state.messages.push(botMsg);
    renderMessages();

    var payload = {
      visitorId: getVisitorId(),
      conversationId: getConvoId() || undefined,
      message: text,
    };

    fetch(BASE + "/api/widget/" + encodeURIComponent(CHATBOT_ID) + "/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        if (!res.ok) {
          return res.text().then(function (t) {
            var err = "Beklenmeyen hata oluştu.";
            if (res.status === 429) err = "Çok hızlı yazdınız, biraz bekleyin.";
            else if (res.status === 402) err = "Bu bot bu ayki mesaj limitine ulaştı.";
            else if (res.status === 410) err = "Bu bot şu anda devre dışı.";
            else if (res.status === 403) err = "Bu bot bu siteden çalışacak şekilde yapılandırılmamış.";
            throw new Error(err);
          });
        }
        return readSse(res, function (ev) {
          if (ev.type === "meta" && ev.conversationId) setConvoId(ev.conversationId);
          if (ev.type === "delta") {
            botMsg.content += ev.content;
            renderMessages();
            maybeShowLeadCta(botMsg);
          }
          if (ev.type === "error") {
            state.messages[state.messages.length - 1] = { role: "err", content: ev.message };
            renderMessages();
          }
        });
      })
      .catch(function (err) {
        state.messages[state.messages.length - 1] = { role: "err", content: err && err.message ? err.message : "Hata" };
        renderMessages();
      })
      .finally(function () {
        state.streaming = false;
        renderMessages();
        maybeShowLeadCta(botMsg);
      });
  }

  function maybeShowLeadCta(botMsg) {
    if (!state.config.showLeadFormOnFallback) return;
    if (state.leadSent) return;
    if (state.messages.some(function (m) { return m.role === "lead-cta"; })) return;
    var text = (botMsg.content || "").toLowerCase();
    var triggers = ["bulamadım", "iletişim", "bilgi bulamadım", "couldn't find", "could not find", "leave your contact"];
    var hit = false;
    for (var i = 0; i < triggers.length; i++) if (text.indexOf(triggers[i]) !== -1) { hit = true; break; }
    if (hit) {
      state.messages.push({ role: "lead-cta" });
      renderMessages();
    }
  }

  function openLeadForm() {
    if (!panelEl) return;
    var wrap = panelEl.querySelector("#cv-leadwrap");
    var primary = state.config.primaryColor;
    wrap.innerHTML =
      '<form class="lead-form" id="cv-leadform">' +
        '<h5>İletişim bilgilerinizi bırakın</h5>' +
        '<p>Ekibimiz en kısa sürede dönüş yapsın.</p>' +
        '<input type="text" name="name" placeholder="Ad soyad" maxlength="120" />' +
        '<div class="row">' +
          '<input type="email" name="email" placeholder="E-posta" maxlength="200" required />' +
          '<input type="tel" name="phone" placeholder="Telefon" maxlength="40" />' +
        '</div>' +
        '<textarea name="message" placeholder="Mesajınız (opsiyonel)" maxlength="1000" rows="2"></textarea>' +
        '<button type="submit" style="background:' + primary + '">Gönder</button>' +
        '<button type="button" class="cancel" id="cv-leadcancel">İptal</button>' +
      '</form>';
    wrap.querySelector("#cv-leadcancel").addEventListener("click", function () { wrap.innerHTML = ""; });
    wrap.querySelector("#cv-leadform").addEventListener("submit", submitLead);
  }

  function submitLead(e) {
    e.preventDefault();
    var f = e.currentTarget;
    var data = {
      conversationId: getConvoId(),
      visitorId: getVisitorId(),
      name: f.elements.name.value || undefined,
      email: f.elements.email.value || undefined,
      phone: f.elements.phone.value || undefined,
      message: f.elements.message.value || undefined,
    };
    if (!data.conversationId) {
      f.parentElement.innerHTML = '<div class="lead-success" style="color:#b91c1c;background:#fef2f2">Önce birkaç mesaj atın, sonra tekrar deneyin.</div>';
      return;
    }
    var btn = f.querySelector('button[type="submit"]');
    btn.disabled = true;
    fetch(BASE + "/api/widget/" + encodeURIComponent(CHATBOT_ID) + "/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then(function (r) { if (!r.ok) throw new Error("send_failed"); return r.json(); })
      .then(function () {
        state.leadSent = true;
        f.parentElement.innerHTML = '<div class="lead-success">✓ Teşekkürler. En kısa sürede dönüş yapacağız.</div>';
      })
      .catch(function () {
        btn.disabled = false;
        f.insertAdjacentHTML("beforeend", '<div style="color:#b91c1c;font-size:12px;margin-top:6px">Gönderilemedi, tekrar deneyin.</div>');
      });
  }

  // ── SSE reader ───────────────────────────────────────────────
  function readSse(res, onEvent) {
    var reader = res.body.getReader();
    var decoder = new TextDecoder();
    var buffer = "";
    function pump() {
      return reader.read().then(function (r) {
        if (r.done) return;
        buffer += decoder.decode(r.value, { stream: true });
        var chunks = buffer.split("\n\n");
        buffer = chunks.pop();
        for (var i = 0; i < chunks.length; i++) {
          var line = chunks[i];
          if (line.indexOf("data: ") !== 0) continue;
          try { onEvent(JSON.parse(line.slice(6))); } catch (_) {}
        }
        return pump();
      });
    }
    return pump();
  }

  // ── Helpers ──────────────────────────────────────────────────
  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function escapeAttr(s) { return escapeHtml(s); }

  // ── Init: fetch config, render launcher, restore open state ──
  fetch(BASE + "/api/widget/" + encodeURIComponent(CHATBOT_ID) + "/config")
    .then(function (r) { if (!r.ok) throw new Error("config_failed"); return r.json(); })
    .then(function (cfg) {
      state.config = cfg;
      ensureLauncher();
      try {
        if (sessionStorage.getItem(OPEN_KEY)) openPanel();
      } catch (_) {}
    })
    .catch(function (err) {
      // Stay silent on the host page — don't break their site if config fails.
      try { console.warn("[Chativo] widget config failed:", err && err.message); } catch (_) {}
    });
})();
